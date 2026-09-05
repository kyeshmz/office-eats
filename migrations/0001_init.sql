CREATE TABLE places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'coffee', 'bar', 'shop', 'park', 'art', 'other')),
  address TEXT NOT NULL,
  lng REAL NOT NULL,
  lat REAL NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX reviews_place_id_idx ON reviews(place_id, created_at DESC);
