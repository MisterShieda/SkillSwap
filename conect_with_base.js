const mysql = require('mysql')

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'user_database'
})

connection.connect(err => {
  if (err) {
    console.error('Грешка при свързването: ' + err.stack)
    return
  }
  console.log('Свързан като ID ' + connection.threadId)
})

connection.query('SELECT 1 + 1 AS solution', (err, rows) => {
  if (err) {
    console.error('Грешка при заявката: ' + err.stack)
    return
  }
  console.log('Резултатът е: ', rows[0].solution)
})

connection.end(err => {
  if (err) {
    console.error('Грешка при затварянето: ' + err.stack)
  } else {
    console.log('Връзката е затворена.')
  }
})
