const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost', // или IP адрес на сървъра
    user: 'root', // замени с твоя потребител
    password: '12345', // замени с твоята парола
    database: 'user_database'
});

connection.connect(err => {
    if (err) {
        console.error('Грешка при свързването с MySQL:', err);
        return;
    }
    console.log('Свързването с MySQL е успешно!');
});

module.exports = connection;
