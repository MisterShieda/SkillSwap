const express = require('express');
const db = require('./db'); // Импортваме връзката

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Грешка при извличане на данните');
            return;
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Сървърът работи на http://localhost:${port}`);
});
