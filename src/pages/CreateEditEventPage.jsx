import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventsAPI } from '../api/client';

export default function CreateEditEventPage() {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const isEditing = Boolean(eventId);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    venue: '',
    dress_code: '',
    rsvp_deadline: '',
    cover_image_url: '',
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const pageTitle = isEditing ? 'Edit Event' : 'Create Event';

  useEffect(() => {
    if (isEditing) {
      const fetchEvent = async () => {
        try {
          const res = await eventsAPI.getOne(eventId);
          if (res.event) {
            const e = res.event;
            const formattedDate = e.event_date ? e.event_date.split('T')[0] : '';
            let formattedRsvp = '';
            if (e.rsvp_deadline) {
              const d = new Date(e.rsvp_deadline);
              formattedRsvp = d.toISOString().slice(0, 16);
            }

            setFormData({
              title: e.title || '',
              description: e.description || '',
              event_date: formattedDate,
              event_time: e.event_time || '',
              venue: e.venue || '',
              dress_code: e.dress_code || '',
              rsvp_deadline: formattedRsvp,
              cover_image_url: e.cover_image_url || '',
            });
          }
        } catch (err) {
          console.error('Failed to load event:', err);
          setErrors(['Could not load event details.']);
        } finally {
          setLoading(false);
        }
      };

      fetchEvent();
    }
  }, [eventId, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = [];

    if (!formData.title.trim()) newErrors.push('Event title is required');
    if (!formData.event_date) newErrors.push('Event date is required');
    if (!formData.venue.trim()) newErrors.push('Venue is required');
    if (!formData.rsvp_deadline) newErrors.push('RSVP deadline is required');

    if (formData.event_date && formData.rsvp_deadline) {
      const eventDate = new Date(formData.event_date);
      const rsvpDeadline = new Date(formData.rsvp_deadline);
      if (rsvpDeadline > eventDate) {
        newErrors.push('RSVP deadline must be before the event date');
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);
    setSubmitting(true);

    try {
      let savedEventId = eventId;
      if (isEditing) {
        const res = await eventsAPI.update(eventId, formData);
        savedEventId = res.event.id;
      } else {
        const res = await eventsAPI.create(formData);
        savedEventId = res.event.id;
      }

      setSuccessMessage('Event record saved.');
      setTimeout(() => {
        navigate(`/events/${savedEventId}`);
      }, 600);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save event';
      setErrors([msg]);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner-wrapper">
          <div className="spinner"></div>
          <p>Loading event record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container form-page">
      <div className="form-page-header">
        <Link to="/dashboard" className="back-link">
          ← Back to Events
        </Link>
        <h1 className="page-title">{pageTitle}</h1>
        <p className="page-description">
          Enter corporate event specifications and RSVP deadline below.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="alert alert-error" role="alert">
          <div>
            {errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="event-form-card" id="event-editor-form">
        <div className="form-section">
          <h2 className="section-title">Event Information</h2>

          <div className="form-group">
            <label htmlFor="event-title">Event Title *</label>
            <input
              id="event-title"
              name="title"
              type="text"
              placeholder="e.g. UACC Annual Aviation Gala"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-description">Description</label>
            <textarea
              id="event-description"
              name="description"
              rows={4}
              placeholder="Official event details and schedule..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Schedule & Location</h2>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="event-date">Date *</label>
              <input
                id="event-date"
                name="event_date"
                type="date"
                value={formData.event_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-time">Time</label>
              <input
                id="event-time"
                name="event_time"
                type="text"
                placeholder="e.g. 18:00 EAT"
                value={formData.event_time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="event-venue">Venue *</label>
              <input
                id="event-venue"
                name="venue"
                type="text"
                placeholder="e.g. Kampala Serena Hotel"
                value={formData.venue}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-dress-code">Dress Code</label>
              <input
                id="event-dress-code"
                name="dress_code"
                type="text"
                placeholder="e.g. Black Tie / Formal"
                value={formData.dress_code}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">RSVP Deadline</h2>
          <div className="form-group">
            <label htmlFor="event-rsvp-deadline">RSVP Deadline *</label>
            <input
              id="event-rsvp-deadline"
              name="rsvp_deadline"
              type="datetime-local"
              value={formData.rsvp_deadline}
              onChange={handleChange}
              required
            />
            <small className="helper-text">
              Must be prior to the event date. Guests cannot respond after this cutoff.
            </small>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Media</h2>
          <div className="form-group">
            <label htmlFor="event-cover-url">Cover Image URL</label>
            <input
              id="event-cover-url"
              name="cover_image_url"
              type="url"
              placeholder="https://..."
              value={formData.cover_image_url}
              onChange={handleChange}
            />
          </div>

          {formData.cover_image_url && (
            <div className="image-preview-container">
              <img
                src={formData.cover_image_url}
                alt="Event cover"
                className="cover-preview-img"
              />
            </div>
          )}
        </div>

        <div className="form-actions">
          <Link to="/dashboard" className="btn btn-outline">
            Cancel
          </Link>
          <button
            type="submit"
            id="btn-save-event"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
