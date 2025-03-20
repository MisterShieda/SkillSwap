const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./db');  // Връзката с MySQL

const app = express();

// Добавяме body-parser за обработка на JSON данни
app.use(bodyParser.json());

// Маршрут за добавяне на нов потребител (регистрация)
app.post('/register', (req, res) => {
    const { username, email, password, role } = req.body;

    // SQL заявка за добавяне на нов потребител
    const query = 'INSERT INTO users (email, username, password_hash, full_name, age, bio, typea) VALUES (?, ?, ?, ?, ?, ?, ?)';

    // За демо цел ще оставим "full_name", "age" и "bio" с фиксирани стойности. Може да добавиш нови полета, ако искаш.
    const full_name = username; // Например, ползваме потребителското име като име
    const age = 18; // Може да добавиш поле за възраст или да го оставиш фиксирано
    const bio = "Нов потребител"; // Може да добавиш поле за био или да го оставиш фиксирано
    const typea = role === 'student' ? 'ученик' : 'учител'; // Проверяваме типа на потребителя

    // Изпълняваме заявката, без да криптираме паролата
    connection.query(query, [email, username, password, full_name, age, bio, typea], (err, result) => {
        if (err) {
            console.error('Грешка при добавяне на потребител:', err);
            return res.status(500).json({ message: 'Грешка при добавяне на потребител' });
        }
        // Успешно добавяне
        res.status(201).json({ message: 'Потребителят е добавен успешно!' });
    });
});

// Стартиране на сървъра на порт 5000
app.listen(5000, () => {
    console.log('Сървърът работи на порт 5000');
});
