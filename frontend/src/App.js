import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCourses from './pages/student/StudentCourses';
import CourseView from './pages/student/CourseView';
import FeedbackForm from './pages/student/FeedbackForm';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherCourses from './pages/teacher/TeacherCourses';
import TeacherCourseDetail from './pages/teacher/TeacherCourseDetail';
import TeacherAnalytics from './pages/teacher/TeacherAnalytics';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /><span>Loading...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute roles={['student']}>
              <Layout role="student" />
            </ProtectedRoute>
          }>
            <Route index element={<StudentDashboard />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="courses/:courseId" element={<CourseView />} />
            <Route path="feedback/:formId" element={<FeedbackForm />} />
          </Route>

          {/* Teacher Routes */}
          <Route path="/teacher" element={
            <ProtectedRoute roles={['teacher']}>
              <Layout role="teacher" />
            </ProtectedRoute>
          }>
            <Route index element={<TeacherDashboard />} />
            <Route path="courses" element={<TeacherCourses />} />
            <Route path="courses/:courseId" element={<TeacherCourseDetail />} />
            <Route path="analytics" element={<TeacherAnalytics />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <Layout role="admin" />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}