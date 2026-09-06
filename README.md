# Impulse Map

A small places-and-reviews map for locations near Impulse SF. The client uses OpenFreeMap tiles and includes the required OpenFreeMap, OpenMapTiles, and OpenStreetMap attribution.

## Local development

```sh
pnpm install
pnpm db:migrate:local
pnpm db:seed:local
pnpm dev
```

The Impulse SF location is defined in `src/shared/config.ts`.

## Adding a place

The Name field on the add-place form searches a geocoder as you type and offers
matching places nearby. Choosing one fills in the address and the location, so
coordinates are never typed by hand. Search is confined to `SEARCH_BBOX`
(`src/shared/config.ts`) and suggestions are ordered nearest-first from Impulse
SF. "Pick on map" remains available for anything the geocoder does not know.

Lookups go through the Worker at `/api/geocode`, which proxies the public
[Photon](https://photon.komoot.io) geocoder. No API key is needed. Responses are
edge-cached for an hour so repeated keystrokes do not hit it again.

## Posting

Adding a place and leaving a review both require a shared password, checked in
the Worker and never sent to the browser. It is a secret, so it appears nowhere
in this repository.

For production, upload it once:

```sh
wrangler secret put POST_PASSWORD
```

For local development, copy `.dev.vars.example` to `.dev.vars` and fill in the
value. That file is gitignored, and `pnpm dev` picks it up automatically:

```sh
cp .dev.vars.example .dev.vars
```

Tests do not use either one. They bind their own password in `vitest.config.ts`
and read it back off `env`, so the suite passes without any local secret.

Reviews may only be attributed to the names in `REVIEW_AUTHORS`
(`src/shared/types.ts`), which the form offers as a dropdown and the API
enforces.

A place is added together with its first review: the add-place form carries the
author, star rating and text, and both rows are written in one batch, so a place
is never stored without the review it was added with. There is no separate
"leave a review" form. Existing reviews are changed with the Edit button on each
one, which needs the same password.

Each author has at most one review per place, guaranteed by a unique index in
migration `0002`. The `POST /api/places/:id/reviews` endpoint remains, and
posting there as an author who already has a review appends to it and updates
the rating rather than adding a second entry.

## Test

```sh
pnpm test
```

## Deploy

Create the D1 database, put its returned id in `wrangler.jsonc` as `database_id`, then migrate and deploy:

```sh
wrangler d1 create impulse-map
pnpm db:migrate:remote
pnpm deploy
```
