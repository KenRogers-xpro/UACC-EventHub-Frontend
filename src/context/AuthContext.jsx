import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('uacc_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // App Initialization & Session check
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('uacc_admin_token');
      if (!token) {
        setAdmin(null);
        setLoading(false);
        return;
      }

      try {
        // Verify with backend /api/auth/me
        const response = await authAPI.getMe();
        if (response.success && response.admin) {
          setAdmin(response.admin);
          localStorage.setItem('uacc_admin_user', JSON.stringify(response.admin));
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = (token, adminData) => {
    localStorage.setItem('uacc_admin_token', token);
    localStorage.setItem('uacc_admin_user', JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('uacc_admin_token');
    localStorage.removeItem('uacc_admin_user');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
