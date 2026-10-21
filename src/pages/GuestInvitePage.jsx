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

  // Live countdown state
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPassed: false,
    started: false,
  });

  const timerRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setErrorPageMessage('This invitation link is not valid or has missing credentials.');
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
          setErrorPageMessage('Invitation not found.');
        }
      } catch (err) {
        console.error('Invite error:', err);
        setErrorPageMessage(
          err.response?.data?.message || 'Invitation not found or link has expired.'
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

  // Live countdown targeting event date (or RSVP deadline)
  useEffect(() => {
    if (!invitation?.event) return;

    // Use event_date as the primary celebration countdown target
    const targetDateStr = invitation.event.event_date || invitation.event.rsvp_deadline;
    if (!targetDateStr) return;

    const targetTime = new Date(targetDateStr).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPassed: true,
          started: true,
        });
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setCountdown({
          days,
          hours,
          minutes,
          seconds,
          isPassed: false,
          started: false,
        });
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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

  const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
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
      return `${(num / 1024).toFixed(1)} MB`;
    }
    return `${Math.round(num)} KB`;
  };

  const getFileTypeBadge = (fileName, fileType) => {
    if (fileType) return fileType.toUpperCase().slice(0, 4);
    const ext = fileName?.split('.').pop();
    return ext ? ext.toUpperCase().slice(0, 4) : 'DOC';
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!invitation?.event) return '#';
    const ev = invitation.event;
    const title = encodeURIComponent(ev.title || 'UACC Corporate Event');
    const location = encodeURIComponent(ev.venue || 'Uganda Air Cargo Corporation');
    const details = encodeURIComponent(
      `${ev.description || ''}\n\nOfficial Corporate Invitation for ${invitation.guest_name}\nHosted by Uganda Air Cargo Corporation.`
    );

    let datesParam = '';
    try {
      const d = new Date(ev.event_date);
      if (!isNaN(d.getTime())) {
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        datesParam = `&dates=${year}${month}${day}T060000Z/${year}${month}${day}T160000Z`;
      }
    } catch {
      // fallback
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}${datesParam}&location=${location}&details=${details}`;
  };

  // Apple / Outlook .ics calendar download
  const handleDownloadIcs = () => {
    if (!invitation?.event) return;
    const ev = invitation.event;

    let dtStart = '20261025T060000Z';
    let dtEnd = '20261025T160000Z';
    try {
      const d = new Date(ev.event_date);
      if (!isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        dtStart = `${y}${m}${day}T060000Z`;
        dtEnd = `${y}${m}${day}T160000Z`;
      }
    } catch {
      // default
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Uganda Air Cargo Corporation//EventHub//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${token}@uacc.go.ug`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${(ev.title || 'UACC Event').replace(/,/g, '\\,')}`,
      `LOCATION:${(ev.venue || 'UACC Venue').replace(/,/g, '\\,')}`,
      `DESCRIPTION:${(ev.description || 'Uganda Air Cargo Corporation Event').replace(/\n/g, '\\n')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `${(ev.title || 'uacc_event').toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="invite-full-screen-loading">
        <div className="invite-loading-box">
          <div className="invite-spinner"></div>
          <span className="loading-kicker">UGANDA AIR CARGO CORPORATION</span>
          <p className="loading-text">Preparing your official invitation...</p>
        </div>
      </div>
    );
  }

  if (errorPageMessage) {
    return (
      <div className="invite-full-screen-loading">
        <div className="invite-error-glass">
          <div className="error-seal">UACC</div>
          <h2 className="error-title">Official Protocol Notice</h2>
          <p className="error-desc">{errorPageMessage}</p>
          <div className="error-divider"></div>
          <p className="error-footnote">
            If you believe this is in error, please contact the UACC Protocol Desk.
          </p>
        </div>
      </div>
    );
  }

  const { event, guest_name } = invitation;
  const isDeadlinePassed = countdown.isPassed;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue || 'Entebbe, Uganda')}`;
  const whatsappUrl = `https://wa.me/256701050600?text=${encodeURIComponent(
    `Hello UACC Protocol Desk, I am ${guest_name} regarding the invitation for "${event.title}".`
  )}`;

  return (
    <div className="invite-fullscreen-page" id="top">
      {/* 1. TOP BRAND PROTOCOL BAR */}
      <header className="invite-top-nav">
        <div className="top-nav-container">
          <div className="top-nav-brand">
            <div className="brand-crest">
              <span className="crest-initials">UACC</span>
            </div>
            <div className="brand-titles">
              <span className="brand-company">UGANDA AIR CARGO CORPORATION</span>
              <span className="brand-sub">OFFICIAL INVITATION PORTAL</span>
            </div>
          </div>

          <div className="top-nav-actions">
            <span className="ref-token-pill">REF: {token.substring(0, 8).toUpperCase()}</span>
            <a href="#rsvp" className="nav-rsvp-pill">
              {status === 'accepted' ? '✓ Attending' : status === 'declined' ? 'Declined' : 'RSVP Now'}
            </a>
          </div>
        </div>
      </header>

      {/* 2. GRAND FULL-SCREEN HERO SECTION */}
      <section className="grand-hero-section">
        <div className="hero-ambient-glow"></div>
        <div className="hero-grid-container">
          {/* Left Column: Typography & Formal Invitation */}
          <div className="hero-content-column">
            <div className="hero-kicker-row">
              <span className="kicker-line"></span>
              <span className="hero-kicker-text">OFFICIAL CORPORATE CORRESPONDENCE</span>
            </div>

            <h1 className="hero-event-title">{event.title}</h1>

            <div className="hero-honour-strip">
              <span className="honour-label">IN HONOUR OF YOUR PRESENCE</span>
              <div className="hero-guest-salutation">
                <span className="salutation-prefix">Dear</span>
                <span className="salutation-name">{guest_name}</span>
              </div>
            </div>

            <p className="hero-invitation-message">
              The Board of Directors and Executive Management of{' '}
              <strong>Uganda Air Cargo Corporation</strong> take pleasure in requesting your company at this
              official occasion.
            </p>

            <div className="hero-action-row">
              <a href="#rsvp" className="hero-btn-primary">
                {status === 'accepted' ? 'View Your RSVP Status ↗' : 'Confirm Your Attendance ↗'}
              </a>
              <a href="#details" className="hero-btn-secondary">
                Event Schedule & Details ↓
              </a>
            </div>

            <div className="hero-meta-bar">
              <div className="meta-item">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{formatDateLong(event.event_date)}</span>
              </div>
              <div className="meta-item">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="meta-venue-truncate">{event.venue}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Seamlessly Blending Without Borders */}
          <div className="hero-visual-column">
            <div className="hero-image-blend-wrapper">
              {event.cover_image_url ? (
                <div className="hero-blend-frame">
                  <img
                    src={event.cover_image_url}
                    alt={event.title}
                    className="hero-borderless-image"
                    fetchPriority="high"
                  />
                  <div className="hero-image-soft-gradient-overlay"></div>
                </div>
              ) : (
                <div className="hero-default-crest-visual">
                  <div className="crest-rings-outer"></div>
                  <div className="crest-rings-inner"></div>
                  <div className="crest-symbol">UACC</div>
                  <span className="crest-caption">UGANDA AIR CARGO CORPORATION</span>
                  <span className="crest-motto">Wings of the Nation</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <a href="#countdown" className="hero-scroll-cue" aria-label="Scroll to view event countdown and details">
          <span>Explore Details</span>
          <span className="scroll-chevron">↓</span>
        </a>
      </section>

      {/* 3. LIVE COUNTDOWN SECTION */}
      <section className="grand-countdown-section" id="countdown">
        <div className="countdown-wrap center">
          <div className="ornament-divider" aria-hidden="true">
            <span className="orn-line"></span>
            <span className="orn-diamond">✦</span>
            <span className="orn-line"></span>
          </div>

          <h2 className="countdown-heading">
            {countdown.isPassed ? 'The Event Date Has Arrived' : 'Counting Down To The Occasion'}
          </h2>

          {!countdown.isPassed ? (
            <div className="countdown-tiles-row">
              <div className="timer-tile">
                <span className="timer-num">{countdown.days}</span>
                <span className="timer-tag">Days</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-tile">
                <span className="timer-num">{String(countdown.hours).padStart(2, '0')}</span>
                <span className="timer-tag">Hours</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-tile">
                <span className="timer-num">{String(countdown.minutes).padStart(2, '0')}</span>
                <span className="timer-tag">Minutes</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-tile">
                <span className="timer-num">{String(countdown.seconds).padStart(2, '0')}</span>
                <span className="timer-tag">Seconds</span>
              </div>
            </div>
          ) : (
            <p className="countdown-passed-banner">
              The scheduled time for this gathering has commenced. Welcome!
            </p>
          )}

          <p className="countdown-subtext">
            {event.rsvp_deadline && (
              <>
                Please ensure you confirm your RSVP before the protocol cutoff date:{' '}
                <strong>{formatDateLong(event.rsvp_deadline)}</strong>.
              </>
            )}
          </p>
        </div>
      </section>

      {/* 4. EVENT DETAILS SECTION */}
      <section className="grand-details-section" id="details">
        <div className="section-container">
          <div className="section-header-center">
            <span className="section-mini-kicker">CEREMONIAL SPECIFICATIONS</span>
            <h2 className="section-title-serif">Event Information</h2>
            <div className="ornament-divider" aria-hidden="true">
              <span className="orn-line"></span>
              <span className="orn-diamond">✦</span>
              <span className="orn-line"></span>
            </div>
          </div>

          {/* Description narrative */}
          {event.description && (
            <div className="event-narrative-card">
              <p className="narrative-body">{event.description}</p>
            </div>
          )}

          {/* Details Specifications Grid */}
          <div className="details-cards-grid">
            {/* Card 1: Date */}
            <div className="detail-glass-card">
              <div className="card-icon-bubble">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="card-info">
                <span className="info-label">Date</span>
                <span className="info-value">{formatDateLong(event.event_date)}</span>
              </div>
            </div>

            {/* Card 2: Time */}
            {event.event_time && (
              <div className="detail-glass-card">
                <div className="card-icon-bubble">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="card-info">
                  <span className="info-label">Time</span>
                  <span className="info-value">{event.event_time}</span>
                </div>
              </div>
            )}

            {/* Card 3: Venue & Directions */}
            <div className="detail-glass-card">
              <div className="card-icon-bubble">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="card-info">
                <span className="info-label">Venue & Location</span>
                <span className="info-value">{event.venue}</span>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-directions-link"
                >
                  Get Directions on Maps ↗
                </a>
              </div>
            </div>

            {/* Card 4: Dress Code */}
            {event.dress_code && (
              <div className="detail-glass-card">
                <div className="card-icon-bubble">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
                  </svg>
                </div>
                <div className="card-info">
                  <span className="info-label">Dress Code</span>
                  <span className="info-value">{event.dress_code}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. RSVP RESPONSE SECTION */}
      <section className="grand-rsvp-section" id="rsvp">
        <div className="section-container narrow">
          <div className="section-header-center">
            <span className="section-mini-kicker">ATTENDANCE CONFIRMATION</span>
            <h2 className="section-title-serif">Kindly RSVP</h2>
            <p className="rsvp-lead-sub">
              Please inform the Organizing Committee if you will join us for this occasion.
            </p>
            {event.rsvp_deadline && (
              <p className="rsvp-deadline-sub">
                Official protocol cutoff: <strong>{formatDateLong(event.rsvp_deadline)}</strong>
              </p>
            )}
          </div>

          <div className="rsvp-interactive-card">
            {actionError && (
              <div className="rsvp-error-banner" role="alert">
                <span>{actionError}</span>
              </div>
            )}

            {/* Status Feedback Banners */}
            {status === 'accepted' && (
              <div className="status-hero-banner status-accepted-hero">
                <div className="status-tick-circle">✓</div>
                <h3 className="status-hero-title">Attendance Confirmed</h3>
                <p className="status-hero-text">
                  {confirmationMsg || 'Your seat reservation has been recorded. We look forward to welcoming you.'}
                </p>
                <div className="status-action-row">
                  <button
                    onClick={() => handleRSVP('declined')}
                    disabled={isSubmitting}
                    className="btn-status-change"
                  >
                    Change to Unable to Attend
                  </button>
                </div>
              </div>
            )}

            {status === 'declined' && (
              <div className="status-hero-banner status-declined-hero">
                <div className="status-cross-circle">✕</div>
                <h3 className="status-hero-title">Response Recorded</h3>
                <p className="status-hero-text">
                  {confirmationMsg || 'You have sent regrets for this event. Thank you for notifying us.'}
                </p>
                <div className="status-action-row">
                  <button
                    onClick={() => handleRSVP('accepted')}
                    disabled={isSubmitting}
                    className="btn-status-change-accept"
                  >
                    Change to Attending
                  </button>
                </div>
              </div>
            )}

            {status === 'pending' && (
              <div className="rsvp-options-container">
                <p className="rsvp-options-prompt">Will you honour us with your attendance?</p>
                <div className="rsvp-choices-grid">
                  <button
                    id="btn-rsvp-accept-main"
                    onClick={() => handleRSVP('accepted')}
                    disabled={isSubmitting}
                    className="rsvp-choice-card choice-accept"
                  >
                    <span className="choice-icon">✓</span>
                    <span className="choice-title">Yes, I Will Attend</span>
                    <span className="choice-subtitle">Reserve my place</span>
                  </button>

                  <button
                    id="btn-rsvp-decline-main"
                    onClick={() => handleRSVP('declined')}
                    disabled={isSubmitting}
                    className="rsvp-choice-card choice-decline"
                  >
                    <span className="choice-icon">✕</span>
                    <span className="choice-title">Sorry, Unable to Attend</span>
                    <span className="choice-subtitle">Send my regrets</span>
                  </button>
                </div>

                {isSubmitting && (
                  <div className="rsvp-submitting-indicator">
                    <div className="small-inline-spinner"></div>
                    <span>Recording your protocol response...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. CALENDAR INTEGRATION SECTION */}
      <section className="grand-calendar-section" id="calendar">
        <div className="section-container center">
          <div className="section-header-center">
            <span className="section-mini-kicker">SCHEDULE INTEGRATION</span>
            <h2 className="section-title-serif">Add to Your Calendar</h2>
            <p className="calendar-sub">
              Ensure you do not miss this gathering by adding it directly to your digital agenda.
            </p>
          </div>

          <div className="calendar-buttons-row">
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="calendar-btn calendar-google-btn"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.067 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              <span>Add to Google Calendar</span>
            </a>

            <button
              onClick={handleDownloadIcs}
              type="button"
              className="calendar-btn calendar-ics-btn"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Download iCal / Outlook (.ics)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. OFFICIAL EVENT DOCUMENTATION (FOR CONFIRMED GUESTS) */}
      {status === 'accepted' && (
        <section className="grand-materials-section" id="materials">
          <div className="section-container">
            <div className="section-header-center">
              <span className="section-mini-kicker">ATTENDEE ACCESS</span>
              <h2 className="section-title-serif">Event Documentation</h2>
              <p className="materials-lead-sub">
                Official documents, briefing papers, and passes prepared for confirmed guests.
              </p>
            </div>

            {loadingMaterials ? (
              <div className="materials-loading-wrapper">
                <div className="small-inline-spinner"></div>
                <span>Retrieving official event files...</span>
              </div>
            ) : materials.length === 0 ? (
              <div className="no-materials-glass">
                <p>No downloadable materials currently attached to this invitation.</p>
              </div>
            ) : (
              <div className="materials-refined-list">
                {materials.map((m) => {
                  const badge = getFileTypeBadge(m.file_name, m.file_type);
                  return (
                    <div key={m.id} className="refined-material-card">
                      <div className="material-file-info">
                        <span className="file-format-badge">{badge}</span>
                        <div>
                          <strong className="material-title">{m.file_name}</strong>
                          <span className="material-meta-sub">
                            {formatFileSize(m.file_size_kb)} • Official Protocol Document
                          </span>
                        </div>
                      </div>
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="btn-material-download"
                      >
                        Download File ↗
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 8. PROTOCOL & CONTACT ASSISTANCE SECTION */}
      <section className="grand-contact-section" id="contact">
        <div className="section-container center">
          <div className="section-header-center">
            <span className="section-mini-kicker">PROTOCOL DESK</span>
            <h2 className="section-title-serif">Protocol Assistance</h2>
            <p className="contact-lead-sub">
              Should you require special arrangements, executive security clearances, or dietary specifications,
              please reach out to our protocol team.
            </p>
          </div>

          <div className="contact-desk-grid">
            <div className="contact-card">
              <span className="contact-role">UACC Executive Protocol</span>
              <strong className="contact-name">Protocol & Public Relations</strong>
              <a href="tel:+256701050600" className="contact-link">
                +256 701 050 600
              </a>
            </div>

            <div className="contact-card">
              <span className="contact-role">Entebbe International Airport HQ</span>
              <strong className="contact-name">Corporate Communications</strong>
              <a href="mailto:protocol@uacc.go.ug" className="contact-link">
                protocol@uacc.go.ug
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 9. REFINED PROTOCOL FOOTER */}
      <footer className="grand-protocol-footer">
        <div className="footer-national-strip">
          <span className="strip-segment strip-black"></span>
          <span className="strip-segment strip-yellow"></span>
          <span className="strip-segment strip-red"></span>
        </div>
        <div className="footer-content-wrap">
          <p className="footer-brand">UGANDA AIR CARGO CORPORATION</p>
          <p className="footer-copyright">
            © {new Date().getFullYear()} Official Corporate Event Management Portal. All Rights Reserved.
          </p>
          <p className="footer-confidentiality">
            This invitation and token ({token.substring(0, 8).toUpperCase()}) are strictly non-transferable and issued solely for the named recipient.
          </p>
        </div>
      </footer>

      {/* 10. FLOATING WHATSAPP CHAT BUTTON */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-protocol-chat"
        aria-label="Inquire with UACC Protocol via WhatsApp"
        title="Chat with Protocol Desk"
      >
        <svg viewBox="0 0 32 32" width="24" height="24" fill="currentColor">
          <path d="M16 3a13 13 0 0 0-11 19.9L3 29l6.3-1.9A13 13 0 1 0 16 3zm0 2.4a10.6 10.6 0 1 1-5.5 19.6l-.4-.2-3.7 1.1 1.2-3.6-.3-.4A10.6 10.6 0 0 1 16 5.4zm-4 5.3c-.3 0-.7.1-1 .5-.4.4-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.9c.2.2 2.6 4.1 6.4 5.6 3.2 1.2 3.8 1 4.5.9.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8l-.7-.4-2.4-1.2c-.3-.1-.6-.2-.8.2l-1.1 1.4c-.2.2-.4.3-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-2-1.8-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.4-.6.1-.3.1-.5 0-.7l-1.1-2.7c-.3-.6-.5-.6-.8-.6z" />
        </svg>
        <span className="chat-label">Protocol Desk</span>
      </a>
    </div>
  );
}

