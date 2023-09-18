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

  const docktors = [generateUUID(), generateUUID(), generateUUID(), generateUUID()];
  const users = [generateUUID(), generateUUID(), generateUUID(), generateUUID()];
  const appointments = [generateUUID(), generateUUID(), generateUUID(), generateUUID(), generateUUID(), generateUUID(), generateUUID()];
  const schedules = [generateUUID(), generateUUID(), generateUUID(), generateUUID(), generateUUID(), generateUUID()];

  // Заполняем таблицу Users
  const addUser = async () => {
    const connection = await mysql.createConnection(config);
  
    try {
      await connection.execute(`
        INSERT INTO Users (id, phone, name, email)
        VALUES (?, '+7 913 743 24 35', 'Иван', 'ivan@example.com'),
               (?, '+7 912 345 21 33', 'Анна', 'anna@example.com'),
               (?, '+7 911 435 75 56', 'Мария', 'masha@example.com'),
               (?, '+7 910 836 45 23', 'Даниил', 'danil@example.com');
      `, [users[0], users[1], users[2], users[3]]);
  
      console.log('Users added successfully.');
    } catch (error) {
      console.error('Error adding users:', error);
    } finally {
      await connection.end();
    }
  };
  
  // Заполняем таблицу Doctors
  const addDoctor = async () => {
    const connection = await mysql.createConnection(config);
  
    try {
      await connection.execute(`
        INSERT INTO Doctors (id, name, spec)
        VALUES (?, 'Сергей', 'Терапевт'),
               (?, 'Мария', 'Педиатр'),
               (?, 'Иван', 'Офтальмолог'),
               (?, 'Наталья', 'Травматолог');
      `, [docktors[0], docktors[1], docktors[2], docktors[3]]);
  
      console.log('Doctors added successfully.');
    } catch (error) {
      console.error('Error adding doctors:', error);
    } finally {
      await connection.end();
    }
  };

  // Заполняем таблицу Appointments
  const addAppointment = async () => {
    const connection = await mysql.createConnection(config);
  
    try {
      await connection.execute(`
        INSERT INTO Appointments (id, doctor_id, user_id, date_time)
        VALUES (?, ?, ?, '2023-09-17 10:00:00'),
               (?, ?, ?, '2023-09-17 11:30:00'),

               (?, ?, ?, '2023-09-18 08:30:00'),
               (?, ?, ?, '2023-09-18 08:30:00'),
               (?, ?, ?, '2023-09-18 10:00:00'),
               
               (?, ?, ?, '2023-09-19 11:00:00'),
               (?, ?, ?, '2023-09-19 11:30:00');
      `, [appointments[0], docktors[0], users[0], 
          appointments[1], docktors[1], users[1],

          appointments[2], docktors[2], users[2],
          appointments[3], docktors[3], users[3],
          appointments[4], docktors[2], users[3],

          appointments[5], docktors[1], users[3],
          appointments[6], docktors[0], users[2],]);
  
      console.log('Appointments added successfully.');
    } catch (error) {
      console.error('Error adding appointments:', error);
    } finally {
      await connection.end();
    }
  };
  
  // Таблица Schedule заполнится автоматически при заполнение таблицы Appointments, 
  // благодоря ранее созданному триггеру

  const populateTables = async () => {
    await addUser();
    await addDoctor();
    await addAppointment();
  };
  
  populateTables();