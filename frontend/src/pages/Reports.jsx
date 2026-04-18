import React, { useState, useEffect } from 'react';
import { Download, FileText, Users, CalendarCheck, TrendingUp, Award } from 'lucide-react';
import { dashboardAPI, attendanceAPI, marksAPI, classesAPI } from '../services/api';
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
  Cell,
  Legend
} from 'recharts';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [classDistribution, setClassDistribution] = useState([]);
  const [genderDistribution, setGenderDistribution] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [marksReport, setMarksReport] = useState([]);
  const [loading, setLoading] = useState(true);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchDashboardData();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAttendanceReport();
      fetchMarksReport();
    }
  }, [selectedClass, selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, classRes, genderRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getClassDistribution(),
        dashboardAPI.getGenderDistribution(),
      ]);

      setStats(statsRes.data.stats);
      setClassDistribution(classRes.data.distribution);
      setGenderDistribution(genderRes.data.distribution);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      setClasses(response.data.classes);
      if (response.data.classes.length > 0) {
        setSelectedClass(response.data.classes[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      const response = await attendanceAPI.getMonthlyReport({
        class_id: selectedClass,
        month: selectedMonth,
        year: selectedYear,
      });
      setAttendanceReport(response.data.report);
    } catch (error) {
      console.error('Error fetching attendance report:', error);
    }
  };

  const fetchMarksReport = async () => {
    try {
      const response = await marksAPI.getClassReport(selectedClass);
      setMarksReport(response.data.report);
    } catch (error) {
      console.error('Error fetching marks report:', error);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await dashboardAPI.exportData(type);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">View analytics and export data</p>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { type: 'students', label: 'Students', icon: Users, color: 'bg-blue-500' },
          { type: 'teachers', label: 'Teachers', icon: Users, color: 'bg-green-500' },
          { type: 'attendance', label: 'Attendance', icon: CalendarCheck, color: 'bg-orange-500' },
          { type: 'marks', label: 'Marks', icon: TrendingUp, color: 'bg-purple-500' },
        ].map((item) => (
          <div key={item.type} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-12 w-12 ${item.color} rounded-lg flex items-center justify-center`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {item.label} Data
            </h3>
            <button
              onClick={() => handleExport(item.type)}
              className="w-full btn-secondary flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalStudents || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Teachers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalTeachers || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalClasses || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Class Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ class_name, section, student_count }) => 
                    `${class_name} ${section || ''}: ${student_count}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="student_count"
                  nameKey="class_name"
                >
                  {classDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Gender Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="gender"
                >
                  {genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detailed Reports
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input sm:w-48"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} {cls.section}
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input sm:w-40"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input sm:w-32"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClass && (
          <div className="space-y-8">
            {/* Attendance Report */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Monthly Attendance Report
              </h4>
              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Student</th>
                      <th className="table-header-cell">Present Days</th>
                      <th className="table-header-cell">Absent Days</th>
                      <th className="table-header-cell">Late Days</th>
                      <th className="table-header-cell">Total Days</th>
                      <th className="table-header-cell">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {attendanceReport.map((record) => (
                      <tr key={record.student_id} className="table-row">
                        <td className="table-cell font-medium">{record.student_name}</td>
                        <td className="table-cell text-green-600">{record.present_days}</td>
                        <td className="table-cell text-red-600">{record.absent_days}</td>
                        <td className="table-cell text-yellow-600">{record.late_days}</td>
                        <td className="table-cell">{record.total_days}</td>
                        <td className="table-cell">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            parseFloat(record.attendance_percentage) >= 75 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : parseFloat(record.attendance_percentage) >= 60
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {record.attendance_percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Marks Report */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Class Performance Report
              </h4>
              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Subject</th>
                      <th className="table-header-cell">Exam Type</th>
                      <th className="table-header-cell">Students</th>
                      <th className="table-header-cell">Average</th>
                      <th className="table-header-cell">Highest</th>
                      <th className="table-header-cell">Lowest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {marksReport.map((record, index) => (
                      <tr key={index} className="table-row">
                        <td className="table-cell font-medium">{record.subject}</td>
                        <td className="table-cell">{record.exam_type}</td>
                        <td className="table-cell">{record.total_students}</td>
                        <td className="table-cell">{parseFloat(record.average_marks).toFixed(2)}</td>
                        <td className="table-cell text-green-600">{record.highest_marks}</td>
                        <td className="table-cell text-red-600">{record.lowest_marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
