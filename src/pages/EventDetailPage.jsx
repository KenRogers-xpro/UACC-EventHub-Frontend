import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsAPI, inviteesAPI, materialsAPI } from '../api/client';
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus,
  Users,
  Copy,
  Check,
  Upload,
  FileText,
  Download,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

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
  const [copiedToken, setCopiedToken] = useState(null);

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

  // Guest Management: Add Invitee
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

  // Guest Management: Remove Invitee
  const handleRemoveGuest = async (inviteeId, guestName) => {
    if (window.confirm(`Are you sure you want to remove ${guestName} from the guest list?`)) {
      try {
        await inviteesAPI.remove(inviteeId);
        setGuests((prev) => prev.filter((g) => g.id !== inviteeId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove guest');
      }
    }
  };

  // Copy invitation link helper
  const handleCopyLink = (tokenOrLink, id) => {
    const link = tokenOrLink.startsWith('http')
      ? tokenOrLink
      : `${window.location.origin}/invite/${tokenOrLink}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(id || 'latest');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Materials: Upload File
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
      setMaterialError(err.response?.data?.message || 'Failed to upload material');
    } finally {
      setUploadingMaterial(false);
      e.target.value = '';
    }
  };

  // Materials: Delete File
  const handleDeleteMaterial = async (materialId, fileName) => {
    if (window.confirm(`Delete file "${fileName}"?`)) {
      try {
        await materialsAPI.delete(materialId);
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete file');
      }
    }
  };

  // Delete Entire Event
  const handleDeleteEvent = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this event? This will permanently delete all guest RSVPs and materials.'
      )
    ) {
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
        weekday: 'long',
        day: '2-digit',
        month: 'long',
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
          <p>Loading event dashboard...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="page-container">
        <div className="alert alert-error" role="alert">
          <AlertCircle size={20} />
          <span>{errorMsg || 'Event not found'}</span>
        </div>
        <Link to="/dashboard" className="btn btn-primary">
          Back to Events
        </Link>
      </div>
    );
  }

  // Summary counts
  const totalInvited = guests.length;
  const totalAccepted = guests.filter((g) => g.status === 'accepted').length;
  const totalDeclined = guests.filter((g) => g.status === 'declined').length;
  const totalPending = guests.filter((g) => g.status === 'pending').length;

  return (
    <div className="page-container event-detail-page">
      {/* Navigation & Header */}
      <div className="detail-top-nav">
        <Link to="/dashboard" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to All Events</span>
        </Link>

        <div className="detail-actions">
          <button
            onClick={() => navigate(`/events/${eventId}/edit`)}
            className="btn btn-outline"
            id="btn-edit-event"
          >
            <Edit size={16} />
            <span>Edit Event</span>
          </button>
          <button
            onClick={handleDeleteEvent}
            className="btn btn-danger-outline"
            id="btn-delete-event"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Event Showcase Banner */}
      <div className="event-hero-card">
        {event.cover_image_url && (
          <div
            className="event-hero-banner"
            style={{ backgroundImage: `url(${event.cover_image_url})` }}
          />
        )}
        <div className="event-hero-content">
          <div className="hero-tags">
            <span className="badge badge-uacc">Uganda Air Cargo Corporation</span>
            {event.dress_code && (
              <span className="badge badge-tag">
                <Tag size={12} />
                {event.dress_code}
              </span>
            )}
          </div>

          <h1 className="hero-title">{event.title}</h1>
          {event.description && <p className="hero-desc">{event.description}</p>}

          <div className="hero-details-row">
            <div className="hero-meta-box">
              <Calendar size={18} className="meta-icon" />
              <div>
                <span className="meta-sub">Event Date</span>
                <strong>{formatDate(event.event_date)}</strong>
              </div>
            </div>

            {event.event_time && (
              <div className="hero-meta-box">
                <Clock size={18} className="meta-icon" />
                <div>
                  <span className="meta-sub">Time</span>
                  <strong>{event.event_time}</strong>
                </div>
              </div>
            )}

            <div className="hero-meta-box">
              <MapPin size={18} className="meta-icon" />
              <div>
                <span className="meta-sub">Venue</span>
                <strong>{event.venue}</strong>
              </div>
            </div>

            <div className="hero-meta-box highlight-deadline">
              <Clock size={18} className="meta-icon text-gold" />
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
        <div className="stat-divider" />
        <div className="stat-item text-green">
          <span className="stat-label">Accepted</span>
          <span className="stat-num">{totalAccepted}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item text-red">
          <span className="stat-label">Declined</span>
          <span className="stat-num">{totalDeclined}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item text-muted">
          <span className="stat-label">Pending</span>
          <span className="stat-num">{totalPending}</span>
        </div>
      </div>

      {/* SECTION: Guest Management (Section 7.5) */}
      <section className="detail-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">
              <Users size={20} />
              <span>Guest List & RSVP Tracking</span>
            </h2>
            <p className="section-subtitle">
              Add VIP attendees to generate individual, tamper-proof private invitation links.
            </p>
          </div>
        </div>

        {/* Add Guest Form */}
        <div className="add-guest-card">
          <h3 className="card-subheading">
            <UserPlus size={16} />
            <span>Add New Attendee</span>
          </h3>

          {guestError && (
            <div className="alert alert-error" role="alert">
              <span>{guestError}</span>
            </div>
          )}

          <form onSubmit={handleAddGuest} className="guest-inline-form" id="add-guest-form">
            <div className="input-group">
              <input
                id="guest-name-input"
                type="text"
                placeholder="Full Name *"
                value={guestForm.name}
                onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <input
                id="guest-email-input"
                type="email"
                placeholder="Email Address"
                value={guestForm.email}
                onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
              />
            </div>

            <div className="input-group">
              <input
                id="guest-phone-input"
                type="tel"
                placeholder="Phone (Optional)"
                value={guestForm.phone}
                onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
              />
            </div>

            <button
              type="submit"
              id="btn-add-guest"
              className="btn btn-primary"
              disabled={addingGuest}
            >
              <UserPlus size={16} />
              <span>{addingGuest ? 'Generating...' : 'Add Guest'}</span>
            </button>
          </form>

          {/* Newly Generated Invite Link Banner */}
          {latestInviteLink && (
            <div className="invite-link-banner" id="newly-created-link-box">
              <div className="invite-link-info">
                <CheckCircle2 size={18} className="text-green" />
                <div>
                  <strong>Invitation Link Generated:</strong>
                  <p className="invite-url-text">{latestInviteLink}</p>
                </div>
              </div>
              <div className="banner-actions">
                <button
                  onClick={() => handleCopyLink(latestInviteLink, 'latest')}
                  className="btn btn-sm btn-gold"
                  id="btn-copy-latest-link"
                >
                  {copiedToken === 'latest' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedToken === 'latest' ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={latestInviteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline"
                >
                  <ExternalLink size={14} />
                  <span>Preview</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Guest Table */}
        {guests.length === 0 ? (
          <div className="empty-substate">
            <Users size={32} />
            <p>No guests invited yet. Use the form above to add your first guest.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="guests-table">
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Contact Info</th>
                  <th>RSVP Status</th>
                  <th>Invitation Link</th>
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
                          <span className="badge badge-accepted">
                            <CheckCircle2 size={13} />
                            Accepted
                          </span>
                        )}
                        {guest.status === 'declined' && (
                          <span className="badge badge-declined">
                            <XCircle size={13} />
                            Declined
                          </span>
                        )}
                        {guest.status === 'pending' && (
                          <span className="badge badge-pending">
                            <HelpCircle size={13} />
                            Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="link-cell">
                          <button
                            id={`btn-copy-guest-link-${guest.id}`}
                            onClick={() => handleCopyLink(guest.token, guest.id)}
                            className="btn btn-xs btn-outline"
                            title="Copy unique RSVP link"
                          >
                            {copiedToken === guest.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedToken === guest.id ? 'Copied!' : 'Copy Link'}</span>
                          </button>
                          <a
                            href={inviteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-xs btn-ghost"
                            title="Open invitation page"
                          >
                            <ExternalLink size={12} />
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
                          <Trash2 size={15} />
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

      {/* SECTION: Event Materials & Documents (Section 7.5) */}
      <section className="detail-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">
              <FileText size={20} />
              <span>Event Materials & Documents</span>
            </h2>
            <p className="section-subtitle">
              Upload programs, brochures, keynote decks, or security notices (max 10MB; PDF, Word,
              Excel, Image). Downloadable exclusively by confirmed (Accepted) guests.
            </p>
          </div>

          <label className="btn btn-primary file-upload-btn" id="btn-upload-material">
            <Upload size={16} />
            <span>{uploadingMaterial ? 'Uploading...' : 'Upload File'}</span>
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
            <AlertCircle size={16} />
            <span>{materialError}</span>
          </div>
        )}

        {materials.length === 0 ? (
          <div className="empty-substate">
            <FileText size={32} />
            <p>No event materials uploaded yet. Upload event agendas or keynote briefs.</p>
          </div>
        ) : (
          <div className="materials-grid">
            {materials.map((item) => (
              <div key={item.id} className="material-card" id={`material-card-${item.id}`}>
                <div className="material-icon-box">
                  <FileText size={24} />
                </div>
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
                    className="btn-icon"
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    id={`btn-delete-material-${item.id}`}
                    onClick={() => handleDeleteMaterial(item.id, item.file_name)}
                    className="btn-icon-danger"
                    title="Delete file"
                  >
                    <Trash2 size={16} />
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
