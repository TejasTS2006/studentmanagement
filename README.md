# School Management System

A complete offline Student-Teacher-Class Management System for schools and colleges. This application runs completely offline and stores all data locally using SQLite.

## Features

### 1. Authentication System
- Secure login/logout functionality
- Two user roles: Admin and Teacher
- JWT-based authentication
- Password change functionality

### 2. Student Management
- Add, edit, delete students
- View all students with search and filter
- Fields: Student ID, Name, Age, Gender, Class, Phone, Email
- View student details and history

### 3. Teacher Management
- Add, edit, delete teachers
- Assign user accounts to teachers
- Fields: Teacher ID, Name, Subject, Phone, Email

### 4. Class Management
- Create and manage classes
- Assign teachers to classes
- Add/remove students from classes
- View class details and student lists

### 5. Attendance Management
- Mark daily attendance for students
- Date-wise attendance records
- View attendance history
- Monthly attendance reports with statistics

### 6. Marks/Grade Management
- Add and update student marks
- View marks by subject and exam type
- Calculate total and average marks
- Generate student report cards
- Class performance reports

### 7. Dashboard
- Total students, teachers, and classes overview
- Today's attendance summary
- Attendance charts (last 7 days)
- Class distribution visualization
- Gender distribution charts
- Recent students list

### 8. Reports & Analytics
- Export data as CSV (Students, Teachers, Attendance, Marks)
- Monthly attendance reports
- Class performance analysis
- Visual charts and graphs

### 9. UI Features
- Clean and modern interface
- Sidebar navigation
- Responsive design (mobile-friendly)
- Dark mode support
- Loading states and error handling

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database (offline storage)
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React.js** with Vite
- **Tailwind CSS** for styling
- **Recharts** for charts and graphs
- **Lucide React** for icons
- **Axios** for API calls

## Project Structure

```
school-management-system/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js         # Authentication middleware
│   │   ├── models/
│   │   │   └── db.js           # Database connection
│   │   ├── routes/
│   │   │   ├── auth.js         # Authentication routes
│   │   │   ├── students.js     # Student management routes
│   │   │   ├── teachers.js     # Teacher management routes
│   │   │   ├── classes.js      # Class management routes
│   │   │   ├── attendance.js   # Attendance routes
│   │   │   ├── marks.js        # Marks/grades routes
│   │   │   └── dashboard.js    # Dashboard and reports routes
│   │   ├── utils/
│   │   │   └── initDb.js       # Database initialization
│   │   └── server.js           # Express server
│   ├── data/                   # SQLite database storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx      # Main layout component
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # Authentication context
│   │   │   └── ThemeContext.jsx # Dark mode context
│   │   ├── pages/
│   │   │   ├── Login.jsx       # Login page
│   │   │   ├── Dashboard.jsx   # Dashboard page
│   │   │   ├── Students.jsx    # Students management
│   │   │   ├── Teachers.jsx    # Teachers management
│   │   │   ├── Classes.jsx     # Classes management
│   │   │   ├── Attendance.jsx  # Attendance management
│   │   │   ├── Marks.jsx       # Marks management
│   │   │   └── Reports.jsx     # Reports and analytics
│   │   ├── services/
│   │   │   └── api.js          # API service functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or extract the project**
   ```bash
   cd school-management-system
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Initialize Database**
   ```bash
   npm run init-db
   ```
   This will create the SQLite database with sample data.

4. **Start Backend Server**
   ```bash
   npm start
   ```
   The server will start on http://localhost:5000

5. **Setup Frontend (in a new terminal)**
   ```bash
   cd frontend
   npm install
   ```

6. **Start Frontend Development Server**
   ```bash
   npm run dev
   ```
   The application will open at http://localhost:3000

### Default Login Credentials

| Role     | Username  | Password    |
|----------|-----------|-------------|
| Admin    | admin     | admin123    |
| Teacher  | teacher1  | teacher123  |
| Teacher  | teacher2  | teacher123  |
| Teacher  | teacher3  | teacher123  |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Students
- `GET /api/students` - Get all students (with search & filter)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/:id/marks` - Get student marks
- `GET /api/students/:id/attendance` - Get student attendance

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher
- `GET /api/teachers/:id/classes` - Get teacher's classes

### Classes
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class
- `POST /api/classes/:id/students` - Add student to class
- `DELETE /api/classes/:id/students/:studentId` - Remove student from class

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance (bulk)
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance
- `GET /api/attendance/stats/overview` - Get attendance statistics
- `GET /api/attendance/report/monthly` - Get monthly report

### Marks
- `GET /api/marks` - Get all marks
- `POST /api/marks` - Create mark
- `POST /api/marks/bulk` - Create marks in bulk
- `PUT /api/marks/:id` - Update mark
- `DELETE /api/marks/:id` - Delete mark
- `GET /api/marks/report/student/:studentId` - Get student report card
- `GET /api/marks/report/class/:classId` - Get class performance report

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/attendance-summary` - Get attendance summary
- `GET /api/dashboard/class-distribution` - Get class distribution
- `GET /api/dashboard/gender-distribution` - Get gender distribution
- `GET /api/dashboard/export/:type` - Export data as CSV

## Database Schema

### Tables

1. **users** - User accounts
   - id, username, password, role, email, created_at

2. **teachers** - Teacher information
   - id, teacher_id, name, subject, phone, email, user_id, created_at

3. **classes** - Class information
   - id, class_name, section, teacher_id, created_at

4. **students** - Student information
   - id, student_id, name, age, gender, class_id, phone, email, created_at

5. **attendance** - Attendance records
   - id, student_id, class_id, date, status, marked_by, created_at

6. **marks** - Student marks
   - id, student_id, class_id, subject, exam_type, marks_obtained, max_marks, exam_date, created_at

## Sample Data

The system comes with pre-populated sample data:
- 3 Teachers (Mathematics, Science, English)
- 3 Classes (10th Grade A, 10th Grade B, 11th Grade A)
- 8 Students across different classes
- Sample attendance records
- Sample marks for multiple subjects

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Uses Vite HMR
```

### Building for Production

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Production Mode**
   The backend is configured to serve the built frontend files in production mode.

## License

This project is open source and available for educational purposes.

## Support

For any issues or questions, please refer to the project documentation or contact the development team.
