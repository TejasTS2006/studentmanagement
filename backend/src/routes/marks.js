const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all marks
router.get('/', authenticate, (req, res) => {
  const { class_id, student_id, subject, exam_type } = req.query;
  
  let query = `
    SELECT m.*, s.name as student_name, s.student_id as student_code,
           c.class_name, c.section
    FROM marks m
    JOIN students s ON m.student_id = s.id
    LEFT JOIN classes c ON m.class_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (class_id) {
    query += ' AND m.class_id = ?';
    params.push(class_id);
  }

  if (student_id) {
    query += ' AND m.student_id = ?';
    params.push(student_id);
  }

  if (subject) {
    query += ' AND m.subject = ?';
    params.push(subject);
  }

  if (exam_type) {
    query += ' AND m.exam_type = ?';
    params.push(exam_type);
  }

  query += ' ORDER BY s.name, m.subject, m.exam_type';

  db.all(query, params, (err, marks) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    res.json({ marks });
  });
});

// Get mark by ID
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT m.*, s.name as student_name, s.student_id as student_code,
            c.class_name, c.section
     FROM marks m
     JOIN students s ON m.student_id = s.id
     LEFT JOIN classes c ON m.class_id = c.id
     WHERE m.id = ?`,
    [id],
    (err, mark) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }

      if (!mark) {
        return res.status(404).json({ message: 'Mark record not found.' });
      }

      res.json({ mark });
    }
  );
});

// Create mark
router.post('/', authenticate, authorize(['admin', 'teacher']), (req, res) => {
  const { student_id, class_id, subject, exam_type, marks_obtained, max_marks, exam_date } = req.body;

  if (!student_id || !class_id || !subject || !exam_type || marks_obtained === undefined || !max_marks) {
    return res.status(400).json({ message: 'All required fields must be provided.' });
  }

  if (marks_obtained < 0 || marks_obtained > max_marks) {
    return res.status(400).json({ message: 'Invalid marks obtained.' });
  }

  const id = uuidv4();

  db.run(
    `INSERT INTO marks (id, student_id, class_id, subject, exam_type, marks_obtained, max_marks, exam_date) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, student_id, class_id, subject, exam_type, marks_obtained, max_marks, exam_date],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to create mark record.', error: err.message });
      }

      res.status(201).json({ 
        message: 'Mark record created successfully.',
        mark: { id, student_id, class_id, subject, exam_type, marks_obtained, max_marks, exam_date }
      });
    }
  );
});

// Create/update marks in bulk
router.post('/bulk', authenticate, authorize(['admin', 'teacher']), (req, res) => {
  const { records } = req.body;

  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'Mark records are required.' });
  }

  const errors = [];
  const success = [];

  const processRecord = (record) => {
    return new Promise((resolve) => {
      const { student_id, class_id, subject, exam_type, marks_obtained, max_marks, exam_date } = record;

      if (!student_id || !class_id || !subject || !exam_type || marks_obtained === undefined || !max_marks) {
        errors.push({ record, error: 'Missing required fields' });
        resolve();
        return;
      }

      if (marks_obtained < 0 || marks_obtained > max_marks) {
        errors.push({ record, error: 'Invalid marks obtained' });
        resolve();
        return;
      }

      const id = uuidv4();

      // Use INSERT OR REPLACE to handle updates
      db.run(
        `INSERT OR REPLACE INTO marks (id, student_id, class_id, subject, exam_type, marks_obtained, max_marks, exam_date) 
         VALUES (
           COALESCE((SELECT id FROM marks WHERE student_id = ? AND subject = ? AND exam_type = ?), ?),
           ?, ?, ?, ?, ?, ?, ?
         )`,
        [student_id, subject, exam_type, id, student_id, class_id, subject, exam_type, marks_obtained, max_marks, exam_date],
        function(err) {
          if (err) {
            errors.push({ record, error: err.message });
          } else {
            success.push({ student_id, subject, exam_type, marks_obtained });
          }
          resolve();
        }
      );
    });
  };

  Promise.all(records.map(processRecord)).then(() => {
    res.status(201).json({ 
      message: `Marks saved successfully. ${success.length} records saved.`,
      success_count: success.length,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  });
});

// Update mark
router.put('/:id', authenticate, authorize(['admin', 'teacher']), (req, res) => {
  const { id } = req.params;
  const { marks_obtained, max_marks, exam_date } = req.body;

  if (marks_obtained !== undefined && (marks_obtained < 0 || (max_marks && marks_obtained > max_marks))) {
    return res.status(400).json({ message: 'Invalid marks obtained.' });
  }

  db.run(
    `UPDATE marks 
     SET marks_obtained = COALESCE(?, marks_obtained),
         max_marks = COALESCE(?, max_marks),
         exam_date = COALESCE(?, exam_date)
     WHERE id = ?`,
    [marks_obtained, max_marks, exam_date, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to update mark.', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Mark record not found.' });
      }

      res.json({ message: 'Mark updated successfully.' });
    }
  );
});

// Delete mark
router.delete('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM marks WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete mark.', error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Mark record not found.' });
    }

    res.json({ message: 'Mark deleted successfully.' });
  });
});

// Get student report card
router.get('/report/student/:studentId', authenticate, (req, res) => {
  const { studentId } = req.params;

  db.all(
    `SELECT m.*, c.class_name
     FROM marks m
     LEFT JOIN classes c ON m.class_id = c.id
     WHERE m.student_id = ?
     ORDER BY m.subject, m.exam_type`,
    [studentId],
    (err, marks) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }

      // Group by subject
      const subjectGroups = {};
      marks.forEach(mark => {
        if (!subjectGroups[mark.subject]) {
          subjectGroups[mark.subject] = [];
        }
        subjectGroups[mark.subject].push(mark);
      });

      // Calculate totals and averages
      const subjectSummary = Object.keys(subjectGroups).map(subject => {
        const subjectMarks = subjectGroups[subject];
        const totalObtained = subjectMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
        const totalMax = subjectMarks.reduce((sum, m) => sum + m.max_marks, 0);
        const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0;

        return {
          subject,
          marks: subjectMarks,
          total_obtained: totalObtained,
          total_max: totalMax,
          percentage
        };
      });

      const grandTotalObtained = subjectSummary.reduce((sum, s) => sum + s.total_obtained, 0);
      const grandTotalMax = subjectSummary.reduce((sum, s) => sum + s.total_max, 0);
      const overallPercentage = grandTotalMax > 0 ? ((grandTotalObtained / grandTotalMax) * 100).toFixed(2) : 0;

      res.json({
        report: {
          subjects: subjectSummary,
          grand_total: {
            obtained: grandTotalObtained,
            max: grandTotalMax,
            percentage: overallPercentage
          }
        }
      });
    }
  );
});

// Get class performance report
router.get('/report/class/:classId', authenticate, (req, res) => {
  const { classId } = req.params;
  const { subject, exam_type } = req.query;

  let query = `
    SELECT 
      m.subject,
      m.exam_type,
      COUNT(*) as total_students,
      AVG(m.marks_obtained) as average_marks,
      MAX(m.marks_obtained) as highest_marks,
      MIN(m.marks_obtained) as lowest_marks
    FROM marks m
    WHERE m.class_id = ?
  `;
  const params = [classId];

  if (subject) {
    query += ' AND m.subject = ?';
    params.push(subject);
  }

  if (exam_type) {
    query += ' AND m.exam_type = ?';
    params.push(exam_type);
  }

  query += ' GROUP BY m.subject, m.exam_type ORDER BY m.subject, m.exam_type';

  db.all(query, params, (err, report) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    res.json({ report });
  });
});

module.exports = router;
