# Coy Discover

A standalone mobile-first swipe discovery demo created for the Coy SDE Intern assignment. React + Vite frontend, Express API and JSON persistence.

## Requirements
- Node.js 18+

## Run locally

### 1. Start backend
```bash
cd backend
npm install
npm run dev
```
API runs on `http://localhost:4000`.

### 2. Start frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

If your API is deployed separately, set `VITE_API_URL` in the frontend environment to its base URL before building.

## Features
- 36 seeded profiles with interests and profile photos
- Left/right swipe gestures on mobile and Pass/Like buttons
- Only mutual likes create matches
- Matches list and match moment modal
- `GET /feed`, `POST /swipe`, `GET /matches`
- JSON-backed swipes/matches persist across server restarts
- Empty state and demo reset action
- Responsive Home / Discover / Matches navigation
- Feed response intentionally omits the seeded incoming-like flag

## API
- `GET /health`
- `GET /feed`
- `POST /swipe` with `{ "profileId": "p01", "action": "like" }` or `pass`
- `GET /matches`
- `POST /demo/reset` (demo convenience endpoint)

The demo assumes one user. The `/demo/reset` endpoint is included for presentation and resets demo data.
