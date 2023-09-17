const mysql = require('mysql2/promise');

const dbConfig = require('../dbConfig');

const config = {
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database
};


const clearUsers = async () => {
  const connection = await mysql.createConnection(config);

  try {
    await connection.execute('DELETE FROM Users;');
    console.log('Users table cleared.');
  } catch (error) {
    console.error('Error clearing Users table:', error);
  } finally {
    await connection.end();
  }
};

const clearDoctors = async () => {
  const connection = await mysql.createConnection(config);

  try {
    await connection.execute('DELETE FROM Doctors;');
    console.log('Doctors table cleared.');
  } catch (error) {
    console.error('Error clearing Doctors table:', error);
  } finally {
    await connection.end();
  }
};

const clearSchedule = async () => {
  const connection = await mysql.createConnection(config);

  try {
    await connection.execute('DELETE FROM Schedule;');
    console.log('Schedule table cleared.');
  } catch (error) {
    console.error('Error clearing Schedule table:', error);
  } finally {
    await connection.end();
  }
};

const clearAppointments = async () => {
  const connection = await mysql.createConnection(config);

  try {
    await connection.execute('DELETE FROM Appointments;');
    console.log('Appointments table cleared.');
  } catch (error) {
    console.error('Error clearing Appointments table:', error);
  } finally {
    await connection.end();
  }
};

const clearAllTables = async () => {
  await clearAppointments();
  await clearSchedule();
  await clearDoctors();
  await clearUsers();
};

// Вызываем функцию для очистки всех таблиц
clearAllTables();
