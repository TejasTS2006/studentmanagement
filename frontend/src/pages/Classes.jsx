import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, X, Users, UserCircle } from 'lucide-react';
import { classesAPI, teachersAPI, studentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    class_name: '',
    section: '',
    teacher_id: '',
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchStudents();
  }, [searchQuery]);

  const fetchClasses = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;

      const response = await classesAPI.getAll(params);
      setClasses(response.data.classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await teachersAPI.getAll();
      setTeachers(response.data.teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll();
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedClass) {
        await classesAPI.update(selectedClass.id, formData);
      } else {
        await classesAPI.create(formData);
      }
      setShowModal(false);
      setSelectedClass(null);
      resetForm();
      fetchClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      alert(error.response?.data?.message || 'Failed to save class');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    
    try {
      await classesAPI.delete(id);
      fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class');
    }
  };

  const handleEdit = (cls) => {
    setSelectedClass(cls);
    setFormData({
      class_name: cls.class_name,
      section: cls.section || '',
      teacher_id: cls.teacher_id || '',
    });
    setShowModal(true);
  };

  const handleView = async (cls) => {
    try {
      const response = await classesAPI.getById(cls.id);
      setSelectedClass(response.data.class);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching class details:', error);
    }
  };

  const handleAssignStudent = async (studentId) => {
    try {
      await classesAPI.addStudent(selectedClass.id, studentId);
      const response = await classesAPI.getById(selectedClass.id);
      setSelectedClass(response.data.class);
      fetchClasses();
    } catch (error) {
      console.error('Error assigning student:', error);
      alert('Failed to assign student');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await classesAPI.removeStudent(selectedClass.id, studentId);
      const response = await classesAPI.getById(selectedClass.id);
      setSelectedClass(response.data.class);
      fetchClasses();
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Failed to remove student');
    }
  };

  const resetForm = () => {
    setFormData({
      class_name: '',
      section: '',
      teacher_id: '',
    });
  };

  const openAddModal = () => {
    setSelectedClass(null);
    resetForm();
    setShowModal(true);
  };

  const openAssignModal = (cls) => {
    setSelectedClass(cls);
    setShowAssignModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classes</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage classes and assignments</p>
        </div>
        {isAdmin() && (
          <button onClick={openAddModal} className="btn-primary flex items-center justify-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Class
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {cls.class_name}
                  </h3>
                  {cls.section && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Section {cls.section}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleView(cls)}
                  className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {isAdmin() && (
                  <>
                    <button
                      onClick={() => handleEdit(cls)}
                      className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <UserCircle className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Teacher: {cls.teacher_name || 'Not assigned'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Students: {cls.student_count || 0}
                </span>
              </div>
            </div>

            {isAdmin() && (
              <button
                onClick={() => openAssignModal(cls)}
                className="mt-4 w-full py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                Manage Students
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedClass ? 'Edit Class' : 'Add Class'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Class Name *</label>
                <input
                  type="text"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Section</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="input"
                  placeholder="e.g., A, B, C"
                />
              </div>
              <div>
                <label className="label">Teacher</label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} - {teacher.subject}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedClass ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedClass.class_name} {selectedClass.section}
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Teacher</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedClass.teacher_name || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedClass.students?.length || 0}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Students</h3>
              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Student ID</th>
                      <th className="table-header-cell">Name</th>
                      <th className="table-header-cell">Gender</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedClass.students?.map((student) => (
                      <tr key={student.id} className="table-row">
                        <td className="table-cell">{student.student_id}</td>
                        <td className="table-cell">{student.name}</td>
                        <td className="table-cell">{student.gender || '-'}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="3" className="table-cell text-center text-gray-500">
                          No students assigned
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {showAssignModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Manage Students - {selectedClass.class_name} {selectedClass.section}
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Students in this Class
              </h3>
              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                {selectedClass.students?.length > 0 ? (
                  selectedClass.students.map((student) => (
                    <div 
                      key={student.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{student.student_id}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No students in this class
                  </p>
                )}
              </div>

              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Available Students (Not in any class)
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {students.filter(s => !s.class_id || s.class_id !== selectedClass.id).length > 0 ? (
                  students
                    .filter(s => !s.class_id || s.class_id !== selectedClass.id)
                    .map((student) => (
                      <div 
                        key={student.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{student.student_id}</p>
                        </div>
                        <button
                          onClick={() => handleAssignStudent(student.id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Add
                        </button>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No available students
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
