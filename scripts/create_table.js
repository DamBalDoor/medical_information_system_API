const mysql = require('mysql2/promise');

const dbConfig = require('../dbConfig');

const config = {
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database
};

const createTables = async () => {
  const connection = await mysql.createConnection(config);

  try {
    // Создание таблицы Users
    await connection.execute(`
      CREATE TABLE Users (
        id VARCHAR(36) PRIMARY KEY,
        phone VARCHAR(20),
        name VARCHAR(255),
        email VARCHAR(255)
      );
    `);

    // Создание таблицы Doctors
    await connection.execute(`
      CREATE TABLE Doctors (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255),
        spec VARCHAR(255)
      );
    `);

    // Создание таблицы Schedule
    await connection.execute(`
      CREATE TABLE Schedule (
        id VARCHAR(36) PRIMARY KEY,
        doctor_id VARCHAR(36),
        date TIMESTAMP,
        slots JSON,
        FOREIGN KEY (doctor_id) REFERENCES Doctors(id)
      );
    `);

    // Создание таблицы Appointments
    await connection.execute(`
      CREATE TABLE Appointments (
        id VARCHAR(36) PRIMARY KEY,
        doctor_id VARCHAR(36),
        user_id VARCHAR(36),
        date_time TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES Doctors(id),
        FOREIGN KEY (user_id) REFERENCES Users(id)
      );
    `);

    console.log('Tables created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    // Важно закрыть соединение после выполнения запросов
    await connection.end();
  }
};

// Вызовем функцию создания таблиц
createTables();
