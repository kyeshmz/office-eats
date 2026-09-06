INSERT OR IGNORE INTO places (id, name, category, address, lng, lat, description, created_at) VALUES
  ('seed-1', 'Thee Parkside', 'bar', '1600 17th St, San Francisco, CA 94107', -122.4011, 37.7650, 'A neighborhood bar with live music.', '2026-01-01T00:00:00.000Z'),
  ('seed-2', 'Farley''s', 'coffee', '1315 18th St, San Francisco, CA 94107', -122.3975, 37.7622, 'Coffee, food, and a welcoming neighborhood room.', '2026-01-01T00:00:00.000Z'),
  ('seed-3', 'Plow', 'food', '1299 18th St, San Francisco, CA 94107', -122.3979, 37.7623, 'Popular spot for brunch.', '2026-01-01T00:00:00.000Z'),
  ('seed-4', 'Jackson Playground', 'park', '17th St & Arkansas St, San Francisco, CA 94107', -122.3990, 37.7648, 'A sunny neighborhood playground and park.', '2026-01-01T00:00:00.000Z'),
  ('seed-5', 'Rainbow Grocery', 'shop', '1745 Folsom St, San Francisco, CA 94103', -122.4155, 37.7690, 'A worker-owned natural foods store.', '2026-01-01T00:00:00.000Z'),
  ('seed-6', 'Southern Pacific Brewing', 'bar', '620 Treat Ave, San Francisco, CA 94110', -122.4130, 37.7601, 'Local beer and a spacious taproom.', '2026-01-01T00:00:00.000Z'),
  ('seed-7', 'Minnesota Street Project', 'art', '1275 Minnesota St, San Francisco, CA 94107', -122.3895, 37.7530, 'Contemporary art galleries and studios.', '2026-01-01T00:00:00.000Z');

DELETE FROM reviews WHERE id LIKE 'seed-r-%';

INSERT OR IGNORE INTO reviews (id, place_id, author, rating, body, created_at) VALUES
  ('seed-r-1', 'seed-1', 'Kye', 4, 'Friendly atmosphere and good music.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-2', 'seed-1', 'Jonny', 5, 'A great local night out.', '2026-01-03T00:00:00.000Z'),
  ('seed-r-3', 'seed-1', 'Allen', 4, 'Good drinks and a relaxed crowd.', '2026-01-04T00:00:00.000Z'),
  ('seed-r-4', 'seed-2', 'Kye', 5, 'Excellent coffee and relaxed seating.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-5', 'seed-2', 'Jonny', 4, 'Solid coffee and a friendly room.', '2026-01-03T00:00:00.000Z'),
  ('seed-r-6', 'seed-2', 'Allen', 5, 'Great spot to settle in for a while.', '2026-01-04T00:00:00.000Z'),
  ('seed-r-7', 'seed-3', 'Kye', 4, 'The brunch was worth the wait.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-8', 'seed-3', 'Jonny', 5, 'Excellent pancakes and a lively room.', '2026-01-03T00:00:00.000Z'),
  ('seed-r-9', 'seed-3', 'Allen', 4, 'Good food and generous portions.', '2026-01-04T00:00:00.000Z'),
  ('seed-r-10', 'seed-4', 'Kye', 4, 'Nice open space for a walk.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-11', 'seed-4', 'Jonny', 5, 'A great place to spend an afternoon.', '2026-01-03T00:00:00.000Z'),
  ('seed-r-12', 'seed-4', 'Allen', 4, 'Plenty of room and a nice neighborhood feel.', '2026-01-04T00:00:00.000Z'),
  ('seed-r-13', 'seed-5', 'Kye', 5, 'Great selection and helpful staff.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-14', 'seed-5', 'Jonny', 4, 'Easy place to find good groceries.', '2026-01-03T00:00:00.000Z'),
  ('seed-r-15', 'seed-5', 'Allen', 5, 'Excellent variety and great values.', '2026-01-04T00:00:00.000Z'),
  ('seed-r-16', 'seed-6', 'Kye', 4, 'Solid beer list and plenty of room.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-17', 'seed-6', 'Jonny', 5, 'Good beer and a comfortable taproom.', '2026-01-03T00:00:00.000Z'),
  ('seed-r-18', 'seed-6', 'Allen', 4, 'A reliable spot for a casual drink.', '2026-01-04T00:00:00.000Z'),
  ('seed-r-19', 'seed-7', 'Kye', 5, 'Interesting galleries in a beautiful space.', '2026-01-02T00:00:00.000Z'),
  ('seed-r-20', 'seed-7', 'Jonny', 4, 'A thoughtful collection in a great setting.', '2026-01-03T00:00:00.000Z'),
  ('seed-r-21', 'seed-7', 'Allen', 5, 'Worth visiting for the rotating exhibitions.', '2026-01-04T00:00:00.000Z');
