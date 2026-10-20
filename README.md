# UACC EventHub Frontend

Single-page web application (SPA) for **UACC EventHub** (Uganda Air Cargo Corporation), built with React, Vite, and modern Vanilla CSS according to the system logic and algorithm documentation (v1.0).

---

## 🛠️ Features & Pages

1. **Authentication & Session Protection (`/login`):**
   - Clean corporate sign-in for UACC administrators.
   - Automatically stores token in `localStorage` under `uacc_admin_token`.
   - Route guard (`ProtectedRoute`) redirects unauthorized visitors to login.
2. **Dashboard (`/dashboard`):**
   - High-level event cards with real-time RSVP summary badges (`Accepted`, `Declined`, `Pending`).
   - Quick statistics banner (Total events, total guests invited, total accepted, total declined).
3. **Event Creation & Editing (`/events/new`, `/events/:id/edit`):**
   - Full event configuration (title, venue, event date, event time, dress code, RSVP cutoff deadline).
   - Cover image selector and live preview.
4. **Event Detail & Management (`/events/:id`):**
   - **Guest Management:** Add attendees with name, email, and phone. Instant generation of cryptographically unique invitation tokens with one-click copy to clipboard.
   - **RSVP Tracking:** Live status pills and guest list table with remove option.
   - **Materials Management:** Upload agendas, brochures, and documents (up to 10MB) for confirmed guests.
5. **VIP Guest Invitation & RSVP Portal (`/invite/:token`):**
   - Public, token-authenticated guest experience (no login needed).
   - Real-time countdown timer to RSVP deadline.
   - One-click attendance response (`Accept` with celebratory confetti, or `Decline`).
   - Gated download of official event materials for confirmed attendees.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `VITE_API_URL` points to your backend:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
