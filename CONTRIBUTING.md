# Contributing

A React client and a Hono Worker in one Vite project, backed by Cloudflare D1.
The client lives in `src/client`, the Worker in `src/worker`, and the contracts
they share in `src/shared`.

## Setup

```sh
pnpm install
pnpm db:migrate:local
pnpm db:seed:local
pnpm dev
```

Writes need the shared posting password. Copy the example file and fill in the
value; `.dev.vars` is gitignored and `pnpm dev` picks it up automatically.

```sh
cp .dev.vars.example .dev.vars
```

## Tests

```sh
pnpm test
```

The suite runs against a real Worker and an isolated D1 through
`@cloudflare/vitest-pool-workers`, applying the migrations in `migrations/`
before each file.

Tests do not read `.dev.vars`. They bind their own password in
`vitest.config.ts` and read it back off `env`, so the suite passes on a checkout
with no local secret.

## Type checking

```sh
pnpm typecheck    # client and Worker
pnpm cf-typegen   # regenerate Env after changing wrangler.jsonc or .dev.vars
```

## Database

Migrations are plain SQL in `migrations/`, applied in filename order.

```sh
pnpm db:migrate:local
pnpm db:migrate:remote
```

`seed.sql` uses `INSERT OR IGNORE`, so re-running it restores anything missing
without duplicating what is already there.

A unique index on `(place_id, author)` enforces one review per author per place.
Adding a migration that touches `reviews` needs to keep that true.

## Geocoding

Place search proxies the public [Photon](https://photon.komoot.io) geocoder
through the Worker at `/api/geocode`. No API key is needed. Going through the
Worker is what lets the query be capped, the region be pinned, and repeats be
edge-cached for an hour instead of hitting a free service on every keystroke.

## Map tiles

MapLibre loads its tile-parsing worker as a separate chunk, resolved from
`import.meta.url`. Once Vite bundles the library that path no longer points at a
real file, the worker 404s, and the basemap silently renders blank while markers
still appear. `MapView.tsx` therefore hands MapLibre an explicit worker URL that
Vite builds, and `vite.config.ts` sets `worker.format` to `es` so the worker's
own imports survive. Do not remove either without checking that tiles still draw
in a production build, not just in dev.

MapLibre also owns the `transform` of every marker element, rewriting it each
frame. Never put a `transform` or a transform transition on a marker wrapper:
the first is silently overridden, and the second makes markers slide along
behind the map. Shape pins on an inner element instead.

## Deploy

The Worker and the D1 database are both named `impulse-map`, which is what
`wrangler.jsonc` and the `db:*` scripts refer to. The repository name differs;
renaming the Worker would orphan the existing deployment and its data.

```sh
wrangler d1 create impulse-map   # first time only, then put the id in wrangler.jsonc
wrangler secret put POST_PASSWORD
pnpm db:migrate:remote
pnpm deploy
```

Secrets take precedence over vars, and the password must never be committed to
`wrangler.jsonc`.
