import React, { useState, useEffect } from 'react';
import { Plus, Search, Save, FileText, X, TrendingUp, Award } from 'lucide-react';
import { marksAPI, classesAPI, studentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Marks = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentReport, setStudentReport] = useState(null);

  const { isAdmin } = useAuth();

  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];
  const examTypes = ['Midterm', 'Final', 'Quiz', 'Assignment'];

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
    }
  }, [selectedClass]);

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

      // Fetch existing marks
      if (selectedSubject && selectedExamType) {
        const marksRes = await marksAPI.getAll({
          class_id: selectedClass,
          subject: selectedSubject,
          exam_type: selectedExamType,
        });

        const marksMap = {};
        marksRes.data.marks.forEach((mark) => {
          marksMap[mark.student_id] = {
            marks_obtained: mark.marks_obtained,
            max_marks: mark.max_marks,
          };
        });
        setMarks(marksMap);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId, value, maxMarks = 100) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        marks_obtained: parseFloat(value) || 0,
        max_marks: maxMarks,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedSubject || !selectedExamType) {
      alert('Please select subject and exam type');
      return;
    }

    setSaving(true);
    try {
      const records = students.map((student) => ({
        student_id: student.id,
        class_id: selectedClass,
        subject: selectedSubject,
        exam_type: selectedExamType,
        marks_obtained: marks[student.id]?.marks_obtained || 0,
        max_marks: marks[student.id]?.max_marks || 100,
        exam_date: new Date().toISOString().split('T')[0],
      }));

      await marksAPI.createBulk({ records });
      alert('Marks saved successfully!');
    } catch (error) {
      console.error('Error saving marks:', error);
      alert('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const viewStudentReport = async (student) => {
    try {
      const response = await marksAPI.getStudentReport(student.id);
      setStudentReport(response.data.report);
      setSelectedStudent(student);
      setShowReport(true);
    } catch (error) {
      console.error('Error fetching student report:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marks</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage student marks and grades</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="label">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input"
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Exam Type</label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="input"
            >
              <option value="">Select Exam Type</option>
              {examTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSave}
              disabled={!selectedClass || !selectedSubject || !selectedExamType || saving}
              className="btn-primary w-full flex items-center justify-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Marks
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Marks Table */}
      {selectedClass && selectedSubject && selectedExamType && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Enter Marks - {selectedSubject} ({selectedExamType})
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
                    <th className="table-header-cell">Marks Obtained</th>
                    <th className="table-header-cell">Max Marks</th>
                    <th className="table-header-cell">Percentage</th>
                    <th className="table-header-cell">Grade</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((student) => {
                    const studentMarks = marks[student.id]?.marks_obtained || 0;
                    const maxMarks = marks[student.id]?.max_marks || 100;
                    const percentage = maxMarks > 0 ? ((studentMarks / maxMarks) * 100).toFixed(2) : 0;
                    const grade = getGrade(percentage);

                    return (
                      <tr key={student.id} className="table-row">
                        <td className="table-cell font-medium">{student.student_id}</td>
                        <td className="table-cell">{student.name}</td>
                        <td className="table-cell">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            value={studentMarks}
                            onChange={(e) => handleMarksChange(student.id, e.target.value, maxMarks)}
                            className="input w-24"
                          />
                        </td>
                        <td className="table-cell">
                          <input
                            type="number"
                            min="1"
                            value={maxMarks}
                            onChange={(e) => handleMarksChange(student.id, studentMarks, parseInt(e.target.value) || 100)}
                            className="input w-24"
                          />
                        </td>
                        <td className="table-cell">{percentage}%</td>
                        <td className="table-cell">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade)}`}>
                            {grade}
                          </span>
                        </td>
                        <td className="table-cell">
                          <button
                            onClick={() => viewStudentReport(student)}
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Student Report Modal */}
      {showReport && selectedStudent && studentReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Award className="h-6 w-6 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Report Card - {selectedStudent.name}
                </h2>
              </div>
              <button
                onClick={() => setShowReport(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overall Percentage</p>
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {studentReport.grand_total.percentage}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Marks</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {studentReport.grand_total.obtained} / {studentReport.grand_total.max}
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Subject-wise Performance
              </h3>
              <div className="space-y-4">
                {studentReport.subjects.map((subject) => (
                  <div key={subject.subject} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{subject.subject}</h4>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {subject.total_obtained} / {subject.total_max}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(getGrade(subject.percentage))}`}>
                          {getGrade(subject.percentage)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${subject.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {subject.percentage}%
                    </p>
                    <div className="mt-3 space-y-1">
                      {subject.marks.map((mark, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{mark.exam_type}</span>
                          <span className="font-medium">{mark.marks_obtained} / {mark.max_marks}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marks;
