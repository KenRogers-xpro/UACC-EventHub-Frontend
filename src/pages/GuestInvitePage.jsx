import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { rsvpAPI } from '../api/client';

export default function GuestInvitePage() {
  const { token } = useParams();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorPageMessage, setErrorPageMessage] = useState('');

  const [status, setStatus] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState('');
  const [actionError, setActionError] = useState('');

  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPassed: false,
  });

  const timerRef = useRef(null);

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

  const handleRSVP = async (responseType) => {
    setIsSubmitting(true);
    setActionError('');

    try {
      const res = await rsvpAPI.submitRSVP(token, responseType);
      if (res.success) {
        setStatus(res.status);
        setConfirmationMsg(res.message);

        if (responseType === 'accepted') {
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

  const formatFileSize = (kb) => {
    if (!kb || isNaN(kb)) return '0 KB';
    const num = parseFloat(kb);
    if (num >= 1024) {
      return `${(num / 1024).toFixed(2)} MB`;
    }
    return `${Math.round(num)} KB`;
  };

  const getFileTypeBadge = (fileName, fileType) => {
    if (fileType) return fileType.toUpperCase().slice(0, 4);
    const ext = fileName?.split('.').pop();
    return ext ? ext.toUpperCase().slice(0, 4) : 'DOC';
  };

  if (loading) {
    return (
      <div className="invite-page-container">
        <div className="spinner-wrapper">
          <div className="spinner"></div>
          <p>Verifying invitation record...</p>
        </div>
      </div>
    );
  }

  if (errorPageMessage) {
    return (
      <div className="invite-page-container">
        <div className="invite-error-card">
          <h2>Invitation Notice</h2>
          <p>{errorPageMessage}</p>
          <div className="error-footer">
            Uganda Air Cargo Corporation
          </div>
        </div>
      </div>
    );
  }

  const { event, guest_name } = invitation;

  return (
    <div className="invite-page-container">
      <header className="invite-brand-bar">
        <div className="invite-brand-content">
          <div className="brand-logo-pill">
            <div className="brand-mark">UACC</div>
            <div className="pill-text">
              <span className="pill-title">UGANDA AIR CARGO CORPORATION</span>
              <span className="pill-sub">Official Corporate Invitation</span>
            </div>
          </div>
          <span className="security-badge">REF: {token.substring(0, 8).toUpperCase()}</span>
        </div>
      </header>

      <main className="invite-main-wrapper">
        <div className="invitation-card" id="public-invitation-card">
          {event.cover_image_url && (
            <div
              className="invite-cover-header"
              style={{ backgroundImage: `url(${event.cover_image_url})` }}
            >
              <span className="invite-cover-badge">Official Invitation</span>
              <h1 className="invite-event-title">{event.title}</h1>
            </div>
          )}

          {!event.cover_image_url && (
            <div className="invite-cover-header">
              <span className="invite-cover-badge">Official Invitation</span>
              <h1 className="invite-event-title">{event.title}</h1>
            </div>
          )}

          <div className="invitation-card-body">
            <div className="guest-salutation-box">
              <span className="salutation-prefix">To:</span>
              <h2 className="guest-salutation-name">{guest_name}</h2>
              <p className="salutation-note">
                Uganda Air Cargo Corporation requests your presence at the following corporate event.
              </p>
            </div>

            {event.description && (
              <div className="invite-description-box">
                <p>{event.description}</p>
              </div>
            )}

            <div className="invite-details-grid">
              <div className="invite-detail-card">
                <div>
                  <span className="detail-label">Date</span>
                  <strong className="detail-val">{formatDate(event.event_date)}</strong>
                </div>
              </div>

              {event.event_time && (
                <div className="invite-detail-card">
                  <div>
                    <span className="detail-label">Time</span>
                    <strong className="detail-val">{event.event_time}</strong>
                  </div>
                </div>
              )}

              <div className="invite-detail-card">
                <div>
                  <span className="detail-label">Venue</span>
                  <strong className="detail-val">{event.venue}</strong>
                </div>
              </div>

              {event.dress_code && (
                <div className="invite-detail-card">
                  <div>
                    <span className="detail-label">Dress Code</span>
                    <strong className="detail-val">{event.dress_code}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Countdown Timer */}
            <div className="rsvp-countdown-container">
              <span className="countdown-title">
                {timeLeft.isPassed ? 'RSVP Deadline Passed' : 'RSVP Response Window'}
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
                  The deadline for RSVP responses has elapsed.
                </p>
              )}
            </div>

            {/* RSVP Action */}
            <div className="rsvp-action-section">
              {actionError && (
                <div className="alert alert-error" role="alert">
                  <span>{actionError}</span>
                </div>
              )}

              {status === 'pending' && !timeLeft.isPassed && (
                <div className="rsvp-buttons-group">
                  <p className="rsvp-prompt">Please submit your response:</p>
                  <div className="buttons-row">
                    <button
                      id="btn-rsvp-accept"
                      onClick={() => handleRSVP('accepted')}
                      className="btn-rsvp-accept"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Accept & Confirm Attendance'}
                    </button>
                    <button
                      id="btn-rsvp-decline"
                      onClick={() => handleRSVP('declined')}
                      className="btn-rsvp-decline"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Decline with Regrets'}
                    </button>
                  </div>
                </div>
              )}

              {status === 'accepted' && (
                <div className="status-banner banner-accepted">
                  <h3 className="status-title">Attendance Confirmed</h3>
                  <p className="status-desc">
                    {confirmationMsg || 'Your attendance has been recorded.'}
                  </p>
                </div>
              )}

              {status === 'declined' && (
                <div className="status-banner banner-declined">
                  <h3 className="status-title">Attendance Declined</h3>
                  <p className="status-desc">
                    {confirmationMsg || 'You have been marked as unable to attend.'}
                  </p>
                </div>
              )}

              {status === 'pending' && timeLeft.isPassed && (
                <div className="status-banner banner-expired">
                  <h3 className="status-title">RSVP Closed</h3>
                  <p className="status-desc">
                    The response deadline has passed.
                  </p>
                </div>
              )}
            </div>

            {/* Event Documentation */}
            {status === 'accepted' && (
              <div className="guest-materials-section">
                <div className="materials-header">
                  <h3 className="materials-title">Event Documentation</h3>
                  <p className="materials-subtitle">
                    Official documents for confirmed attendees.
                  </p>
                </div>

                {loadingMaterials ? (
                  <div className="spinner-wrapper small">
                    <div className="spinner"></div>
                    <p>Loading files...</p>
                  </div>
                ) : materials.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    No downloadable materials currently attached to this event.
                  </p>
                ) : (
                  <div className="guest-materials-list">
                    {materials.map((m) => {
                      const badge = getFileTypeBadge(m.file_name, m.file_type);
                      return (
                        <div key={m.id} className="guest-material-card">
                          <div className="material-left">
                            <div>
                              <span className="file-title">{m.file_name}</span>
                              <span className="file-meta">
                                {badge} • {formatFileSize(m.file_size_kb)}
                              </span>
                            </div>
                          </div>
                          <a
                            href={m.file_url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="btn btn-sm btn-outline"
                          >
                            Download
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="invite-card-footer">
            Uganda Air Cargo Corporation — Official Protocol
          </div>
        </div>
      </main>
    </div>
  );
}
