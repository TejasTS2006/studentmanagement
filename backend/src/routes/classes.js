const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all classes (public endpoint for registration)
router.get('/public', (req, res) => {
  const query = `
    SELECT c.*, t.name as teacher_name
    FROM classes c
    LEFT JOIN teachers t ON c.teacher_id = t.id
    ORDER BY c.class_name, c.section
  `;
  
  db.all(query, [], (err, classes) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    res.json({ classes });
  });
});

// Get all classes (authenticated)
router.get('/', authenticate, (req, res) => {
  const { teacher_id } = req.query;
  
  let query = `
    SELECT c.*, t.name as teacher_name, t.subject as teacher_subject,
      (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count
    FROM classes c
    LEFT JOIN teachers t ON c.teacher_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (teacher_id) {
    query += ' AND c.teacher_id = ?';
    params.push(teacher_id);
  }

  query += ' ORDER BY c.class_name, c.section';

  db.all(query, params, (err, classes) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    res.json({ classes });
  });
});

// Get class by ID
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT c.*, t.name as teacher_name, t.subject as teacher_subject
     FROM classes c
     LEFT JOIN teachers t ON c.teacher_id = t.id
     WHERE c.id = ?`,
    [id],
    (err, classData) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }

      if (!classData) {
        return res.status(404).json({ message: 'Class not found.' });
      }

      // Get students in class
      db.all(
        `SELECT s.* FROM students s
         WHERE s.class_id = ?
         ORDER BY s.name`,
        [id],
        (err, students) => {
          if (err) {
            return res.status(500).json({ message: 'Database error.', error: err.message });
          }

          res.json({ 
            class: { ...classData, students }
          });
        }
      );
    }
  );
});

// Create class
router.post('/', authenticate, authorize(['admin']), (req, res) => {
  const { class_name, section, teacher_id } = req.body;

  if (!class_name) {
    return res.status(400).json({ message: 'Class name is required.' });
  }

  const id = uuidv4();

  db.run(
    `INSERT INTO classes (id, class_name, section, teacher_id) 
     VALUES (?, ?, ?, ?)`,
    [id, class_name, section, teacher_id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to create class.', error: err.message });
      }

      res.status(201).json({ 
        message: 'Class created successfully.',
        class: { id, class_name, section, teacher_id }
      });
    }
  );
});

// Update class
router.put('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const { class_name, section, teacher_id } = req.body;

  if (!class_name) {
    return res.status(400).json({ message: 'Class name is required.' });
  }

  db.run(
    `UPDATE classes 
     SET class_name = ?, section = ?, teacher_id = ?
     WHERE id = ?`,
    [class_name, section, teacher_id, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to update class.', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Class not found.' });
      }

      res.json({ message: 'Class updated successfully.' });
    }
  );
});

// Delete class
router.delete('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM classes WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete class.', error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    res.json({ message: 'Class deleted successfully.' });
  });
});

// Add student to class
router.post('/:id/students', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({ message: 'Student ID is required.' });
  }

  db.run(
    'UPDATE students SET class_id = ? WHERE id = ?',
    [id, student_id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to add student to class.', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Student not found.' });
      }

      res.json({ message: 'Student added to class successfully.' });
    }
  );
});

// Remove student from class
router.delete('/:id/students/:studentId', authenticate, authorize(['admin']), (req, res) => {
  const { id, studentId } = req.params;

  db.run(
    'UPDATE students SET class_id = NULL WHERE id = ? AND class_id = ?',
    [studentId, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to remove student from class.', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Student not found in this class.' });
      }

      res.json({ message: 'Student removed from class successfully.' });
    }
  );
});

// Get class attendance
router.get('/:id/attendance', authenticate, (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  let query = `
    SELECT a.*, s.name as student_name, s.student_id
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    WHERE a.class_id = ?
  `;
  const params = [id];

  if (date) {
    query += ' AND a.date = ?';
    params.push(date);
  }

  query += ' ORDER BY s.name';

  db.all(query, params, (err, attendance) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    res.json({ attendance });
  });
});

// Get class marks
router.get('/:id/marks', authenticate, (req, res) => {
  const { id } = req.params;
  const { subject, exam_type } = req.query;

  let query = `
    SELECT m.*, s.name as student_name, s.student_id
    FROM marks m
    JOIN students s ON m.student_id = s.id
    WHERE m.class_id = ?
  `;
  const params = [id];

  if (subject) {
    query += ' AND m.subject = ?';
    params.push(subject);
  }

  if (exam_type) {
    query += ' AND m.exam_type = ?';
    params.push(exam_type);
  }

  query += ' ORDER BY s.name, m.subject';

  db.all(query, params, (err, marks) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    res.json({ marks });
  });
});

module.exports = router;
