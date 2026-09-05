import type { Place } from "../../../shared/types";
import { filterPlaces } from "../../lib/search";
import { formatDistance, formatRating } from "../../lib/format";

interface PlaceListProps {
  places: Place[];
  placesLoading: boolean;
  query: string;
  onSelectPlace: (placeId: string) => void;
}

export default function PlaceList({ places, placesLoading, query, onSelectPlace }: PlaceListProps) {
  if (placesLoading && places.length === 0) return <p className="empty-state">Loading places…</p>;
  if (!placesLoading && places.length === 0) return <p className="empty-state">No places yet. Add the first one.</p>;

  const filtered = filterPlaces(places, query);
  if (filtered.length === 0) return <p className="empty-state">No places match “{query}”.</p>;

  return (
    <div className="place-list">
      <p className="place-count">
        {filtered.length === places.length ? `${places.length} places` : `${filtered.length} of ${places.length} places`}
      </p>
      {filtered.map((place) => (
        <button type="button" className="place-item" data-place-id={place.id} key={place.id} onClick={() => onSelectPlace(place.id)}>
          <span className="place-item-main">
            <strong>{place.name}</strong>
            <span className="category-badge">{place.category}</span>
          </span>
          <span className="place-item-meta">{formatDistance(place.distanceMeters)} · {formatRating(place.avgRating)} ({place.reviewCount} {place.reviewCount === 1 ? "review" : "reviews"})</span>
        </button>
      ))}
    </div>
  );
}
