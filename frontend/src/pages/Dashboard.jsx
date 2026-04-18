import React, { useState, useEffect } from 'react';
import { Users, UserCircle, GraduationCap, CalendarCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { dashboardAPI } from '../services/api';
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

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [classDistribution, setClassDistribution] = useState([]);
  const [genderDistribution, setGenderDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, attendanceRes, classRes, genderRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getAttendanceSummary({ days: 7 }),
        dashboardAPI.getClassDistribution(),
        dashboardAPI.getGenderDistribution(),
      ]);

      setStats(statsRes.data.stats);
      setAttendanceSummary(attendanceRes.data.summary);
      setClassDistribution(classRes.data.distribution);
      setGenderDistribution(genderRes.data.distribution);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Students', 
      value: stats?.totalStudents || 0, 
      icon: Users, 
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true
    },
    { 
      title: 'Total Teachers', 
      value: stats?.totalTeachers || 0, 
      icon: UserCircle, 
      color: 'bg-green-500',
      trend: '+5%',
      trendUp: true
    },
    { 
      title: 'Total Classes', 
      value: stats?.totalClasses || 0, 
      icon: GraduationCap, 
      color: 'bg-purple-500',
      trend: '0%',
      trendUp: true
    },
    { 
      title: "Today's Attendance", 
      value: stats?.todayAttendance?.total || 0, 
      icon: CalendarCheck, 
      color: 'bg-orange-500',
      trend: stats?.todayAttendance?.total > 0 
        ? `${Math.round((stats.todayAttendance.present / stats.todayAttendance.total) * 100)}%`
        : '0%',
      trendUp: true
    },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const GENDER_COLORS = { 'Male': '#3b82f6', 'Female': '#ec4899', 'Other': '#8b5cf6' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{card.value}</p>
                <div className="flex items-center mt-2">
                  {card.trendUp ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${card.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                    {card.trend}
                  </span>
                </div>
              </div>
              <div className={`h-12 w-12 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Attendance Overview (Last 7 Days)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                  stroke="#6b7280"
                />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                <Bar dataKey="late" fill="#f59e0b" name="Late" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Distribution */}
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
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
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
                    <Cell 
                      key={`cell-${index}`} 
                      fill={GENDER_COLORS[entry.gender] || COLORS[index % COLORS.length]} 
                    />
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

        {/* Recent Students */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Students
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="table-header-cell">ID</th>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stats?.recentStudents?.slice(0, 5).map((student) => (
                  <tr key={student.id} className="table-row">
                    <td className="table-cell font-medium">{student.student_id}</td>
                    <td className="table-cell">{student.name}</td>
                    <td className="table-cell">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        {student.class_name || 'Not Assigned'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
