const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all students
router.get('/', authenticate, (req, res) => {
  const { class_id, search } = req.query;
  
  let query = `
    SELECT s.*, c.class_name, c.section, t.name as teacher_name 
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN teachers t ON c.teacher_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (class_id) {
    query += ' AND s.class_id = ?';
    params.push(class_id);
  }

  if (search) {
    query += ' AND (s.name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY s.name';

  db.all(query, params, (err, students) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    res.json({ students });
  });
});

// Get student by ID
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT s.*, c.class_name, c.section, t.name as teacher_name 
     FROM students s
     LEFT JOIN classes c ON s.class_id = c.id
     LEFT JOIN teachers t ON c.teacher_id = t.id
     WHERE s.id = ?`,
    [id],
    (err, student) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }

      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }

      res.json({ student });
    }
  );
});

// Create student
router.post('/', authenticate, authorize(['admin']), (req, res) => {
  const { student_id, name, age, gender, class_id, phone, email } = req.body;

  if (!student_id || !name) {
    return res.status(400).json({ message: 'Student ID and name are required.' });
  }

  const id = uuidv4();

  db.run(
    `INSERT INTO students (id, student_id, name, age, gender, class_id, phone, email) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, student_id, name, age, gender, class_id, phone, email],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ message: 'Student ID already exists.' });
        }
        return res.status(500).json({ message: 'Failed to create student.', error: err.message });
      }

      res.status(201).json({ 
        message: 'Student created successfully.',
        student: { id, student_id, name, age, gender, class_id, phone, email }
      });
    }
  );
});

// Update student
router.put('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const { student_id, name, age, gender, class_id, phone, email } = req.body;

  if (!student_id || !name) {
    return res.status(400).json({ message: 'Student ID and name are required.' });
  }

  db.run(
    `UPDATE students 
     SET student_id = ?, name = ?, age = ?, gender = ?, class_id = ?, phone = ?, email = ?
     WHERE id = ?`,
    [student_id, name, age, gender, class_id, phone, email, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ message: 'Student ID already exists.' });
        }
        return res.status(500).json({ message: 'Failed to update student.', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Student not found.' });
      }

      res.json({ message: 'Student updated successfully.' });
    }
  );
});

// Delete student
router.delete('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete student.', error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    res.json({ message: 'Student deleted successfully.' });
  });
});

// Get student marks
router.get('/:id/marks', authenticate, (req, res) => {
  const { id } = req.params;

  db.all(
    `SELECT m.*, s.name as student_name, c.class_name
     FROM marks m
     JOIN students s ON m.student_id = s.id
     LEFT JOIN classes c ON m.class_id = c.id
     WHERE m.student_id = ?
     ORDER BY m.subject, m.exam_type`,
    [id],
    (err, marks) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }
      res.json({ marks });
    }
  );
});

// Get student attendance
router.get('/:id/attendance', authenticate, (req, res) => {
  const { id } = req.params;
  const { month, year } = req.query;

  let query = `
    SELECT a.*, s.name as student_name, c.class_name
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE a.student_id = ?
  `;
  const params = [id];

  if (month && year) {
    query += ' AND strftime("%m", a.date) = ? AND strftime("%Y", a.date) = ?';
    params.push(month.padStart(2, '0'), year);
  }

  query += ' ORDER BY a.date DESC';

  db.all(query, params, (err, attendance) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }

    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'Present').length;
    const absent = attendance.filter(a => a.status === 'Absent').length;
    const late = attendance.filter(a => a.status === 'Late').length;
    const percentage = total > 0 ? ((present + late * 0.5) / total * 100).toFixed(2) : 0;

    res.json({ 
      attendance,
      statistics: { total, present, absent, late, percentage }
    });
  });
});

module.exports = router;
