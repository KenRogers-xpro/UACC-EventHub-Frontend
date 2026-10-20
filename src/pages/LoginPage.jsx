import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import { Plane, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to dashboard
  if (admin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // STEP 2: Basic client-side validation
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    // STEP 3: Show loading state on button
    setIsLoading(true);

    try {
      // STEP 4: Send login request to backend
      const response = await authAPI.login(email.trim(), password);

      // STEP 5: Store token and redirect to dashboard
      login(response.token, response.admin);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to authentication service';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card-container">
        <div className="login-header">
          <div className="login-logo-badge">
            <Plane size={36} className="login-logo-icon" />
          </div>
          <h1 className="login-title">UACC EventHub</h1>
          <p className="login-subtitle">
            Uganda Air Cargo Corporation — Internal Event Management System
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-error" id="login-error-alert" role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" id="login-form">
          <div className="form-group">
            <label htmlFor="login-email">Corporate Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="admin@uacc.go.ug"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="login-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-button"
            className="btn btn-primary btn-block btn-lg"
            disabled={isLoading}
          >
            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="login-footer">
          <p>Protected administrative portal. Authorized personnel only.</p>
        </div>
      </div>
    </div>
  );
}
