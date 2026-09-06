# Office Eats

A small map of the places worth walking to from the office, with reviews.

Everything is measured from one anchor point, defined in `src/shared/config.ts`.
Places are listed nearest-first, and each one links out to Google Maps for hours
and directions. The map draws OpenFreeMap tiles and carries the required
OpenFreeMap, OpenMapTiles and OpenStreetMap attribution.

It runs as a Cloudflare Worker named `impulse-map`, backed by a D1 database of
the same name. That name predates the repository and is what `wrangler.jsonc`
and the database scripts refer to.

## Adding a place

Type a name into the Name field and the form searches a geocoder as you go,
offering matching places nearby. Choosing one fills in the name, the address and
the location, so coordinates are never typed by hand. Suggestions are ordered
nearest-first and confined to a bounding box around the city; without it the
geocoder happily returns same-named streets on other continents. "Pick on map"
is there for anything the geocoder does not know.

A place is added together with its first review. The form carries the author,
the star rating and the text, and both rows are written in one batch, so a place
is never stored without the review it was added with.

## Reviewing

Anyone can review any place from its detail panel. Reviews may only be
attributed to the names in `REVIEW_AUTHORS` (`src/shared/types.ts`), which the
form offers as a dropdown and the API enforces.

Each author has at most one review per place. Reviewing a place you have already
reviewed adds your new text to your existing review and replaces the rating,
rather than leaving two entries under one name. The form tells you before you
submit. Any review can also be rewritten outright with its Edit button.

## Passwords

Adding a place, reviewing one and editing a review all require a shared
password. It is checked in the Worker and never sent to the browser, so the page
cannot decide for itself whether a password is right. It is stored as a secret
and appears nowhere in this repository.

## Contributing

Setup, tests and deployment are in [CONTRIBUTING.md](CONTRIBUTING.md).
