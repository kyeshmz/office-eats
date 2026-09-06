-- One review per author per place. Posting again as the same author appends to
-- the existing review rather than creating a second one, and this index makes
-- that a database guarantee instead of a check two concurrent writes could race.
CREATE UNIQUE INDEX reviews_place_author_idx ON reviews(place_id, author);
