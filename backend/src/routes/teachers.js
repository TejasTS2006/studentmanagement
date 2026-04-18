const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all teachers
router.get('/', authenticate, (req, res) => {
  const { search } = req.query;
  
  let query = `
    SELECT t.*, u.username, u.email as user_email
    FROM teachers t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (t.name LIKE ? OR t.teacher_id LIKE ? OR t.subject LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY t.name';

  db.all(query, params, (err, teachers) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    res.json({ teachers });
  });
});

// Get teacher by ID
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT t.*, u.username, u.email as user_email
     FROM teachers t
     LEFT JOIN users u ON t.user_id = u.id
     WHERE t.id = ?`,
    [id],
    (err, teacher) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }

      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found.' });
      }

      res.json({ teacher });
    }
  );
});

// Create teacher
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { teacher_id, name, subject, phone, email, username, password } = req.body;

  if (!teacher_id || !name || !subject) {
    return res.status(400).json({ message: 'Teacher ID, name, and subject are required.' });
  }

  const id = uuidv4();
  let userId = null;

  // Create user account if username and password provided
  if (username && password) {
    userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (id, username, password, role, email) VALUES (?, ?, ?, ?, ?)',
      [userId, username, hashedPassword, 'teacher', email],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'Username already exists.' });
          }
          return res.status(500).json({ message: 'Failed to create user account.', error: err.message });
        }
      }
    );
  }

  db.run(
    `INSERT INTO teachers (id, teacher_id, name, subject, phone, email, user_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, teacher_id, name, subject, phone, email, userId],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ message: 'Teacher ID already exists.' });
        }
        return res.status(500).json({ message: 'Failed to create teacher.', error: err.message });
      }

      res.status(201).json({ 
        message: 'Teacher created successfully.',
        teacher: { id, teacher_id, name, subject, phone, email, user_id: userId }
      });
    }
  );
});

// Update teacher
router.put('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const { teacher_id, name, subject, phone, email } = req.body;

  if (!teacher_id || !name || !subject) {
    return res.status(400).json({ message: 'Teacher ID, name, and subject are required.' });
  }

  db.run(
    `UPDATE teachers 
     SET teacher_id = ?, name = ?, subject = ?, phone = ?, email = ?
     WHERE id = ?`,
    [teacher_id, name, subject, phone, email, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ message: 'Teacher ID already exists.' });
        }
        return res.status(500).json({ message: 'Failed to update teacher.', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Teacher not found.' });
      }

      res.json({ message: 'Teacher updated successfully.' });
    }
  );
});

// Delete teacher
router.delete('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;

  db.get('SELECT user_id FROM teachers WHERE id = ?', [id], (err, teacher) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    db.run('DELETE FROM teachers WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to delete teacher.', error: err.message });
      }

      // Also delete associated user account
      if (teacher.user_id) {
        db.run('DELETE FROM users WHERE id = ?', [teacher.user_id]);
      }

      res.json({ message: 'Teacher deleted successfully.' });
    });
  });
});

// Get teacher's classes
router.get('/:id/classes', authenticate, (req, res) => {
  const { id } = req.params;

  db.all(
    `SELECT c.*, 
      (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count
     FROM classes c
     WHERE c.teacher_id = ?
     ORDER BY c.class_name`,
    [id],
    (err, classes) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }
      res.json({ classes });
    }
  );
});

module.exports = router;
