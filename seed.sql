INSERT OR IGNORE INTO places (id, name, category, address, lng, lat, description, created_at) VALUES
  ('seed-1', 'Thee Parkside', 'bar', '1600 17th St, San Francisco, CA 94107', -122.4011, 37.7650, 'A neighborhood bar with live music.', '2026-01-01T00:00:00.000Z'),
  ('seed-2', 'Farley''s', 'coffee', '1315 18th St, San Francisco, CA 94107', -122.3975, 37.7622, 'Coffee, food, and a welcoming neighborhood room.', '2026-01-01T00:00:00.000Z'),
  ('seed-3', 'Plow', 'food', '1299 18th St, San Francisco, CA 94107', -122.3979, 37.7623, 'Popular spot for brunch.', '2026-01-01T00:00:00.000Z'),
  ('seed-4', 'Jackson Playground', 'park', '17th St & Arkansas St, San Francisco, CA 94107', -122.3990, 37.7648, 'A sunny neighborhood playground and park.', '2026-01-01T00:00:00.000Z'),
  ('seed-5', 'Rainbow Grocery', 'shop', '1745 Folsom St, San Francisco, CA 94103', -122.4155, 37.7690, 'A worker-owned natural foods store.', '2026-01-01T00:00:00.000Z'),
  ('seed-6', 'Southern Pacific Brewing', 'bar', '620 Treat Ave, San Francisco, CA 94110', -122.4130, 37.7601, 'Local beer and a spacious taproom.', '2026-01-01T00:00:00.000Z'),
  ('seed-7', 'Minnesota Street Project', 'art', '1275 Minnesota St, San Francisco, CA 94107', -122.3895, 37.7530, 'Contemporary art galleries and studios.', '2026-01-01T00:00:00.000Z');

INSERT OR IGNORE INTO reviews (id, place_id, author, rating, body, created_at) VALUES
  ('seed-r-1', 'seed-1', 'Sam', 4, 'Friendly atmosphere and good music.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-2', 'seed-1', 'Riley', 5, 'A great local night out.', '2026-01-03T00:00:00.000Z'),
  ('seed-r-3', 'seed-2', 'Jordan', 5, 'Excellent coffee and relaxed seating.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-4', 'seed-3', 'Casey', 4, 'The brunch was worth the wait.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-5', 'seed-4', 'Taylor', 4, 'Nice open space for a walk.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-6', 'seed-5', 'Morgan', 5, 'Great selection and helpful staff.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-7', 'seed-6', 'Alex', 4, 'Solid beer list and plenty of room.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-8', 'seed-7', 'Drew', 5, 'Interesting galleries in a beautiful space.', '2026-01-02T00:00:00.000Z');
