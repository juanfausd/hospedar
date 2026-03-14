# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run db:migrate   # Initialize/update database schema
```

There are no test or lint commands configured.

## Environment Setup

Requires Node.js 18+, PostgreSQL 14+, and a `.env.local` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hospedar
ICAL_URL=https://ical.booking.com/v1/export?t=...
```

Run `npm run db:migrate` once to create the `reservations` table before first use.

## Architecture

**Next.js 14 App Router** with a server/client split:

- [app/page.tsx](app/page.tsx) — Server Component: fetches initial reservation data from PostgreSQL and passes it to the client component.
- [app/components/ReservationsClient.tsx](app/components/ReservationsClient.tsx) — Client Component: the entire UI (table, modals, filters, metrics, sync). This is the main file for UI changes.

**API Routes** (all in [app/api/](app/api/)):
- `GET/POST /api/reservations` — list all or create a reservation
- `PUT/DELETE /api/reservations/[id]` — update or delete by ID
- `POST /api/sync-ical` — sync Booking.com reservations via iCal feed (fetches from `ICAL_URL`) or manual `.ics` file upload (via `X-ICS-Content` header)

**Data layer** ([lib/](lib/)):
- [lib/db.ts](lib/db.ts) — PostgreSQL connection pool (`pg` library)
- [lib/types.ts](lib/types.ts) — shared `Reservation` TypeScript interface
- [lib/migrate.js](lib/migrate.js) — creates the `reservations` table if it doesn't exist

## Database Schema

```sql
reservations (
  id SERIAL PRIMARY KEY,
  ical_uid TEXT UNIQUE,      -- Booking.com UID for dedup during sync
  name TEXT NOT NULL,
  phone TEXT,
  checkin DATE NOT NULL,
  checkout DATE NOT NULL,
  guests INTEGER DEFAULT 1,
  cost NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'confirmed',   -- 'confirmed' | 'pending' | 'cancelled'
  source TEXT DEFAULT 'particular',  -- 'booking' | 'airbnb' | 'particular'
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Key Conventions

- **Currency:** Argentine Pesos (ARS). Displayed as `$ X.XXX,XX`.
- **Dates:** Stored as ISO `DATE` in PostgreSQL; displayed as `dd/mm/yyyy` in the UI.
- **iCal sync logic** ([app/api/sync-ical/route.ts](app/api/sync-ical/route.ts)): uses `ical_uid` to match existing records. Manual edits (non-Booking source or added phone/notes) are preserved during sync — only unmodified Booking records get overwritten.
- **Tailwind CSS** scans `app/**/*.{ts,tsx}` and `lib/**/*.{ts,tsx}`.
- Path alias `@/*` maps to the project root.
