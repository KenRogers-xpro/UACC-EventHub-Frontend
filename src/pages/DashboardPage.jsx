import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../api/client';

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
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const totalEvents = events.length;
  const totalInvited = events.reduce((sum, e) => sum + (e.total_invited || 0), 0);
  const totalAccepted = events.reduce((sum, e) => sum + (e.total_accepted || 0), 0);
  const totalDeclined = events.reduce((sum, e) => sum + (e.total_declined || 0), 0);

  return (
    <div className="page-container dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Events Management</h1>
          <p className="page-description">
            Uganda Air Cargo Corporation corporate and protocol event tracking.
          </p>
        </div>
        <button
          id="btn-create-event-top"
          onClick={() => navigate('/events/new')}
          className="btn btn-primary"
        >
          + Create Event
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total Events</span>
          <span className="metric-value">{totalEvents}</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Invited</span>
          <span className="metric-value">{totalInvited}</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Accepted</span>
          <span className="metric-value">{totalAccepted}</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Declined</span>
          <span className="metric-value">{totalDeclined}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-error" role="alert">
          <span>{errorMessage}</span>
          <button onClick={fetchEvents} className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="spinner-wrapper" id="dashboard-spinner">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state-card">
          <h3>No Events Recorded</h3>
          <p>Create an event to begin managing corporate guest lists and attendance.</p>
          <button
            id="btn-create-first-event"
            onClick={() => navigate('/events/new')}
            className="btn btn-primary"
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id} className="event-card" id={`event-card-${event.id}`}>
              {event.cover_image_url ? (
                <div
                  className="event-card-cover"
                  style={{ backgroundImage: `url(${event.cover_image_url})` }}
                >
                  <span className="cover-badge">UACC</span>
                </div>
              ) : (
                <div className="event-card-cover">
                  <span className="cover-badge">UACC</span>
                </div>
              )}

              <div className="event-card-body">
                <h3 className="event-card-title">{event.title}</h3>

                <div className="event-card-meta">
                  <div className="meta-item">
                    <span className="meta-sub">Date:</span>
                    <span>{formatDate(event.event_date)} {event.event_time ? `• ${event.event_time}` : ''}</span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-sub">Venue:</span>
                    <span>{event.venue}</span>
                  </div>
                </div>

                <div className="rsvp-badges-row">
                  <span className="badge badge-accepted">
                    {event.total_accepted || 0} Accepted
                  </span>
                  <span className="badge badge-declined">
                    {event.total_declined || 0} Declined
                  </span>
                  <span className="badge badge-pending">
                    {event.total_pending || 0} Pending
                  </span>
                </div>

                <div className="event-card-footer">
                  <button
                    id={`btn-view-details-${event.id}`}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="btn btn-outline btn-block"
                  >
                    View Event Details
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
