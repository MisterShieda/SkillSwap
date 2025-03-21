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