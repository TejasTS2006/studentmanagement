const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'school.db');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error creating database:', err.message);
    return;
  }
  console.log('Database created successfully.');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

const runQuery = (query) => {
  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const createTables = async () => {
  try {
    // Create tables in order (no foreign key dependencies first)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        teacher_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        class_name TEXT NOT NULL,
        section TEXT,
        teacher_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        student_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        age INTEGER,
        gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
        class_id TEXT,
        phone TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'staff', 'student')),
        email TEXT,
        full_name TEXT,
        profession TEXT,
        department TEXT,
        phone TEXT,
        profile_picture TEXT,
        bio TEXT,
        student_id TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add foreign key to teachers after users table exists
    await runQuery(`
      CREATE TRIGGER IF NOT EXISTS set_teacher_user_id
      AFTER INSERT ON users
      FOR EACH ROW
      WHEN NEW.role = 'teacher'
      BEGIN
        UPDATE teachers SET user_id = NEW.id WHERE email = NEW.email;
      END
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        date DATE NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late')),
        marked_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (marked_by) REFERENCES teachers(id) ON DELETE SET NULL,
        UNIQUE(student_id, date)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS marks (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        exam_type TEXT NOT NULL,
        marks_obtained REAL NOT NULL,
        max_marks REAL NOT NULL,
        exam_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
      )
    `);

    console.log('All tables created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const insertSampleData = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Note: No default users - users must register themselves
      console.log('No default users created. Please register a new account.');

      // Insert teachers
      const t1Id = uuidv4();
      const t2Id = uuidv4();
      const t3Id = uuidv4();

      db.run(
        `INSERT OR IGNORE INTO teachers (id, teacher_id, name, subject, phone, email, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [t1Id, 'T001', 'John Smith', 'Mathematics', '555-0101', 'john@school.com', null]
      );

      db.run(
        `INSERT OR IGNORE INTO teachers (id, teacher_id, name, subject, phone, email, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [t2Id, 'T002', 'Jane Doe', 'Science', '555-0102', 'jane@school.com', null]
      );

      db.run(
        `INSERT OR IGNORE INTO teachers (id, teacher_id, name, subject, phone, email, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [t3Id, 'T003', 'Bob Johnson', 'English', '555-0103', 'bob@school.com', null]
      );

      // Insert classes
      const c1Id = uuidv4();
      const c2Id = uuidv4();
      const c3Id = uuidv4();

      db.run(
        `INSERT OR IGNORE INTO classes (id, class_name, section, teacher_id) VALUES (?, ?, ?, ?)`,
        [c1Id, '10th Grade', 'A', t1Id]
      );

      db.run(
        `INSERT OR IGNORE INTO classes (id, class_name, section, teacher_id) VALUES (?, ?, ?, ?)`,
        [c2Id, '10th Grade', 'B', t2Id]
      );

      db.run(
        `INSERT OR IGNORE INTO classes (id, class_name, section, teacher_id) VALUES (?, ?, ?, ?)`,
        [c3Id, '11th Grade', 'A', t3Id]
      );

      // Insert students
      const students = [
        { id: uuidv4(), sid: 'S001', name: 'Alice Brown', age: 15, gender: 'Female', class_id: c1Id, phone: '555-1001', email: 'alice@student.com' },
        { id: uuidv4(), sid: 'S002', name: 'Charlie Davis', age: 16, gender: 'Male', class_id: c1Id, phone: '555-1002', email: 'charlie@student.com' },
        { id: uuidv4(), sid: 'S003', name: 'Eva Wilson', age: 15, gender: 'Female', class_id: c1Id, phone: '555-1003', email: 'eva@student.com' },
        { id: uuidv4(), sid: 'S004', name: 'Frank Miller', age: 16, gender: 'Male', class_id: c2Id, phone: '555-1004', email: 'frank@student.com' },
        { id: uuidv4(), sid: 'S005', name: 'Grace Lee', age: 15, gender: 'Female', class_id: c2Id, phone: '555-1005', email: 'grace@student.com' },
        { id: uuidv4(), sid: 'S006', name: 'Henry Taylor', age: 17, gender: 'Male', class_id: c3Id, phone: '555-1006', email: 'henry@student.com' },
        { id: uuidv4(), sid: 'S007', name: 'Ivy Chen', age: 16, gender: 'Female', class_id: c3Id, phone: '555-1007', email: 'ivy@student.com' },
        { id: uuidv4(), sid: 'S008', name: 'Jack Anderson', age: 17, gender: 'Male', class_id: c3Id, phone: '555-1008', email: 'jack@student.com' },
      ];

      students.forEach(student => {
        db.run(
          `INSERT OR IGNORE INTO students (id, student_id, name, age, gender, class_id, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [student.id, student.sid, student.name, student.age, student.gender, student.class_id, student.phone, student.email]
        );
      });

      // Insert sample attendance
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      students.forEach((student, index) => {
        const status1 = index % 3 === 0 ? 'Absent' : 'Present';
        const status2 = index % 4 === 0 ? 'Late' : 'Present';
        
        db.run(
          `INSERT OR IGNORE INTO attendance (id, student_id, class_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), student.id, student.class_id, today, status1, t1Id]
        );

        db.run(
          `INSERT OR IGNORE INTO attendance (id, student_id, class_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), student.id, student.class_id, yesterday, status2, t1Id]
        );
      });

      // Insert sample marks
      const subjects = ['Mathematics', 'Science', 'English'];
      const examTypes = ['Midterm', 'Final'];

      students.forEach(student => {
        subjects.forEach(subject => {
          examTypes.forEach(examType => {
            const marks = Math.floor(Math.random() * 40) + 60; // Random marks between 60-100
            db.run(
              `INSERT OR IGNORE INTO marks (id, student_id, class_id, subject, exam_type, marks_obtained, max_marks, exam_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [uuidv4(), student.id, student.class_id, subject, examType, marks, 100, today]
            );
          });
        });
      });

      console.log('Sample data inserted successfully.');
      console.log('\nNo default users. Please register a new account to get started.');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

const initDatabase = async () => {
  try {
    // Drop existing tables to update schema
    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS marks', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS attendance', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS users', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS students', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS classes', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS teachers', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('Existing tables dropped.');
    
    await createTables();
    await insertSampleData();
    console.log('\nDatabase initialization completed!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    db.close();
  }
};

initDatabase();
