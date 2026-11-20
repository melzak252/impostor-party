# Impostor Party

A real-time party game for 3–6 players. Everyone answers a private prompt; one player receives a different prompt. Compare answers, discuss, vote, and reveal the results. There is no scoring or elimination.

The bright card-table interface keeps player identities and answers front and center, with sequential answer reveals. It adapts to mobile and respects reduced-motion preferences.

## Run locally

Requires Bun 1.3 or newer.

```sh
bun install
bun run dev
```

Open `http://localhost:3000`. The default database is `data/impostor.sqlite`.

## Build and run

```sh
bun run build
APP_ORIGIN=https://party.example.com \
HOST=0.0.0.0 \
PORT=3000 \
DATABASE_PATH=/var/lib/impostor-party/party.sqlite \
bun run start
```

`APP_ORIGIN` is required in production and must be the exact public HTTP(S) origin, without a path. Put the SQLite database on persistent storage. Run one long-lived Bun process; the deployment must support WebSocket upgrades. When using a reverse proxy, configure it to forward upgrades and set equivalent edge rate limits. The app does not provision a domain, proxy, or hosting account.

Guest identity is held in an HTTP-only cookie scoped to a browser profile. Clearing that profile's cookies loses its guest session. Private rooms require an invitation; public rooms appear in discovery only while the host is connected and the room is open.

## Checks

```sh
bun run typecheck
bun test ./tests
```
