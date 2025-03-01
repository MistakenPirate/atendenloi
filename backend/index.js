const express = require('express');
const mysql = require('mysql2');
const cors = require('cors')
const app = express();
const port = 3000;

app.use(cors())
app.use(express.json());

const db = mysql.createConnection({
    host: 'mysql', // Docker service name for MySQL
    user: 'root',
    password: 'password',
    database: 'oil_attendance'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

app.post('/register', (req, res) => {
    const { name, employee_id, department, position } = req.body;

    if (!name || !employee_id) {
        return res.status(400).json({ error: 'Name and Employee ID are required' });
    }

    const query = 'INSERT INTO employees (name, employee_id, department, position) VALUES (?, ?, ?, ?)';
    db.query(query, [name, employee_id, department, position], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Employee registered successfully', id: result.insertId });
    });
});

app.get('/employees', (req, res) => {
    const query = 'SELECT * FROM employees';
    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json(results);
    });
  });

app.post('/attendance', (req, res) => {
    const { employee_id, date, status } = req.body;

    if (!employee_id || !date || !status) {
        return res.status(400).json({ error: 'Employee ID, Date, and Status are required' });
    }

    const query = 'INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?)';
    db.query(query, [employee_id, date, status], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Attendance recorded successfully', id: result.insertId });
    });
});

app.get('/attendance/:employee_id', (req, res) => {
    const { employee_id } = req.params;

    const query = 'SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC';
    db.query(query, [employee_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

app.listen(port, '0.0.0.0',() => {
    console.log(`Server running on http://localhost:${port}`);
});
