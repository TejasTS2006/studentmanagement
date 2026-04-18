import React, { useState, useEffect } from 'react';
import { Calendar, Search, Save, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import { attendanceAPI, classesAPI } from '../services/api';

const Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      setClasses(response.data.classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchClassStudents = async () => {
    setLoading(true);
    try {
      const response = await classesAPI.getById(selectedClass);
      const classStudents = response.data.class.students || [];
      setStudents(classStudents);

      // Fetch existing attendance for this date
      const attendanceRes = await attendanceAPI.getAll({
        class_id: selectedClass,
        date: selectedDate,
      });

      // Create attendance map
      const attendanceMap = {};
      attendanceRes.data.attendance.forEach((record) => {
        attendanceMap[record.student_id] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map((student) => ({
        student_id: student.id,
        class_id: selectedClass,
        date: selectedDate,
        status: attendance[student.id] || 'Present',
      }));

      await attendanceAPI.create({ records });
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const viewHistory = async () => {
    if (!selectedClass) {
      alert('Please select a class first');
      return;
    }
    try {
      const response = await attendanceAPI.getAll({
        class_id: selectedClass,
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
      });
      setAttendanceHistory(response.data.attendance);
      setShowHistory(true);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Absent':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Late':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400">Mark and view attendance records</p>
        </div>
        <button
          onClick={viewHistory}
          className="btn-secondary flex items-center justify-center"
        >
          <Calendar className="h-5 w-5 mr-2" />
          View History
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} {cls.section}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSave}
              disabled={!selectedClass || saving}
              className="btn-primary w-full flex items-center justify-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Attendance
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      {selectedClass && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mark Attendance
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : students.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Student ID</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell text-center">Present</th>
                    <th className="table-header-cell text-center">Absent</th>
                    <th className="table-header-cell text-center">Late</th>
                    <th className="table-header-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((student) => (
                    <tr key={student.id} className="table-row">
                      <td className="table-cell font-medium">{student.student_id}</td>
                      <td className="table-cell">{student.name}</td>
                      <td className="table-cell text-center">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          checked={attendance[student.id] === 'Present'}
                          onChange={() => handleAttendanceChange(student.id, 'Present')}
                          className="h-5 w-5 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="table-cell text-center">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          checked={attendance[student.id] === 'Absent'}
                          onChange={() => handleAttendanceChange(student.id, 'Absent')}
                          className="h-5 w-5 text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="table-cell text-center">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          checked={attendance[student.id] === 'Late'}
                          onChange={() => handleAttendanceChange(student.id, 'Late')}
                          className="h-5 w-5 text-yellow-600 focus:ring-yellow-500"
                        />
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(attendance[student.id] || 'Present')}`}>
                          {getStatusIcon(attendance[student.id] || 'Present')}
                          <span className="ml-2">{attendance[student.id] || 'Present'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No students found in this class</p>
            </div>
          )}
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Attendance History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Student</th>
                      <th className="table-header-cell">Class</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Marked By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {attendanceHistory.map((record) => (
                      <tr key={record.id} className="table-row">
                        <td className="table-cell">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="table-cell">{record.student_name}</td>
                        <td className="table-cell">{record.class_name}</td>
                        <td className="table-cell">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="table-cell">{record.marked_by_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
