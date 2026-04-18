const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models/db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/profile-pictures');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Register new user
router.post('/register', upload.single('profilePicture'), async (req, res) => {
  const { 
    username, 
    password, 
    email, 
    fullName, 
    profession, 
    department, 
    phone, 
    bio,
    role,
    studentId,
    classId,
    age,
    gender
  } = req.body;

  // Validation based on role
  if (!username || !password || !email || !fullName) {
    return res.status(400).json({ 
      message: 'Username, password, email, and full name are required.' 
    });
  }

  // Students need studentId and classId, others need profession
  if (role === 'student' && !studentId) {
    return res.status(400).json({ 
      message: 'Student ID is required for student registration.' 
    });
  }

  if (role !== 'student' && !profession) {
    return res.status(400).json({ 
      message: 'Profession is required for staff registration.' 
    });
  }

  // Check if first user (make them admin)
  db.get('SELECT COUNT(*) as count FROM users', [], async (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }

    // First user becomes admin, others use specified role or default to staff
    let userRole;
    if (result.count === 0) {
      userRole = 'admin';
    } else if (role === 'student') {
      userRole = 'student';
    } else {
      userRole = role || 'staff';
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePicture = req.file ? `/uploads/profile-pictures/${req.file.filename}` : null;

    // If student, also create student record
    let studentRecordId = null;
    if (userRole === 'student' && studentId) {
      try {
        studentRecordId = uuidv4();
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO students (id, student_id, name, age, gender, class_id, phone, email) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [studentRecordId, studentId, fullName, age || null, gender || null, classId || null, phone || null, email],
            (err) => {
              if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                  reject(new Error('Student ID already exists.'));
                } else {
                  reject(err);
                }
              } else {
                resolve();
              }
            }
          );
        });
      } catch (error) {
        return res.status(409).json({ message: error.message });
      }
    }

    db.run(
      `INSERT INTO users (
        id, username, password, role, email, full_name, profession, 
        department, phone, profile_picture, bio, student_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        username, 
        hashedPassword, 
        userRole, 
        email, 
        fullName, 
        profession || null,
        department || null,
        phone || null,
        profilePicture,
        bio || null,
        studentId || null
      ],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'Username already exists.' });
          }
          return res.status(500).json({ message: 'Failed to create user.', error: err.message });
        }

        const token = jwt.sign(
          { id, username, role: userRole },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: 'User registered successfully.',
          token,
          user: {
            id,
            username,
            role: userRole,
            email,
            fullName,
            profession,
            department,
            phone,
            profilePicture,
            bio,
            studentId,
            studentRecordId,
            classId
          }
        });
      }
    );
  });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Build user response
      const userResponse = {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        fullName: user.full_name,
        profession: user.profession,
        department: user.department,
        phone: user.phone,
        profilePicture: user.profile_picture,
        bio: user.bio,
        studentId: user.student_id
      };

      // If user is a student, fetch their student record
      if (user.role === 'student' && user.student_id) {
        db.get(
          `SELECT s.*, c.class_name, c.section, t.name as teacher_name
           FROM students s
           LEFT JOIN classes c ON s.class_id = c.id
           LEFT JOIN teachers t ON c.teacher_id = t.id
           WHERE s.id = ?`,
          [user.student_id],
          (err, student) => {
            if (!err && student) {
              userResponse.studentRecord = student;
            }
            res.json({ token, user: userResponse });
          }
        );
      } else {
        res.json({ token, user: userResponse });
      }
    }
  );
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  db.get(
    `SELECT id, username, role, email, full_name, profession, department, 
            phone, profile_picture, bio, student_id, created_at 
     FROM users WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const userResponse = {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        fullName: user.full_name,
        profession: user.profession,
        department: user.department,
        phone: user.phone,
        profilePicture: user.profile_picture,
        bio: user.bio,
        studentId: user.student_id,
        createdAt: user.created_at
      };

      // If user is a student, fetch their student record
      if (user.role === 'student' && user.student_id) {
        db.get(
          `SELECT s.*, c.class_name, c.section, t.name as teacher_name
           FROM students s
           LEFT JOIN classes c ON s.class_id = c.id
           LEFT JOIN teachers t ON c.teacher_id = t.id
           WHERE s.id = ?`,
          [user.student_id],
          (err, student) => {
            if (!err && student) {
              userResponse.studentRecord = student;
            }
            res.json({ user: userResponse });
          }
        );
      } else {
        res.json({ user: userResponse });
      }
    }
  );
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }

  db.get(
    'SELECT * FROM users WHERE id = ?',
    [req.user.id],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, req.user.id],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Failed to update password.', error: err.message });
          }
          res.json({ message: 'Password updated successfully.' });
        }
      );
    }
  );
});

// Update profile
router.put('/profile', authenticate, upload.single('profilePicture'), async (req, res) => {
  const { fullName, profession, department, phone, bio } = req.body;
  const profilePicture = req.file ? `/uploads/profile-pictures/${req.file.filename}` : undefined;

  let query = `UPDATE users SET 
    full_name = COALESCE(?, full_name),
    profession = COALESCE(?, profession),
    department = COALESCE(?, department),
    phone = COALESCE(?, phone),
    bio = COALESCE(?, bio)`;
  
  const params = [fullName, profession, department, phone, bio];

  if (profilePicture) {
    query += `, profile_picture = ?`;
    params.push(profilePicture);
  }

  query += ` WHERE id = ?`;
  params.push(req.user.id);

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to update profile.', error: err.message });
    }

    res.json({ message: 'Profile updated successfully.' });
  });
});

module.exports = router;
