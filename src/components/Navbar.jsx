import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
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
            <span className="brand-subtitle">Uganda Air Cargo Corp</span>
          </div>
        </Link>

        {admin && (
          <>
            {/* Desktop Navigation (Text only, no icons, clean alignment) */}
            <nav className="nav-links desktop-only" aria-label="Main Navigation">
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
                  Logout
                </button>
              </div>
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              id="btn-mobile-menu"
              className="mobile-menu-toggle mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {admin && mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="mobile-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            <div className="mobile-drawer-header">
              <div className="mobile-user-info">
                <span className="mobile-user-label">Logged In As</span>
                <span className="mobile-user-email" title={admin.email}>
                  {admin.email}
                </span>
              </div>
            </div>

            <nav className="mobile-drawer-links">
              <Link
                to="/dashboard"
                id="mobile-nav-link-dashboard"
                className={`mobile-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Events Management
              </Link>

              <Link
                to="/events/new"
                id="mobile-nav-link-create"
                className={`mobile-nav-link ${isActive('/events/new') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                + Create Event
              </Link>
            </nav>

            <div className="mobile-drawer-footer">
              <button
                id="mobile-btn-logout"
                onClick={handleLogout}
                className="mobile-btn-logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
