const mysql = require('mysql2');

// Създаване на връзка с базата данни
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',  // Заменете с вашето потребителско име
    password: '12345',  // Заменете с вашата парола
    database: 'user_database'  // Заменете с името на вашата база данни
});

// Експортиране на промиса за извършване на заявки
module.exports = pool.promise();
