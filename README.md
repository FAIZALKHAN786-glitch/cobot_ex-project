# Emergency Response Platform — Frontend

Production-ready React + TypeScript frontend for the Emergency Response &
Disaster Management Platform. Frontend-only: a clearly isolated mock API layer
simulates the backend so it can be swapped for a real REST/GraphQL API later.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + Vite |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Routing | React Router DOM v6 |
| Forms | React Hook Form + Zod |
| Data Fetching | TanStack Query (React Query) |
| State | Zustand |
| Maps | Leaflet + react-leaflet |
| Icons | Lucide React |
| Animations | Framer Motion |
| Notifications | Sonner |
| Date | date-fns |

## Project Structure

```
emergency-response/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/index.ts           # Incident, User, status/severity/category types + config
    ├── lib/utils.ts             # cn(), date helpers, reference number generator
    ├── services/api.ts          # Mock API service (isolated — swap for real backend)
    │   └── MOCK seed data (16 incidents)
    ├── store/
    │   ├── useAuthStore.ts      # Zustand auth (persisted in localStorage)
    │   └── useIncidentStore.ts  # Incident filters, selection, map bounds
    ├── components/
    │   ├── ui/                  # Button, Input, Label, Select, Textarea, Card, Badge, Dialog, Toaster
    │   ├── incidents/
    │   │   ├── SeverityBadge.tsx
    │   │   ├── StatusBadge.tsx
    │   │   ├── CategoryChip.tsx
    │   │   ├── IncidentCard.tsx
    │   │   ├── IncidentTableRow.tsx
    │   │   ├── EmergencyMap.tsx   # Leaflet map w/ severity-colored markers
    │   │   ├── ReportForm.tsx     # Zod-validated report form
    │   │   └── StatusTimeline.tsx # Reported → Resolved lifecycle timeline
    │   ├── dashboard/
    │   │   ├── StatCard.tsx
    │   │   └── EmergencyAlertBanner.tsx  # Critical/High active incidents banner
    │   ├── auth/
    │   │   ├── ProtectedRoute.tsx
    │   │   └── use-toast.ts
    │   └── layout/
    │       ├── MainLayout.tsx   # Public navbar + mobile drawer
    │       └── AdminLayout.tsx  # Admin sidebar + topbar + alert banner
    └── pages/
        ├── Home.tsx             # Map + incident list + filters
        ├── Report.tsx           # Public incident report form
        ├── ReportSuccess.tsx    # Confirmation with reference ID
        ├── Login.tsx            # Public login (role-based redirect)
        ├── AdminLogin.tsx       # Admin login
        ├── AdminDashboard.tsx   # Stats cards + incident table
        └── AdminIncidentDetail.tsx  # Detail view + status lifecycle edit
```

## Setup

### Prerequisites

Node.js 18+ and npm.

### Install

```bash
cd emergency-response
npm install
```

### Run dev server

```bash
npm run dev
```

App opens at `http://localhost:5173`.

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Mock API & Backend Swap

All API calls go through `src/services/api.ts`. It is fully mocked:

- Simulates 400–800ms network latency
- ~5% random failure rate (to exercise loading/error UI)
- 16 seeded incidents across categories, severities, and statuses
- In-memory store (mutations persist for the session)

To connect a real backend:

1. Set `VITE_API_BASE_URL` in a `.env` file:
   ```
   VITE_API_BASE_URL=http://localhost:4000/api
   ```
2. Replace the function bodies in `src/services/api.ts` with real `fetch` calls.
3. The function signatures (`getIncidents`, `getIncident`, `createIncident`,
   `updateIncident`, `getStats`, `login`) stay stable so components don't change.

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@emergency.gov | admin123 |
| Reporter | reporter@citizen.gov | reporter123 |

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Emergency map + recent incidents |
| `/report` | Public | Submit a new incident report |
| `/report/success` | Public | Confirmation with reference number |
| `/login` | Public | Login (role-based redirect) |
| `/admin/login` | Public | Admin login |
| `/admin` | Admin | Dashboard: stats + incident table |
| `/admin/incidents/:id` | Admin | Incident detail + status lifecycle |

## Acceptance Criteria

- Reporter can submit an incident end-to-end and see a confirmation with a reference number
- Incident map/list displays with severity color-coding and working filters
- Admin can log in, view the dashboard, and update an incident's category/severity/status
- Status updates reflect immediately via refetch/polling
- Fully responsive and keyboard navigable
- TypeScript compiles cleanly (`tsc --noEmit`)
- Build succeeds (`npm run build`)
- Mock API clearly isolated and documented for backend swap
