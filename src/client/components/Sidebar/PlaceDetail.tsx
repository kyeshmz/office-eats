import { useState } from "react";
import type { SidebarProps } from "../contracts";
import { toReviewAuthor } from "../../../shared/types";
import { googleMapsUrl } from "../../../shared/geo";
import { formatDate, formatDistance, formatRating } from "../../lib/format";
import ReviewForm from "./ReviewForm";

interface PlaceDetailProps {
  selectedPlace: SidebarProps["selectedPlace"];
  selectedPlaceLoading: boolean;
  onSelectPlace: SidebarProps["onSelectPlace"];
  onUpdateReview: SidebarProps["onUpdateReview"];
}

export default function PlaceDetail({ selectedPlace, selectedPlaceLoading, onSelectPlace, onUpdateReview }: PlaceDetailProps) {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  if (selectedPlaceLoading && !selectedPlace) return <p className="empty-state">Loading…</p>;
  if (!selectedPlace) return null;

  return <div className="place-detail">
    <button type="button" className="back-button" onClick={() => { setEditingReviewId(null); onSelectPlace(null); }}>← All places</button>
    <h2>{selectedPlace.name}</h2><span className="category-badge">{selectedPlace.category}</span>
    <p className="muted">{selectedPlace.address}</p><p className="place-summary">{formatDistance(selectedPlace.distanceMeters)} · {formatRating(selectedPlace.avgRating)} ({selectedPlace.reviewCount} reviews)</p>
    <p><a className="maps-link maps-link-detail" href={googleMapsUrl(selectedPlace)} target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a></p>
    {selectedPlace.description && <p>{selectedPlace.description}</p>}

    <section className="reviews">
      <h3>Reviews</h3>
      {selectedPlace.reviews.length === 0 ? <p className="muted">No reviews yet.</p> : selectedPlace.reviews.map((review) => (
        editingReviewId === review.id ? (
          <ReviewForm
            key={review.id}
            heading={`Edit ${review.author}'s review`}
            submitLabel="Save changes"
            initial={{ author: toReviewAuthor(review.author), rating: review.rating, body: review.body }}
            onCancel={() => setEditingReviewId(null)}
            onSubmit={async (input, password) => {
              await onUpdateReview(selectedPlace.id, review.id, input, password);
              setEditingReviewId(null);
            }}
          />
        ) : (
          <article className="review" key={review.id}>
            <div>
              <strong>{review.author}</strong>
              <span className="review-date">{formatDate(review.createdAt)}</span>
            </div>
            <span aria-label={`${review.rating} out of 5`} className="stars">{"★".repeat(review.rating)}</span>
            {/* Appended entries are separated by blank lines, so keep the breaks. */}
            <p className="review-body">{review.body}</p>
            <button
              type="button"
              className="link-button"
              onClick={() => setEditingReviewId(review.id)}
            >
              Edit
            </button>
          </article>
        )
      ))}
    </section>

  </div>;
}
