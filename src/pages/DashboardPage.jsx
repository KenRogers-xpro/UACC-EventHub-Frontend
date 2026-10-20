import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../api/client';
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await eventsAPI.getAll();
      setEvents(response.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
      setErrorMessage('Could not load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  // Aggregated totals
  const totalEvents = events.length;
  const totalInvited = events.reduce((sum, e) => sum + (e.total_invited || 0), 0);
  const totalAccepted = events.reduce((sum, e) => sum + (e.total_accepted || 0), 0);
  const totalDeclined = events.reduce((sum, e) => sum + (e.total_declined || 0), 0);

  return (
    <div className="page-container dashboard-page">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Corporate Events Overview</h1>
          <p className="page-description">
            Manage UACC ceremonies, corporate galas, client banquets, and track guest RSVPs.
          </p>
        </div>
        <button
          id="btn-create-event-top"
          onClick={() => navigate('/events/new')}
          className="btn btn-primary"
        >
          <Plus size={18} />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box bg-blue">
            <Calendar size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Events</span>
            <span className="metric-value">{totalEvents}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-purple">
            <Users size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Guests</span>
            <span className="metric-value">{totalInvited}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-green">
            <CheckCircle2 size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Accepted</span>
            <span className="metric-value">{totalAccepted}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-red">
            <XCircle size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Declined</span>
            <span className="metric-value">{totalDeclined}</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="alert alert-error" role="alert">
          <span>{errorMessage}</span>
          <button onClick={fetchEvents} className="btn-retry">
            Retry
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="spinner-wrapper" id="dashboard-spinner">
          <div className="spinner"></div>
          <p>Loading corporate events...</p>
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="empty-state-card">
          <div className="empty-icon-box">
            <Calendar size={48} />
          </div>
          <h3>No Events Created Yet</h3>
          <p>Get started by creating your first corporate event for Uganda Air Cargo Corporation.</p>
          <button
            id="btn-create-first-event"
            onClick={() => navigate('/events/new')}
            className="btn btn-primary"
          >
            <Plus size={18} />
            <span>Create Event</span>
          </button>
        </div>
      ) : (
        /* Events Grid matching Section 7.3 */
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id} className="event-card" id={`event-card-${event.id}`}>
              {/* Cover Image or Fallback Header */}
              <div
                className="event-card-cover"
                style={{
                  backgroundImage: event.cover_image_url
                    ? `linear-gradient(to bottom, rgba(11,25,44,0.2), rgba(11,25,44,0.85)), url(${event.cover_image_url})`
                    : 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
                }}
              >
                <div className="cover-badge">
                  <Sparkles size={14} />
                  <span>UACC Corporate</span>
                </div>
              </div>

              <div className="event-card-body">
                <h3 className="event-card-title">{event.title}</h3>

                <div className="event-card-meta">
                  <div className="meta-item">
                    <Calendar size={16} className="meta-icon" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>

                  {event.event_time && (
                    <div className="meta-item">
                      <Clock size={16} className="meta-icon" />
                      <span>{event.event_time}</span>
                    </div>
                  )}

                  <div className="meta-item">
                    <MapPin size={16} className="meta-icon" />
                    <span>{event.venue}</span>
                  </div>
                </div>

                {/* RSVP Summary Badges - Section 7.3 */}
                <div className="rsvp-badges-row">
                  <span className="badge badge-accepted" title="Confirmed attendees">
                    <CheckCircle2 size={13} />
                    {event.total_accepted || 0} Accepted
                  </span>
                  <span className="badge badge-declined" title="Unable to attend">
                    <XCircle size={13} />
                    {event.total_declined || 0} Declined
                  </span>
                  <span className="badge badge-pending" title="Awaiting response">
                    <HelpCircle size={13} />
                    {event.total_pending || 0} Pending
                  </span>
                </div>

                {/* Action button */}
                <div className="event-card-footer">
                  <button
                    id={`btn-view-details-${event.id}`}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="btn btn-outline btn-block"
                  >
                    <span>View Details</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
