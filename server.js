const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs"); // за криптиране на паролата
const db = require("./db"); // файлът, който съдържа връзката с базата данни

const app = express();
const port = 5000;

app.use(bodyParser.json());

app.post("/register", async (req, res) => {
    const { username, email, bio, age, full_name, password, role } = req.body;

    // Проверка дали всички полета са попълнени
    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "Моля, попълнете всички полета!" });
    }

    // Проверка дали потребителят вече съществува
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (rows.length > 0) {
            return res.status(400).json({ message: "Имейлът вече е зает!" });
        }
    } catch (err) {
        console.error('Грешка при проверка за съществуващ потребител: ', err);
        return res.status(500).json({ message: "Грешка при проверка на имейл." });
    }

    // Хеширане на паролата преди да я запишем в базата
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Записване на новия потребител в базата данни
        await db.query(
            "INSERT INTO users (username, email, bio, age, full_name, password_hash, typea) VALUES (?, ?, ?, ?)",
            [username, email, bio, age, full_name,  hashedPassword, role]
        );
        
        res.status(201).json({ message: "Регистрацията е успешна!" });
    } catch (err) {
        console.error('Грешка при записване на потребител: ', err);
        return res.status(500).json({ message: "Грешка при записване на потребителя!" });
    }
});


app.listen(port, () => {
    console.log(`Сървърът работи на http://localhost:${port}`);
});
