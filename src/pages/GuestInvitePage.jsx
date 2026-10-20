import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { rsvpAPI } from '../api/client';
import confetti from 'canvas-confetti';
import {
  Plane,
  Calendar,
  Clock,
  MapPin,
  Tag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  FileText,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function GuestInvitePage() {
  const { token } = useParams();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorPageMessage, setErrorPageMessage] = useState('');

  // RSVP status state
  const [status, setStatus] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Materials state (downloadable once accepted)
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPassed: false,
  });

  const timerRef = useRef(null);

  // Fetch invitation details on load
  useEffect(() => {
    if (!token) {
      setErrorPageMessage('This invitation link is not valid');
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const res = await rsvpAPI.getInvite(token);
        if (res.success) {
          setInvitation(res);
          setStatus(res.current_status || 'pending');

          // If already accepted, load event materials right away
          if (res.current_status === 'accepted') {
            fetchMaterials();
          }
        } else {
          setErrorPageMessage('Invitation not found');
        }
      } catch (err) {
        console.error('Invite error:', err);
        setErrorPageMessage(
          err.response?.data?.message || 'Invitation not found or link has expired'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // Fetch downloadable materials for accepted guests
  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const res = await rsvpAPI.getMaterials(token);
      if (res.success && res.materials) {
        setMaterials(res.materials);
      }
    } catch (err) {
      console.warn('Failed to load guest materials:', err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Countdown timer logic matching Section 18
  useEffect(() => {
    if (!invitation?.event?.rsvp_deadline) return;

    const deadline = new Date(invitation.event.rsvp_deadline).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const remainingSeconds = Math.floor((deadline - now) / 1000);

      if (remainingSeconds <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true });
        clearInterval(timerRef.current);
      } else {
        const days = Math.floor(remainingSeconds / 86400);
        const hours = Math.floor((remainingSeconds % 86400) / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;

        setTimeLeft({ days, hours, minutes, seconds, isPassed: false });
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => clearInterval(timerRef.current);
  }, [invitation]);

  // Handle Accept or Decline
  const handleRSVP = async (responseType) => {
    setIsSubmitting(true);
    setActionError('');

    try {
      const res = await rsvpAPI.submitRSVP(token, responseType);
      if (res.success) {
        setStatus(res.status);
        setConfirmationMsg(res.message);

        if (responseType === 'accepted') {
          // Trigger celebratory confetti
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#DAA520', '#1E3E62', '#0B192C', '#FFD700'],
            });
          } catch (e) {
            // ignore if blocked
          }
          // Fetch event materials
          fetchMaterials();
        }
      }
    } catch (err) {
      setActionError(
        err.response?.data?.message || err.message || 'Failed to submit RSVP response'
      );
    } finally {
      setIsSubmitting(false);
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

  if (loading) {
    return (
      <div className="invite-page-container">
        <div className="spinner-wrapper">
          <div className="spinner"></div>
          <p>Verifying secure VIP invitation link...</p>
        </div>
      </div>
    );
  }

  if (errorPageMessage) {
    return (
      <div className="invite-page-container">
        <div className="invite-error-card">
          <div className="error-icon-box">
            <AlertTriangle size={48} className="text-amber" />
          </div>
          <h2>Invalid or Expired Invitation</h2>
          <p>{errorPageMessage}</p>
          <div className="error-footer">
            <span>Uganda Air Cargo Corporation • Protocol & Relations</span>
          </div>
        </div>
      </div>
    );
  }

  const { event, guest_name } = invitation;

  return (
    <div className="invite-page-container">
      {/* Decorative Corporate Top Bar */}
      <header className="invite-brand-bar">
        <div className="invite-brand-content">
          <div className="brand-logo-pill">
            <Plane size={20} className="brand-icon" />
            <div className="pill-text">
              <span className="pill-title">UGANDA AIR CARGO CORPORATION</span>
              <span className="pill-sub">Official Protocol & Corporate Invitation</span>
            </div>
          </div>
          <div className="security-badge" title="Official cryptographically verified invitation link">
            <ShieldCheck size={16} />
            <span>Verified Official Link</span>
          </div>
        </div>
      </header>

      <main className="invite-main-wrapper">
        <div className="invitation-card" id="public-invitation-card">
          {/* Cover Media */}
          <div
            className="invite-cover-header"
            style={{
              backgroundImage: event.cover_image_url
                ? `linear-gradient(to bottom, rgba(11,25,44,0.3), rgba(11,25,44,0.92)), url(${event.cover_image_url})`
                : 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
            }}
          >
            <div className="invite-cover-badge">
              <Sparkles size={14} />
              <span>Official Invitation</span>
            </div>
            <h1 className="invite-event-title">{event.title}</h1>
          </div>

          <div className="invitation-card-body">
            {/* Salutation */}
            <div className="guest-salutation-box">
              <span className="salutation-prefix">Cordially Invited:</span>
              <h2 className="guest-salutation-name">{guest_name}</h2>
              <p className="salutation-note">
                Uganda Air Cargo Corporation takes great honor in requesting the pleasure of your
                company at this distinguished gathering.
              </p>
            </div>

            {/* Event Description */}
            {event.description && (
              <div className="invite-description-box">
                <p>{event.description}</p>
              </div>
            )}

            {/* Key Event Details Grid */}
            <div className="invite-details-grid">
              <div className="invite-detail-card">
                <Calendar className="detail-icon" size={24} />
                <div>
                  <span className="detail-label">Date</span>
                  <strong className="detail-val">{formatDate(event.event_date)}</strong>
                </div>
              </div>

              {event.event_time && (
                <div className="invite-detail-card">
                  <Clock className="detail-icon" size={24} />
                  <div>
                    <span className="detail-label">Time</span>
                    <strong className="detail-val">{event.event_time}</strong>
                  </div>
                </div>
              )}

              <div className="invite-detail-card">
                <MapPin className="detail-icon" size={24} />
                <div>
                  <span className="detail-label">Venue</span>
                  <strong className="detail-val">{event.venue}</strong>
                </div>
              </div>

              {event.dress_code && (
                <div className="invite-detail-card">
                  <Tag className="detail-icon" size={24} />
                  <div>
                    <span className="detail-label">Dress Code</span>
                    <strong className="detail-val">{event.dress_code}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Live RSVP Countdown Timer (Section 18) */}
            <div className="rsvp-countdown-container">
              <span className="countdown-title">
                {timeLeft.isPassed ? 'RSVP Deadline Has Passed' : 'RSVP Deadline Countdown'}
              </span>

              {!timeLeft.isPassed ? (
                <div className="countdown-digits-row">
                  <div className="digit-card">
                    <span className="digit-num">{timeLeft.days}</span>
                    <span className="digit-label">Days</span>
                  </div>
                  <span className="digit-sep">:</span>
                  <div className="digit-card">
                    <span className="digit-num">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="digit-label">Hours</span>
                  </div>
                  <span className="digit-sep">:</span>
                  <div className="digit-card">
                    <span className="digit-num">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="digit-label">Mins</span>
                  </div>
                  <span className="digit-sep">:</span>
                  <div className="digit-card">
                    <span className="digit-num">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="digit-label">Secs</span>
                  </div>
                </div>
              ) : (
                <p className="deadline-passed-text">
                  The final response window for this ceremony closed.
                </p>
              )}
            </div>

            {/* RSVP Response Section */}
            <div className="rsvp-action-section">
              {actionError && (
                <div className="alert alert-error" role="alert">
                  <span>{actionError}</span>
                </div>
              )}

              {/* Status is PENDING and deadline hasn't passed */}
              {status === 'pending' && !timeLeft.isPassed && (
                <div className="rsvp-buttons-group">
                  <p className="rsvp-prompt">Kindly confirm your attendance below:</p>
                  <div className="buttons-row">
                    <button
                      id="btn-rsvp-accept"
                      onClick={() => handleRSVP('accepted')}
                      className="btn btn-rsvp-accept"
                      disabled={isSubmitting}
                    >
                      <CheckCircle size={20} />
                      <span>{isSubmitting ? 'Submitting...' : 'Accept & Confirm Attendance'}</span>
                    </button>
                    <button
                      id="btn-rsvp-decline"
                      onClick={() => handleRSVP('declined')}
                      className="btn btn-rsvp-decline"
                      disabled={isSubmitting}
                    >
                      <XCircle size={20} />
                      <span>{isSubmitting ? 'Submitting...' : 'Decline with Regrets'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status is ACCEPTED */}
              {status === 'accepted' && (
                <div className="status-banner banner-accepted">
                  <CheckCircle size={32} className="text-green" />
                  <div>
                    <h3 className="status-title">Attendance Confirmed</h3>
                    <p className="status-desc">
                      {confirmationMsg || 'Your attendance has been confirmed. Welcome!'}
                    </p>
                    <small>
                      You may download official event materials and access documentation below.
                    </small>
                  </div>
                </div>
              )}

              {/* Status is DECLINED */}
              {status === 'declined' && (
                <div className="status-banner banner-declined">
                  <XCircle size={32} className="text-red" />
                  <div>
                    <h3 className="status-title">Attendance Declined</h3>
                    <p className="status-desc">
                      {confirmationMsg ||
                        'Thank you for letting us know. You have been marked as unable to attend.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Status is PENDING but Deadline has passed */}
              {status === 'pending' && timeLeft.isPassed && (
                <div className="status-banner banner-expired">
                  <AlertTriangle size={32} className="text-amber" />
                  <div>
                    <h3 className="status-title">RSVP Window Closed</h3>
                    <p className="status-desc">
                      The response deadline for this event has passed. Please contact UACC Protocol
                      directly for special inquiries.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* EVENT MATERIALS (Accessible to Accepted Guests only - Section 6.2 & 18) */}
            {status === 'accepted' && (
              <div className="guest-materials-section">
                <div className="materials-header">
                  <FileText size={22} className="text-gold" />
                  <div>
                    <h3 className="materials-title">Event Materials & Program</h3>
                    <p className="materials-subtitle">
                      Exclusive documentation, itineraries, and briefings for confirmed attendees.
                    </p>
                  </div>
                </div>

                {loadingMaterials ? (
                  <div className="spinner-wrapper small">
                    <div className="spinner"></div>
                    <p>Loading documents...</p>
                  </div>
                ) : materials.length === 0 ? (
                  <p className="text-muted text-center py-2">
                    Event materials will be made available here prior to the ceremony.
                  </p>
                ) : (
                  <div className="guest-materials-list">
                    {materials.map((m) => (
                      <div key={m.id} className="guest-material-card">
                        <div className="material-left">
                          <FileText size={24} className="doc-icon" />
                          <div>
                            <span className="file-title">{m.file_name}</span>
                            <span className="file-meta">
                              {m.file_type?.toUpperCase()} • {m.file_size_kb || 0} KB
                            </span>
                          </div>
                        </div>
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="btn btn-sm btn-gold"
                        >
                          <Download size={14} />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="invite-card-footer">
            <Plane size={16} />
            <span>Uganda Air Cargo Corporation — Delivering Excellence Across Continents</span>
          </div>
        </div>
      </main>
    </div>
  );
}
