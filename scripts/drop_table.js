const mysql = require('mysql2/promise');
const dbConfig = require('../dbConfig');

const config = {
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database
};

const dropTables = async () => {
  const connection = await mysql.createConnection(config);

  try {
    // Удаляем таблицы в обратном порядке, чтобы избежать ошибок из-за внешних ключей
    await connection.execute('DROP TABLE IF EXISTS Appointments;');
    await connection.execute('DROP TABLE IF EXISTS Schedule;');
    await connection.execute('DROP TABLE IF EXISTS Doctors;');
    await connection.execute('DROP TABLE IF EXISTS Users;');
    await connection.execute('DROP TABLE IF EXISTS tasks;');
    await connection.execute('DROP TABLE IF EXISTS calls;');

    console.log('All tables dropped successfully.');
  } catch (error) {
    console.error('Error dropping tables:', error);
  } finally {
    await connection.end();
  }
};

// Вызываем функцию для удаления таблиц
dropTables();
