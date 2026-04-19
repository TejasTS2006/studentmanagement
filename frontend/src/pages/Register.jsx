import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { School, Eye, EyeOff, Lock, User, Mail, Briefcase, Building, Phone, FileText, Camera, X, Upload, GraduationCap } from 'lucide-react';
import { authAPI, classesAPI } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    role: 'staff',
    profession: '',
    department: '',
    phone: '',
    bio: '',
    studentId: '',
    classId: '',
    age: '',
    gender: '',
  });
  const [classes, setClasses] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();

  // Fetch classes for student registration
  useEffect(() => {
    if (formData.role === 'student') {
      fetchClasses();
    }
  }, [formData.role]);

  const fetchClasses = async () => {
    try {
      // Use public endpoint since user is not logged in yet during registration
      const response = await fetch('https://studentmanagement-zv5g.onrender.com/api/classes/public');
      const data = await response.json();
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
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

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('username', formData.username);
      submitData.append('password', formData.password);
      submitData.append('email', formData.email);
      submitData.append('fullName', formData.fullName);
      submitData.append('role', formData.role);
      
      if (formData.role === 'student') {
        submitData.append('studentId', formData.studentId);
        if (formData.classId) submitData.append('classId', formData.classId);
        if (formData.age) submitData.append('age', formData.age);
        if (formData.gender) submitData.append('gender', formData.gender);
      } else {
        submitData.append('profession', formData.profession);
        if (formData.department) submitData.append('department', formData.department);
      }
      
      if (formData.phone) submitData.append('phone', formData.phone);
      if (formData.bio) submitData.append('bio', formData.bio);
      if (profilePicture) submitData.append('profilePicture', profilePicture);

      const response = await authAPI.register(submitData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const professions = [
    'Teacher',
    'Administrator',
    'Principal',
    'Vice Principal',
    'Counselor',
    'Librarian',
    'Lab Assistant',
    'Office Staff',
    'Other'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="card">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
              <School className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Join the School Management System
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Picture */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700"
                >
                  <Upload className="h-4 w-4" />
                </button>
                {profilePreview && (
                  <button
                    type="button"
                    onClick={removeProfilePicture}
                    className="absolute top-0 right-0 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role Selection */}
              <div className="md:col-span-2">
                <label className="label">I am a *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'staff' })}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      formData.role === 'staff'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <Briefcase className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                    <span className="font-medium">Staff / Teacher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'student' })}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      formData.role === 'student'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <User className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                    <span className="font-medium">Student</span>
                  </button>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="label">Username *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="label">Email *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="label">Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

              {/* Conditional Fields based on Role */}
              {formData.role === 'student' ? (
                <>
                  {/* Student ID */}
                  <div className="md:col-span-2">
                    <label className="label">Student ID *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleChange}
                        className="input pl-10"
                        placeholder="Enter your Student ID (e.g., S001)"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Your unique Student ID
                    </p>
                  </div>

                  {/* Class Selection */}
                  <div>
                    <label className="label">Class</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="classId"
                        value={formData.classId}
                        onChange={handleChange}
                        className="input pl-10"
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.class_name} {cls.section && `- ${cls.section}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="label">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="input"
                      placeholder="Enter age"
                      min="1"
                      max="100"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="label">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Profession */}
                  <div>
                    <label className="label">Profession *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="profession"
                        value={formData.profession}
                        onChange={handleChange}
                        className="input pl-10"
                        required
                      >
                        <option value="">Select Profession</option>
                        {professions.map((prof) => (
                          <option key={prof} value={prof}>{prof}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Department */}
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
                        className="input pl-10"
                        placeholder="e.g., Mathematics, Science"
                      />
                    </div>
                  </div>
                </>
              )}

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
                    className="input pl-10"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input pl-10 pr-10"
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">Confirm Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pl-10 pr-10"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

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
                  className="input pl-10 pt-2"
                  rows="3"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
