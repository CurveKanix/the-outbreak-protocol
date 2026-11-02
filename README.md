# The Outbreak Protocol

Host-driven, mobile-first social-deduction game for exactly 36 players. The browser is treated as untrusted: PostgreSQL RPC functions own admissions, phase checks, role assignment, and the one-intent-per-player lock; Realtime Broadcast is only a low-latency “refresh now” signal.

## Directory map

```text
app/                      App Router pages and server-only API routes
  host/[code]/            game-master dashboard
  play/[code]/            player terminal
  api/{host,player}/      validates input then invokes privileged RPCs
components/PlayerGrid36   fixed 36-bed command-grid
lib/                      Supabase clients, shared room subscription/types
supabase/migrations/      schema, RLS, and authoritative RPCs
```

## Supabase setup

1. Create a Supabase project, then run `supabase/migrations/001_outbreak_protocol.sql` in **SQL Editor**.
2. Run migration files `002_host_rooms_and_modes.sql` and `003_fix_pgcrypto_schema.sql` in order. Then create a room exclusively from `/host`; the UI produces an unguessable code, a one-time Host key, and a player QR code.
3. In **Database → Replication**, add `rooms`, `players`, and `intents` to the `supabase_realtime` publication. In **Realtime settings**, keep Broadcast and Presence enabled.
4. Copy project URL and anon key into `.env.local`; add the service-role key only to Vercel/server environment variables. Never prefix it with `NEXT_PUBLIC_`.
5. `npm install && npm run dev`; open `/host/MED36` on the control device and `/play/MED36` on player phones.

## Vercel deployment

1. Push this directory to GitHub and import it in Vercel (Framework: Next.js).
2. Add all three variables from `.env.example` under **Settings → Environment Variables** (Production and Preview as appropriate).
3. Deploy. Configure the Supabase Auth Site URL only if you later add Supabase Auth; this starter uses per-device admission tokens instead.

## Production operating notes

- Host key is typed on the Host device and sent over HTTPS only to a server route. Use a password manager and rotate it per event.
- The supplied migration deliberately exposes no direct table reads/writes to `anon`. `public_room_snapshot` omits roles and intents entirely.
- For audit/recovery, add a host-only snapshot RPC and persist resolved night results in a separate `round_events` table before transitioning to `summary`.
