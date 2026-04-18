const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all attendance records
router.get('/', authenticate, (req, res) => {
  const { class_id, student_id, date, start_date, end_date } = req.query;
  
  let query = `
    SELECT a.*, s.name as student_name, s.student_id as student_code,
           c.class_name, c.section, t.name as marked_by_name
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    LEFT JOIN classes c ON a.class_id = c.id
    LEFT JOIN teachers t ON a.marked_by = t.id
    WHERE 1=1
  `;
  const params = [];

  if (class_id) {
    query += ' AND a.class_id = ?';
    params.push(class_id);
  }

  if (student_id) {
    query += ' AND a.student_id = ?';
    params.push(student_id);
  }

  if (date) {
    query += ' AND a.date = ?';
    params.push(date);
  }

  if (start_date && end_date) {
    query += ' AND a.date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }

  query += ' ORDER BY a.date DESC, s.name';

  db.all(query, params, (err, attendance) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    res.json({ attendance });
  });
});

// Get attendance by ID
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT a.*, s.name as student_name, s.student_id as student_code,
            c.class_name, c.section, t.name as marked_by_name
     FROM attendance a
     JOIN students s ON a.student_id = s.id
     LEFT JOIN classes c ON a.class_id = c.id
     LEFT JOIN teachers t ON a.marked_by = t.id
     WHERE a.id = ?`,
    [id],
    (err, record) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }

      if (!record) {
        return res.status(404).json({ message: 'Attendance record not found.' });
      }

      res.json({ attendance: record });
    }
  );
});

// Mark attendance (single or bulk)
router.post('/', authenticate, authorize(['admin', 'teacher']), (req, res) => {
  const { records } = req.body; // Array of { student_id, class_id, date, status }

  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'Attendance records are required.' });
  }

  const marked_by = req.user.teacher?.id || null;
  const errors = [];
  const success = [];

  const processRecord = (record) => {
    return new Promise((resolve) => {
      const { student_id, class_id, date, status } = record;

      if (!student_id || !class_id || !date || !status) {
        errors.push({ record, error: 'Missing required fields' });
        resolve();
        return;
      }

      const id = uuidv4();

      // Use INSERT OR REPLACE to handle updates for existing records
      db.run(
        `INSERT OR REPLACE INTO attendance (id, student_id, class_id, date, status, marked_by) 
         VALUES (
           COALESCE((SELECT id FROM attendance WHERE student_id = ? AND date = ?), ?),
           ?, ?, ?, ?, ?
         )`,
        [student_id, date, id, student_id, class_id, date, status, marked_by],
        function(err) {
          if (err) {
            errors.push({ record, error: err.message });
          } else {
            success.push({ student_id, date, status });
          }
          resolve();
        }
      );
    });
  };

  Promise.all(records.map(processRecord)).then(() => {
    res.status(201).json({ 
      message: `Attendance marked successfully. ${success.length} records saved.`,
      success_count: success.length,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  });
});

// Update attendance
router.put('/:id', authenticate, authorize(['admin', 'teacher']), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  db.run(
    'UPDATE attendance SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to update attendance.', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Attendance record not found.' });
      }

      res.json({ message: 'Attendance updated successfully.' });
    }
  );
});

// Delete attendance
router.delete('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM attendance WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete attendance.', error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    res.json({ message: 'Attendance deleted successfully.' });
  });
});

// Get attendance statistics
router.get('/stats/overview', authenticate, (req, res) => {
  const { class_id, start_date, end_date } = req.query;

  let query = `
    SELECT 
      COUNT(*) as total_records,
      SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
      SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
      SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count
    FROM attendance
    WHERE 1=1
  `;
  const params = [];

  if (class_id) {
    query += ' AND class_id = ?';
    params.push(class_id);
  }

  if (start_date && end_date) {
    query += ' AND date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }

  db.get(query, params, (err, stats) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }

    const total = stats.total_records || 1;
    res.json({
      statistics: {
        ...stats,
        present_percentage: ((stats.present_count / total) * 100).toFixed(2),
        absent_percentage: ((stats.absent_count / total) * 100).toFixed(2),
        late_percentage: ((stats.late_count / total) * 100).toFixed(2)
      }
    });
  });
});

// Get monthly attendance report
router.get('/report/monthly', authenticate, (req, res) => {
  const { class_id, month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required.' });
  }

  let query = `
    SELECT 
      s.id as student_id,
      s.name as student_name,
      s.student_id as student_code,
      COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_days,
      COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_days,
      COUNT(CASE WHEN a.status = 'Late' THEN 1 END) as late_days,
      COUNT(a.id) as total_days
    FROM students s
    LEFT JOIN attendance a ON s.id = a.student_id 
      AND strftime('%m', a.date) = ? 
      AND strftime('%Y', a.date) = ?
    WHERE 1=1
  `;
  const params = [month.padStart(2, '0'), year];

  if (class_id) {
    query += ' AND s.class_id = ?';
    params.push(class_id);
  }

  query += ' GROUP BY s.id ORDER BY s.name';

  db.all(query, params, (err, report) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }

    const reportWithPercentage = report.map(r => ({
      ...r,
      attendance_percentage: r.total_days > 0 
        ? (((r.present_days + r.late_days * 0.5) / r.total_days) * 100).toFixed(2)
        : 0
    }));

    res.json({ report: reportWithPercentage });
  });
});

module.exports = router;
