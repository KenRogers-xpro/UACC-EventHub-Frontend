import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsAPI, inviteesAPI, materialsAPI } from '../api/client';

export default function EventDetailPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Add Guest Form State
  const [guestForm, setGuestForm] = useState({ name: '', email: '', phone: '' });
  const [addingGuest, setAddingGuest] = useState(false);
  const [guestError, setGuestError] = useState('');
  const [latestInviteLink, setLatestInviteLink] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Material Upload State
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState('');

  const fetchEventData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await eventsAPI.getOne(eventId);
      setEvent(res.event);
      setGuests(res.guests || []);
      setMaterials(res.materials || []);
    } catch (err) {
      console.error('Failed to load event data:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!guestForm.name.trim()) {
      setGuestError('Guest name is required');
      return;
    }

    setGuestError('');
    setAddingGuest(true);
    try {
      const res = await inviteesAPI.add(eventId, guestForm);
      if (res.success) {
        setGuests((prev) => [res.invitee, ...prev]);
        setLatestInviteLink(res.invite_link);
        setGuestForm({ name: '', email: '', phone: '' });
      }
    } catch (err) {
      setGuestError(err.response?.data?.message || 'Failed to add guest');
    } finally {
      setAddingGuest(false);
    }
  };

  const handleRemoveGuest = async (inviteeId, guestName) => {
    if (window.confirm(`Remove ${guestName} from guest list?`)) {
      try {
        await inviteesAPI.remove(inviteeId);
        setGuests((prev) => prev.filter((g) => g.id !== inviteeId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove guest');
      }
    }
  };

  const handleCopyLink = (tokenOrLink, id) => {
    const link = tokenOrLink.startsWith('http')
      ? tokenOrLink
      : `${window.location.origin}/invite/${tokenOrLink}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMaterialError('');
    setUploadingMaterial(true);
    try {
      const res = await materialsAPI.upload(eventId, file);
      if (res.success && res.material) {
        setMaterials((prev) => [res.material, ...prev]);
      }
    } catch (err) {
      setMaterialError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingMaterial(false);
      e.target.value = '';
    }
  };

  const handleDeleteMaterial = async (materialId, fileName) => {
    if (window.confirm(`Delete document "${fileName}"?`)) {
      try {
        await materialsAPI.delete(materialId);
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete file');
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm('Delete this event? This will remove all associated invitees and materials.')) {
      try {
        await eventsAPI.delete(eventId);
        navigate('/dashboard');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete event');
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const formatDeadline = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
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

  if (errorMsg || !event) {
    return (
      <div className="page-container">
        <div className="alert alert-error" role="alert">
          <span>{errorMsg || 'Event not found'}</span>
        </div>
        <Link to="/dashboard" className="btn btn-outline">
          Return to Events
        </Link>
      </div>
    );
  }

  const totalInvited = guests.length;
  const totalAccepted = guests.filter((g) => g.status === 'accepted').length;
  const totalDeclined = guests.filter((g) => g.status === 'declined').length;
  const totalPending = guests.filter((g) => g.status === 'pending').length;

  return (
    <div className="page-container event-detail-page">
      <div className="detail-top-nav">
        <Link to="/dashboard" className="back-link">
          ← Back to Events
        </Link>

        <div className="detail-actions">
          <button
            onClick={() => navigate(`/events/${eventId}/edit`)}
            className="btn btn-outline btn-sm"
            id="btn-edit-event"
          >
            Edit Event
          </button>
          <button
            onClick={handleDeleteEvent}
            className="btn btn-danger-outline btn-sm"
            id="btn-delete-event"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Event Showcase */}
      <div className="event-hero-card">
        {event.cover_image_url && (
          <div
            className="event-hero-banner"
            style={{ backgroundImage: `url(${event.cover_image_url})` }}
          />
        )}
        <div className="event-hero-content">
          <div className="hero-tags">
            <span className="badge badge-uacc">UACC Corporate</span>
            {event.dress_code && (
              <span className="badge badge-tag">{event.dress_code}</span>
            )}
          </div>

          <h1 className="hero-title">{event.title}</h1>
          {event.description && <p className="hero-desc">{event.description}</p>}

          <div className="hero-details-row">
            <div className="hero-meta-box">
              <div>
                <span className="meta-sub">Event Date</span>
                <strong>{formatDate(event.event_date)}</strong>
              </div>
            </div>

            {event.event_time && (
              <div className="hero-meta-box">
                <div>
                  <span className="meta-sub">Time</span>
                  <strong>{event.event_time}</strong>
                </div>
              </div>
            )}

            <div className="hero-meta-box">
              <div>
                <span className="meta-sub">Venue</span>
                <strong>{event.venue}</strong>
              </div>
            </div>

            <div className="hero-meta-box highlight-deadline">
              <div>
                <span className="meta-sub">RSVP Cutoff</span>
                <strong>{formatDeadline(event.rsvp_deadline)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RSVP Stats Bar */}
      <div className="stats-summary-bar">
        <div className="stat-item">
          <span className="stat-label">Total Invited</span>
          <span className="stat-num">{totalInvited}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Accepted</span>
          <span className="stat-num">{totalAccepted}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Declined</span>
          <span className="stat-num">{totalDeclined}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-num">{totalPending}</span>
        </div>
      </div>

      {/* Guest Management Section */}
      <section className="detail-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Guest List & Attendance</h2>
            <p className="section-subtitle">
              Add attendees to generate distinct, private invitation links.
            </p>
          </div>
        </div>

        <div className="add-guest-card">
          <h3 className="card-subheading">Add Attendee</h3>

          {guestError && (
            <div className="alert alert-error" role="alert">
              <span>{guestError}</span>
            </div>
          )}

          <form onSubmit={handleAddGuest} className="guest-inline-form" id="add-guest-form">
            <input
              id="guest-name-input"
              type="text"
              placeholder="Full Name *"
              value={guestForm.name}
              onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
              required
            />

            <input
              id="guest-email-input"
              type="email"
              placeholder="Email Address"
              value={guestForm.email}
              onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
            />

            <input
              id="guest-phone-input"
              type="tel"
              placeholder="Phone (Optional)"
              value={guestForm.phone}
              onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
            />

            <button
              type="submit"
              id="btn-add-guest"
              className="btn btn-primary"
              disabled={addingGuest}
            >
              {addingGuest ? 'Adding...' : 'Add Guest'}
            </button>
          </form>

          {latestInviteLink && (
            <div className="invite-link-banner" id="newly-created-link-box">
              <div className="invite-link-info">
                <div>
                  <span className="meta-sub">Generated Invitation Link:</span>
                  <p className="invite-url-text">{latestInviteLink}</p>
                </div>
              </div>
              <div className="banner-actions">
                <button
                  onClick={() => handleCopyLink(latestInviteLink, 'latest')}
                  className="btn btn-sm btn-outline"
                  id="btn-copy-latest-link"
                >
                  {copiedId === 'latest' ? 'Copied' : 'Copy Link'}
                </button>
                <a
                  href={latestInviteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline"
                >
                  Preview
                </a>
              </div>
            </div>
          )}
        </div>

        {guests.length === 0 ? (
          <div className="empty-substate">
            No guests registered for this event yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="guests-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Invite Link</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => {
                  const inviteUrl = `${window.location.origin}/invite/${guest.token}`;
                  return (
                    <tr key={guest.id} id={`guest-row-${guest.id}`}>
                      <td>
                        <strong>{guest.name}</strong>
                      </td>
                      <td>
                        <div className="contact-cell">
                          {guest.email && <span>{guest.email}</span>}
                          {guest.phone && <small>{guest.phone}</small>}
                          {!guest.email && !guest.phone && <span className="text-muted">—</span>}
                        </div>
                      </td>
                      <td>
                        {guest.status === 'accepted' && (
                          <span className="badge badge-accepted">Accepted</span>
                        )}
                        {guest.status === 'declined' && (
                          <span className="badge badge-declined">Declined</span>
                        )}
                        {guest.status === 'pending' && (
                          <span className="badge badge-pending">Pending</span>
                        )}
                      </td>
                      <td>
                        <div className="link-cell">
                          <button
                            id={`btn-copy-guest-link-${guest.id}`}
                            onClick={() => handleCopyLink(guest.token, guest.id)}
                            className="btn btn-xs btn-outline"
                          >
                            {copiedId === guest.id ? 'Copied' : 'Copy'}
                          </button>
                          <a
                            href={inviteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-xs btn-ghost"
                            title="Open link"
                          >
                            ↗
                          </a>
                        </div>
                      </td>
                      <td className="text-right">
                        <button
                          id={`btn-remove-guest-${guest.id}`}
                          onClick={() => handleRemoveGuest(guest.id, guest.name)}
                          className="btn-icon-danger"
                          title="Remove guest"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Materials Section */}
      <section className="detail-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Event Documentation</h2>
            <p className="section-subtitle">
              Upload event documents (PDF, Word, Excel, images - max 10MB). Accessible to confirmed attendees.
            </p>
          </div>

          <label className="btn btn-outline btn-sm" id="btn-upload-material">
            <span>{uploadingMaterial ? 'Uploading...' : '+ Upload File'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploadingMaterial}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {materialError && (
          <div className="alert alert-error" role="alert">
            <span>{materialError}</span>
          </div>
        )}

        {materials.length === 0 ? (
          <div className="empty-substate">
            No materials uploaded for this event.
          </div>
        ) : (
          <div className="materials-grid">
            {materials.map((item) => (
              <div key={item.id} className="material-card" id={`material-card-${item.id}`}>
                <div className="material-icon-box">DOC</div>
                <div className="material-info">
                  <h4 className="material-name" title={item.file_name}>
                    {item.file_name}
                  </h4>
                  <span className="material-meta">
                    {item.file_type?.toUpperCase()} • {item.file_size_kb || 0} KB
                  </span>
                </div>
                <div className="material-actions">
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="btn btn-xs btn-outline"
                  >
                    Download
                  </a>
                  <button
                    id={`btn-delete-material-${item.id}`}
                    onClick={() => handleDeleteMaterial(item.id, item.file_name)}
                    className="btn-icon-danger"
                    title="Delete file"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
