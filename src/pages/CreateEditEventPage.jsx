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
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(['Please select an image file (PNG, JPG, JPEG, WebP)']);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors(['Image file is too large. Maximum size is 10MB.']);
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    // Clear any existing URL so the file takes precedence
    setFormData((prev) => ({ ...prev, cover_image_url: '' }));
  };

  const handleRemoveImage = () => {
    setCoverFile(null);
    setCoverPreview('');
    setFormData((prev) => ({
      ...prev,
      cover_image_url: '',
    }));
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
      // Upload cover image to Cloudinary first if a file was selected
      let finalFormData = { ...formData };
      if (coverFile) {
        setUploadingImage(true);
        try {
          const uploadRes = await eventsAPI.uploadCoverImage(coverFile);
          finalFormData.cover_image_url = uploadRes.url;
        } catch (uploadErr) {
          const msg = uploadErr.response?.data?.message || 'Failed to upload cover image';
          setErrors([msg]);
          setSubmitting(false);
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      let savedEventId = eventId;
      if (isEditing) {
        const res = await eventsAPI.update(eventId, finalFormData);
        savedEventId = res.event.id;
      } else {
        const res = await eventsAPI.create(finalFormData);
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
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
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
            <label htmlFor="event-rsvp-deadline">RSVP Deadline (Date & Time) *</label>
            <input
              id="event-rsvp-deadline"
              name="rsvp_deadline"
              type="datetime-local"
              value={formData.rsvp_deadline}
              onChange={handleChange}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              required
            />
            <small className="helper-text">
              Specify cutoff date and time. Must be prior to event date. Guests cannot respond after this cutoff.
            </small>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Media & Cover Image</h2>

          {!coverPreview && !formData.cover_image_url ? (
            <div>
              <label
                htmlFor="cover-file-upload"
                className="image-upload-dropzone"
                id="dropzone-cover-upload"
              >
                <span className="upload-icon">📷</span>
                <span className="upload-prompt">Click to upload event cover photo</span>
                <span className="upload-hint">Supports JPEG, PNG, WebP (Max 10MB)</span>
                <input
                  id="cover-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  style={{ display: 'none' }}
                />
              </label>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="event-cover-url">Or paste Image URL</label>
                <input
                  id="event-cover-url"
                  name="cover_image_url"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.cover_image_url}
                  onChange={handleChange}
                />
              </div>
            </div>
          ) : (
            <div className="image-preview-card" id="cover-preview-card">
              <img
                src={coverPreview || formData.cover_image_url}
                alt="Event cover preview"
                className="cover-preview-img"
              />
              <div className="preview-actions-bar">
                <span className="preview-badge-status">
                  {coverFile ? 'Image Ready to Upload' : 'Image URL Attached'}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <label htmlFor="cover-file-change" className="btn btn-outline btn-xs" style={{ cursor: 'pointer' }}>
                    Replace Photo
                    <input
                      id="cover-file-change"
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="btn btn-danger-outline btn-xs"
                    id="btn-remove-cover-image"
                  >
                    Remove
                  </button>
                </div>
              </div>
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
            {submitting
              ? uploadingImage
                ? 'Uploading Image...'
                : 'Saving...'
              : isEditing
                ? 'Update Event'
                : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
