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
2. Run migration files `002_host_rooms_and_modes.sql` through `005_host_password_and_reconnect.sql` in order. Then create a room exclusively from `/host`; the UI produces a shareable code and player QR code. Games start with 4–36 players.
3. In **Database → Replication**, add `rooms`, `players`, and `intents` to the `supabase_realtime` publication. In **Realtime settings**, keep Broadcast and Presence enabled.
4. Copy project URL and anon key into `.env.local`; add the service-role key only to Vercel/server environment variables. Never prefix it with `NEXT_PUBLIC_`.
   Also set a long, unique `OUTBREAK_ADMIN_KEY`. This is the only credential allowed to create, list, and delete rooms; it is different from each room's one-time Host key.
5. `npm install && npm run dev`; open `/host/MED36` on the control device and `/play/MED36` on player phones.

## Vercel deployment

1. Push this directory to GitHub and import it in Vercel (Framework: Next.js).
2. Add all three variables from `.env.example` under **Settings → Environment Variables** (Production and Preview as appropriate).
3. Deploy. Configure the Supabase Auth Site URL only if you later add Supabase Auth; this starter uses per-device admission tokens instead.

## Production operating notes

- Host key is typed on the Host device and sent over HTTPS only to a server route. Use a password manager and rotate it per event.
- Open `/host` to create a ward and `/host/manage` to administer every ward. `OUTBREAK_ADMIN_KEY` must be set locally and in Vercel before either function is available.
- The supplied migration deliberately exposes no direct table reads/writes to `anon`. `public_room_snapshot` omits roles and intents entirely.
- For audit/recovery, add a host-only snapshot RPC and persist resolved night results in a separate `round_events` table before transitioning to `summary`.
