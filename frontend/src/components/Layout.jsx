import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  GraduationCap, 
  CalendarCheck, 
  FileText, 
  BarChart3,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  School,
  Contact
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin, isStudent } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Different navigation for students vs staff
  const studentNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/my-profile', icon: Contact, label: 'My Profile' },
  ];

  const staffNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/teachers', icon: UserCircle, label: 'Teachers' },
    { path: '/classes', icon: GraduationCap, label: 'Classes' },
    { path: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { path: '/marks', icon: FileText, label: 'Marks' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
  ];

  const navItems = isStudent() ? studentNavItems : staffNavItems;
  
  // Profile dropdown items
  const profileMenuItems = [
    { path: '/profile', label: 'My Account', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <School className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">SMS</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link to="/profile" className="flex items-center space-x-4 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.profession || user?.role}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                {user?.profilePicture ? (
                  <img 
                    src={`https://studentmanagement-zv5g.onrender.com${user.profilePicture}`} 
                    alt={user.fullName || user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
