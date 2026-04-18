import React, { useState, useEffect } from 'react';
import { UserCircle, Mail, Phone, GraduationCap, Users, Calendar, Award, BookOpen, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentsAPI, marksAPI } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const StudentProfile = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const student = user?.studentRecord;

  useEffect(() => {
    if (student?.id) {
      fetchStudentData();
    }
  }, [student?.id]);

  const fetchStudentData = async () => {
    try {
      const [marksRes, attendanceRes] = await Promise.all([
        studentsAPI.getMarks(student.id),
        studentsAPI.getAttendance(student.id)
      ]);
      setMarks(marksRes.data.marks);
      setAttendance(attendanceRes.data.attendance);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'B':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'C':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'D':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  // Process marks data for charts
  const subjectMarks = {};
  marks.forEach(mark => {
    if (!subjectMarks[mark.subject]) {
      subjectMarks[mark.subject] = [];
    }
    subjectMarks[mark.subject].push(mark);
  });

  const chartData = Object.keys(subjectMarks).map(subject => {
    const subjectMarksList = subjectMarks[subject];
    const avgMarks = subjectMarksList.reduce((sum, m) => sum + (m.marks_obtained / m.max_marks * 100), 0) / subjectMarksList.length;
    return {
      subject,
      percentage: Math.round(avgMarks)
    };
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">View your academic information</p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
            {user?.profilePicture ? (
              <img 
                src={`http://localhost:5000${user.profilePicture}`} 
                alt={user.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{student?.name || user?.fullName}</h2>
            <p className="text-gray-600 dark:text-gray-400">{student?.student_id || user?.username}</p>
            <div className="flex flex-wrap gap-4 mt-3">
              {student?.class_name && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <GraduationCap className="h-4 w-4 mr-1" />
                  {student.class_name} {student.section}
                </span>
              )}
              {student?.teacher_name && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Users className="h-4 w-4 mr-1" />
                  Teacher: {student.teacher_name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{user?.email || '-'}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Phone className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              <p className="font-medium text-gray-900 dark:text-white">{student?.phone || user?.phone || '-'}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
              <p className="font-medium text-gray-900 dark:text-white">{student?.age || '-'} years</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Subjects</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Object.keys(subjectMarks).length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {chartData.length > 0 
                  ? Math.round(chartData.reduce((sum, s) => sum + s.percentage, 0) / chartData.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Attendance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {attendance.length > 0 
                  ? Math.round((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Marks Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Subject Performance
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="subject" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Bar dataKey="percentage" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Marks Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          My Marks
        </h3>
        {marks.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Subject</th>
                  <th className="table-header-cell">Exam Type</th>
                  <th className="table-header-cell">Marks</th>
                  <th className="table-header-cell">Percentage</th>
                  <th className="table-header-cell">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {marks.map((mark) => {
                  const percentage = (mark.marks_obtained / mark.max_marks) * 100;
                  const grade = getGrade(percentage);
                  return (
                    <tr key={mark.id} className="table-row">
                      <td className="table-cell font-medium">{mark.subject}</td>
                      <td className="table-cell">{mark.exam_type}</td>
                      <td className="table-cell">{mark.marks_obtained} / {mark.max_marks}</td>
                      <td className="table-cell">{percentage.toFixed(1)}%</td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade)}`}>
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No marks recorded yet
          </p>
        )}
      </div>

      {/* Attendance History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Attendance History
        </h3>
        {attendance.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {attendance.slice(0, 10).map((record) => (
                  <tr key={record.id} className="table-row">
                    <td className="table-cell">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'Present' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : record.status === 'Absent'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No attendance records yet
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
