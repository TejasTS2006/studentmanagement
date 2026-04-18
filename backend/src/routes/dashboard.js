const express = require('express');
const db = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, (req, res) => {
  const stats = {};

  // Get total students
  db.get('SELECT COUNT(*) as count FROM students', [], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error.', error: err.message });
    stats.totalStudents = result.count;

    // Get total teachers
    db.get('SELECT COUNT(*) as count FROM teachers', [], (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error.', error: err.message });
      stats.totalTeachers = result.count;

      // Get total classes
      db.get('SELECT COUNT(*) as count FROM classes', [], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error.', error: err.message });
        stats.totalClasses = result.count;

        // Get today's attendance
        const today = new Date().toISOString().split('T')[0];
        db.get(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
            SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late
           FROM attendance WHERE date = ?`,
          [today],
          (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error.', error: err.message });
            stats.todayAttendance = result;

            // Get recent students
            db.all(
              'SELECT * FROM students ORDER BY created_at DESC LIMIT 5',
              [],
              (err, students) => {
                if (err) return res.status(500).json({ message: 'Database error.', error: err.message });
                stats.recentStudents = students;

                res.json({ stats });
              }
            );
          }
        );
      });
    });
  });
});

// Get attendance summary for chart
router.get('/attendance-summary', authenticate, (req, res) => {
  const { days = 7 } = req.query;
  
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  const promises = dates.map(date => {
    return new Promise((resolve) => {
      db.get(
        `SELECT 
          ? as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
          SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late
         FROM attendance WHERE date = ?`,
        [date, date],
        (err, result) => {
          if (err) {
            resolve({ date, total: 0, present: 0, absent: 0, late: 0 });
          } else {
            resolve(result || { date, total: 0, present: 0, absent: 0, late: 0 });
          }
        }
      );
    });
  });

  Promise.all(promises).then(summary => {
    res.json({ summary });
  });
});

// Get class-wise student distribution
router.get('/class-distribution', authenticate, (req, res) => {
  db.all(
    `SELECT 
      c.class_name,
      c.section,
      COUNT(s.id) as student_count
     FROM classes c
     LEFT JOIN students s ON c.id = s.class_id
     GROUP BY c.id
     ORDER BY c.class_name, c.section`,
    [],
    (err, distribution) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }
      res.json({ distribution });
    }
  );
});

// Get gender distribution
router.get('/gender-distribution', authenticate, (req, res) => {
  db.all(
    `SELECT 
      gender,
      COUNT(*) as count
     FROM students
     WHERE gender IS NOT NULL
     GROUP BY gender`,
    [],
    (err, distribution) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }
      res.json({ distribution });
    }
  );
});

// Export data as CSV
router.get('/export/:type', authenticate, (req, res) => {
  const { type } = req.params;

  let query;
  let filename;

  switch (type) {
    case 'students':
      query = `
        SELECT s.student_id, s.name, s.age, s.gender, s.phone, s.email,
               c.class_name, c.section
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        ORDER BY s.name
      `;
      filename = 'students.csv';
      break;
    case 'teachers':
      query = `
        SELECT teacher_id, name, subject, phone, email
        FROM teachers
        ORDER BY name
      `;
      filename = 'teachers.csv';
      break;
    case 'attendance':
      query = `
        SELECT a.date, s.student_id, s.name as student_name,
               c.class_name, a.status
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        LEFT JOIN classes c ON a.class_id = c.id
        ORDER BY a.date DESC, s.name
      `;
      filename = 'attendance.csv';
      break;
    case 'marks':
      query = `
        SELECT s.student_id, s.name as student_name, c.class_name,
               m.subject, m.exam_type, m.marks_obtained, m.max_marks
        FROM marks m
        JOIN students s ON m.student_id = s.id
        LEFT JOIN classes c ON m.class_id = c.id
        ORDER BY s.name, m.subject, m.exam_type
      `;
      filename = 'marks.csv';
      break;
    default:
      return res.status(400).json({ message: 'Invalid export type.' });
  }

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No data to export.' });
    }

    // Convert to CSV
    const headers = Object.keys(rows[0]).join(',');
    const csvRows = rows.map(row => {
      return Object.values(row).map(value => {
        // Escape values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    const csv = [headers, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  });
});

module.exports = router;
