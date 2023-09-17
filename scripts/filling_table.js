const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const dbConfig = require('../dbConfig');

const config = {
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database
};

  const generateUUID = () => uuidv4();

  const docktors = [generateUUID(), generateUUID()];
  const users = [generateUUID(), generateUUID()];
  const appointments = [generateUUID(), generateUUID()];
  const schedules = [generateUUID(), generateUUID()];

  const addUser = async () => {
    const connection = await mysql.createConnection(config);
  
    try {
      await connection.execute(`
        INSERT INTO Users (id, phone, name, email)
        VALUES (?, '+7 913 743 24 35', 'Иван', 'ivan@example.com'),
               (?, '+7 912 111 22 33', 'Анна', 'anna@example.com');
      `, [users[0], users[1]]);
  
      console.log('Users added successfully.');
    } catch (error) {
      console.error('Error adding users:', error);
    } finally {
      await connection.end();
    }
  };
  
  const addDoctor = async () => {
    const connection = await mysql.createConnection(config);
  
    try {
      await connection.execute(`
        INSERT INTO Doctors (id, name, spec)
        VALUES (?, 'Сергей', 'Терапевт'),
               (?, 'Мария', 'Педиатр');
      `, [docktors[0], docktors[1]]);
  
      console.log('Doctors added successfully.');
    } catch (error) {
      console.error('Error adding doctors:', error);
    } finally {
      await connection.end();
    }
  };
  
  const addSchedule = async () => {
    const connection = await mysql.createConnection(config);
  
    try {
      await connection.execute(`
        INSERT INTO Schedule (id, doctor_id, date, slots)
        VALUES (?, ?, '2023-09-17', '[{"appointment_id": "${appointments[0]}", "date_time": "2023-09-17 10:00:00"}]'),
               (?, ?, '2023-09-18', '[{"appointment_id": "${appointments[1]}", "date_time": "2023-09-18 11:30:00"}]');
      `, [schedules[0], docktors[0], schedules[1], docktors[1]]);

  
      console.log('Schedule added successfully.');
    } catch (error) {
      console.error('Error adding schedule:', error);
    } finally {
      await connection.end();
    }
  };
  
  const addAppointment = async () => {
    const connection = await mysql.createConnection(config);
  
    try {
      await connection.execute(`
        INSERT INTO Appointments (id, doctor_id, user_id, date_time)
        VALUES (?, ?, ?, '2023-09-17 10:00:00'),
               (?, ?, ?, '2023-09-18 11:30:00');
      `, [appointments[0], docktors[0], users[0], appointments[1], docktors[1], users[1]]);
  
      console.log('Appointments added successfully.');
    } catch (error) {
      console.error('Error adding appointments:', error);
    } finally {
      await connection.end();
    }
  };
  
  const populateTables = async () => {
    await addUser();
    await addDoctor();
    await addSchedule();
    await addAppointment();
  };
  
  // Вызываем функцию для заполнения таблиц данными
  populateTables();