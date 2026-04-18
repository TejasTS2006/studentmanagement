import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { 
  UserCircle, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  FileText, 
  Camera, 
  X, 
  Upload,
  Save,
  Lock,
  GraduationCap,
  User
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    profession: '',
    department: '',
    bio: ''
  });
  
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        profession: user.profession || '',
        department: user.department || '',
        bio: user.bio || ''
      });
      if (user.profilePicture) {
        setProfilePreview(user.profilePicture);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const submitData = new FormData();
      if (formData.fullName) submitData.append('fullName', formData.fullName);
      if (formData.phone) submitData.append('phone', formData.phone);
      if (formData.profession) submitData.append('profession', formData.profession);
      if (formData.department) submitData.append('department', formData.department);
      if (formData.bio) submitData.append('bio', formData.bio);
      if (profilePicture) submitData.append('profilePicture', profilePicture);

      const response = await authAPI.updateProfile(submitData);
      setMessage('Profile updated successfully!');
      
      // Update local user data
      const updatedUser = { ...user, ...formData };
      if (profilePreview && profilePreview !== user.profilePicture) {
        updatedUser.profilePicture = profilePreview;
      }
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'teacher': return 'Teacher';
      case 'staff': return 'Staff Member';
      case 'student': return 'Student';
      default: return role;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage your account information</p>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="relative inline-block mb-4">
              <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden mx-auto">
                {profilePreview ? (
                  <img 
                    src={profilePreview} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-16 w-16 text-gray-400" />
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user.fullName || user.username}
            </h2>
            <p className="text-primary-600 dark:text-primary-400 font-medium">
              {getRoleDisplay(user.role)}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              @{user.username}
            </p>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn btn-primary w-full"
              >
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="btn btn-secondary w-full"
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </button>
            </div>
          </div>

          {/* Student Info Card */}
          {user.role === 'student' && user.studentRecord && (
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <GraduationCap className="h-5 w-5 inline mr-2" />
                Academic Info
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Student ID</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.studentId}</p>
                </div>
                {user.studentRecord.class_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Class</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.studentRecord.class_name} {user.studentRecord.section}
                    </p>
                  </div>
                )}
                {user.studentRecord.teacher_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Class Teacher</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.studentRecord.teacher_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {isEditing ? 'Edit Profile' : 'Profile Information'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input pl-10 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
              </div>

              {/* Email - Read Only */}
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="input pl-10 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input pl-10 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Staff-specific fields */}
              {user.role !== 'student' && (
                <>
                  <div>
                    <label className="label">Profession</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="profession"
                        value={formData.profession}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="input pl-10 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        placeholder="e.g., Teacher, Administrator"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Department</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="input pl-10 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        placeholder="e.g., Mathematics, Science"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Bio */}
              <div>
                <label className="label">Bio</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows="4"
                    className="input pl-10 pt-2 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="input"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="input"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
