import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateEditEventPage from './pages/CreateEditEventPage';
import EventDetailPage from './pages/EventDetailPage';
import GuestInvitePage from './pages/GuestInvitePage';

// Layout with Navbar for admin pages
function AdminLayout({ children }) {
  return (
    <div className="admin-app-layout">
      <Navbar />
      <main className="admin-main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Public VIP Guest Invitation Route */}
          <Route path="/invite/:token" element={<GuestInvitePage />} />

          {/* Protected Administrative Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <DashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CreateEditEventPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:id/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CreateEditEventPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <EventDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 Catch-All */}
          <Route
            path="*"
            element={
              <div className="fullscreen-loader">
                <h2>Page Not Found</h2>
                <a href="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Return to Dashboard
                </a>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
