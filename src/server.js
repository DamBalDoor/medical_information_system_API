const express = require('express');
const mysql = require('mysql2/promise');

const dbConfig = require('../dbConfig');


const app = express();
const PORT = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/', async (req, res) => {
    res.send('Home Page');
  });

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Users');
    res.json(rows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).send('Server Error');
  }
});

app.get('/api/doctors', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Doctors');
        res.json(rows);
    } catch (error) {
        console.error('Error executing MySQL query:', error);
        res.status(500).send('Server Error');
    }
    });

app.get('/api/schedule', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM Schedule');
      res.json(rows);
    } catch (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).send('Server Error');
    }
  });

app.get('/api/appointments', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM Appointments');
      res.json(rows);
    } catch (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).send('Server Error');
    }
  });

app.listen(PORT, async () => {
    try {
      console.log(`Server is running on port ${PORT}`);

      console.log('Connecting to MySQL database...');
      await pool.getConnection();
      console.log('Connected to MySQL database');
    } catch (error) {
      console.error('Error connecting to MySQL database:', error);
      process.exit(1); // Exit the process with an error
    }
  });