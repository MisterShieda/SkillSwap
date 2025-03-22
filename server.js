const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const db = require("./db");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const port = 5000;
const secretKey = "super_secret_key";

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Регистрация
app.post("/register", async (req, res) => {
    const { username, email, bio, age, full_name, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "Моля, попълнете всички полета!" });
    }

    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: "Имейлът вече е зает!" });
        }
    } catch (err) {
        console.error('Грешка при проверка за съществуващ потребител: ', err);
        return res.status(500).json({ message: "Грешка при проверка на имейл." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            "INSERT INTO users (username, email, bio, age, full_name, password_hash, typea) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [username, email, bio, age, full_name, hashedPassword, role]
        );
        res.status(201).json({ message: "Регистрацията е успешна!" });
    } catch (err) {
        console.error('Грешка при записване на потребител: ', err);
        return res.status(500).json({ message: "Грешка при записване на потребителя!" });
    }
});

// Вход
app.post("/login", async (req, res) => {
    const { username1, password } = req.body;

    if (!username1 || !password) {
        return res.status(400).json({ message: "Моля, попълнете всички полета!" });
    }

    try {
        const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username1]);
        if (rows.length === 0) {
            return res.status(400).json({ message: "Грешно потребителско име или парола!" });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Грешно потребителско име или парола!" });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: "1h" });
        res.json({ message: "Успешен вход!", token });
    } catch (err) {
        console.error("Грешка при вход:", err);
        res.status(500).json({ message: "Вътрешна грешка на сървъра!" });
    }
});

// Създаване на чат
app.post("/create-chat", async (req, res) => {
    const { user1, user2 } = req.body;
    await db.query("INSERT INTO chats (user_id_1, user_id_2) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=id", [user1, user2]);
    res.json({ message: "Чатът е създаден!" });
});

// Изпращане на съобщение
app.post("/send-message", async (req, res) => {
    const { chat_id, sender_id, message } = req.body;
    await db.query("INSERT INTO messages (chat_id, sender_id, message_text) VALUES (?, ?, ?)", [chat_id, sender_id, message]);
    res.json({ message: "Съобщението е изпратено!" });
});

// Вземане на съобщения за чат
app.get("/messages/:chat_id", async (req, res) => {
    const { chat_id } = req.params;
    const [messages] = await db.query("SELECT * FROM messages WHERE chat_id = ? ORDER BY sent_at ASC", [chat_id]);
    res.json(messages);
});
    
// НОВ ЕНДПОЙНТ: Вземане на всички предмети от базата данни
app.get("/api/subjects", async (req, res) => {
    try {
        const [subjects] = await db.query("SELECT * FROM subjects");
        res.json(subjects);
    } catch (err) {
        console.error("Грешка при вземане на предмети:", err);
        res.status(500).json({ message: "Грешка при зареждане на предметите!" });
    }
});

app.listen(port, () => {
    console.log(`Сървърът работи на http://127.0.0.1:${port}`);
});

app.get("/api/teachers", async (req, res) => {
    try {
        const subject = req.query.subject;
        const [rows] = await db.query(
            `SELECT u.full_name, u.email, u.bio, u.id
             FROM users u
             JOIN teacher_subjects ts ON u.id = ts.user_id
             JOIN subjects s ON ts.subject_id = s.id
             WHERE s.subject_name = ?`, 
            [subject]
        );
        res.json(rows);
    } catch (err) {
        console.error("Грешка при зареждане на учителите:", err);
        res.status(500).json({ message: "Грешка при зареждане на учителите!" });
    }
});
// НОВ ЕНДПОЙНТ: Добавяне на съотношение между потребител и предмет
app.post("/map-user-subject", async (req, res) => {
    const { user_id, subject_id } = req.body;

    if (!user_id || !subject_id) {
        return res.status(400).json({ message: "Моля, попълнете user_id и subject_id!" });
    }

    try {
        // Проверка дали вече съществува връзка между потребителя и предмета
        const [existingMapping] = await db.query(
            "SELECT * FROM teacher_subjects WHERE user_id = ? AND subject_id = ?", 
            [user_id, subject_id]
        );
        if (existingMapping.length > 0) {
            return res.status(400).json({ message: "Тази връзка вече съществува!" });
        }

        // Вмъкване на новата връзка в таблицата teacher_subjects
        await db.query(
            "INSERT INTO teacher_subjects (user_id, subject_id) VALUES (?, ?)", 
            [user_id, subject_id]
        );

        res.status(201).json({ message: "Връзката между потребителя и предмета е успешно създадена!" });
    } catch (err) {
        console.error("Грешка при добавяне на връзката:", err);
        res.status(500).json({ message: "Грешка при добавяне на връзката между потребителя и предмета!" });
    }
});// НОВ ЕНДПОЙНТ: Вземане на профилната информация на потребителя
// Middleware за проверка на токен
function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Извличаме токена от заглавието

    if (!token) {
        return res.status(401).json({ message: "Трябва да сте влезли, за да видите профила." });
    }

    jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Невалиден токен!" });
        }

        // Добавяме decoded данните в req, за да ги използваме в следващите етапи
        req.userId = decoded.id; 
        next();  // Продължаваме с обработката на заявката
    });
}

// Нов endpoint за профила
app.get("/profile", verifyToken, async (req, res) => {
    try {
        // Извличаме данни за потребителя от базата, използвайки id-то от декодирания токен
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [req.userId]);
         console.log(rows);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Потребителят не е намерен." });
        }

        const user = rows[0];
        res.json({
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            bio: user.bio,
            age: user.age,
            profile_picture_url: user.profile_picture_url || null  // Ако имаме URL на снимката
        });
    } catch (err) {
        console.error("Грешка при зареждане на профила:", err);
        res.status(500).json({ message: "Грешка при зареждане на профила." });
    }
});app.get("/teacher/:id", async (req, res) => {
    try {
        const teacherId = req.params.id;
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [teacherId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Учителят не е намерен." });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Грешка при зареждане на учителския профил:", err);
        res.status(500).json({ message: "Грешка в сървъра." });
    }
});





