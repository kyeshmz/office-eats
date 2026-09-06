import type { Place } from "../../../shared/types";
import { googleMapsUrl } from "../../../shared/geo";
import { formatDistance, formatRating } from "../../lib/format";

interface PlaceListProps {
  places: Place[];
  placesLoading: boolean;
  onSelectPlace: (placeId: string) => void;
}

export default function PlaceList({ places, placesLoading, onSelectPlace }: PlaceListProps) {
  if (placesLoading && places.length === 0) return <p className="empty-state">Loading places…</p>;
  if (places.length === 0) return <p className="empty-state">No places yet. Add the first one.</p>;

  return (
    <div className="place-list">
      <p className="place-count">
        {places.length} places
      </p>
      {places.map((place) => (
        // The Google Maps link is a sibling of the button, never nested inside
        // it: an anchor within a button is invalid and swallows the click.
        <div className="place-item-row" key={place.id}>
          <button type="button" className="place-item" data-place-id={place.id} onClick={() => onSelectPlace(place.id)}>
            <span className="place-item-main">
              <strong>{place.name}</strong>
              <span className="category-badge">{place.category}</span>
            </span>
            <span className="place-item-meta">{formatDistance(place.distanceMeters)} · {formatRating(place.avgRating)} ({place.reviewCount} {place.reviewCount === 1 ? "review" : "reviews"})</span>
          </button>
          <a
            className="maps-link"
            href={googleMapsUrl(place)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${place.name} in Google Maps`}
          >
            Maps ↗
          </a>
        </div>
      ))}
    </div>
  );
}
