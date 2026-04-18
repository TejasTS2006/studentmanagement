import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, X, BookOpen } from 'lucide-react';
import { teachersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    teacher_id: '',
    name: '',
    subject: '',
    phone: '',
    email: '',
    username: '',
    password: '',
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchTeachers();
  }, [searchQuery]);

  const fetchTeachers = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;

      const response = await teachersAPI.getAll(params);
      setTeachers(response.data.teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTeacher) {
        const { username, password, ...updateData } = formData;
        await teachersAPI.update(selectedTeacher.id, updateData);
      } else {
        await teachersAPI.create(formData);
      }
      setShowModal(false);
      setSelectedTeacher(null);
      resetForm();
      fetchTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert(error.response?.data?.message || 'Failed to save teacher');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
      await teachersAPI.delete(id);
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Failed to delete teacher');
    }
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      teacher_id: teacher.teacher_id,
      name: teacher.name,
      subject: teacher.subject,
      phone: teacher.phone || '',
      email: teacher.email || '',
      username: '',
      password: '',
    });
    setShowModal(true);
  };

  const handleView = (teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      teacher_id: '',
      name: '',
      subject: '',
      phone: '',
      email: '',
      username: '',
      password: '',
    });
  };

  const openAddModal = () => {
    setSelectedTeacher(null);
    resetForm();
    setShowModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage teacher records</p>
        </div>
        {isAdmin() && (
          <button onClick={openAddModal} className="btn-primary flex items-center justify-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Teacher
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Teachers Table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Teacher ID</th>
              <th className="table-header-cell">Name</th>
              <th className="table-header-cell">Subject</th>
              <th className="table-header-cell">Phone</th>
              <th className="table-header-cell">Email</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="table-row">
                <td className="table-cell font-medium">{teacher.teacher_id}</td>
                <td className="table-cell">{teacher.name}</td>
                <td className="table-cell">
                  <span className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1 text-primary-500" />
                    {teacher.subject}
                  </span>
                </td>
                <td className="table-cell">{teacher.phone || '-'}</td>
                <td className="table-cell">{teacher.email || '-'}</td>
                <td className="table-cell">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleView(teacher)}
                      className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {isAdmin() && (
                      <>
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedTeacher ? 'Edit Teacher' : 'Add Teacher'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Teacher ID *</label>
                  <input
                    type="text"
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>
                {!selectedTeacher && (
                  <>
                    <div>
                      <label className="label">Username (for login)</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input"
                      />
                    </div>
                  </>
                )}
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
                  {selectedTeacher ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Teacher Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Teacher ID</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.teacher_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Subject</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.email || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Login Username</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.username || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
