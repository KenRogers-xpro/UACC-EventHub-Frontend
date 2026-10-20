import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <Link to="/dashboard" className="brand-logo" id="nav-brand-logo">
          <div className="brand-mark">UACC</div>
          <div className="brand-text">
            <span className="brand-title">EventHub</span>
            <span className="brand-subtitle">Uganda Air Cargo Corporation</span>
          </div>
        </Link>

        {admin && (
          <nav className="nav-links">
            <Link
              to="/dashboard"
              id="nav-link-dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              Events
            </Link>

            <Link
              to="/events/new"
              id="nav-link-create-event"
              className={`nav-link ${isActive('/events/new') ? 'active' : ''}`}
            >
              + Create Event
            </Link>

            <div className="nav-user-menu">
              <span className="user-badge" title={admin.email}>
                {admin.email}
              </span>

              <button
                id="btn-logout"
                onClick={handleLogout}
                className="btn-logout"
                title="Sign out"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
