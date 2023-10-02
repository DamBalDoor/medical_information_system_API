const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

const pool = require('./db.pool');
const router = require('./routes/routes');
// const emailInterface = require('./email');

app.use(express.json()); 
app.use('/api', router);

// emailInterface();

app.listen(PORT, async () => {
    try {
      console.log(`Server is running on port ${PORT}`);
      await pool.getConnection();
      console.log('Connected to MySQL database');
    } catch (error) {
      console.error('Error connecting to MySQL database:', error);
      process.exit(1);
    }
  });