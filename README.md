# AntiCheat Vision System

Real-time cheating detection web application for exam surveillance. Uses computer vision and deep learning to detect suspicious behaviors through classroom cameras.

## Features

- **Multi-Camera Support** — webcam, RTSP, and MJPEG streams
- **Real-Time Detection** — head pose, gaze deviation, talking, proximity, face absence
- **Live Dashboard** — WebSocket-powered camera grid with instant alerts
- **Incident Logging** — auto-captured snapshots with behavior classification and CSV export
- **Configurable Thresholds** — tune sensitivity per detection type via settings page

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, TypeScript |
| Backend | FastAPI, Python |
| ML/CV | YOLOv11, MediaPipe, OpenCV, DeepSort |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── detector.py           # Cheating detection engine
│   ├── camera_manager.py     # Multi-camera stream handler
│   ├── config.py             # All thresholds and settings
│   └── requirements.txt
├── frontend/
│   ├── app/                  # Next.js pages
│   │   ├── page.tsx          # Login
│   │   ├── dashboard/        # Live monitoring
│   │   ├── cameras/          # Camera management
│   │   ├── incidents/        # Incident log
│   │   └── settings/         # Detection settings
│   ├── components/           # Reusable UI components
│   └── lib/                  # API client and types
└── supabase/
    └── schema.sql            # Database schema
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- (Optional) Supabase account for database and auth

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example` and configure your settings.

```bash
# Run from project root
python -m uvicorn backend.main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=          # optional for dev
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # optional for dev
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

```bash
npm run dev
```

Open `http://localhost:3000` → click **"Continue without auth (dev mode)"** → Dashboard.

### Database (Optional)

Run `supabase/schema.sql` in your Supabase SQL Editor to create tables, indexes, and RLS policies.

## Detection Behaviors

| Behavior | Method | Default Threshold |
|----------|--------|-------------------|
| Looking sideways | Head yaw via solvePnP | 15° for 0.5s |
| Gaze deviation | Iris position tracking | 0.3 normalized |
| Talking | Lip distance change | 0.02 for 1.5s |
| Proximity cheating | Centroid distance | 150px for 2s |
| Left seat | Face absence duration | 3s |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cameras` | List all cameras |
| POST | `/api/cameras` | Register a camera |
| POST | `/api/cameras/{id}/start` | Start camera stream |
| POST | `/api/cameras/{id}/stop` | Stop camera stream |
| GET | `/api/incidents` | List incidents |
| GET | `/api/incidents/export/csv` | Export CSV |
| GET/POST | `/api/settings` | Get/update thresholds |
| WS | `/ws/feed/{camera_id}` | Real-time detection feed |
| WS | `/ws/status` | System status updates |

## License

This project is part of a final year academic submission.
