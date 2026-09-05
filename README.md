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
