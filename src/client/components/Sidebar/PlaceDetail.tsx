import type { SidebarProps } from "../contracts";
import { formatDate, formatDistance, formatRating } from "../../lib/format";
import ReviewForm from "./ReviewForm";

interface PlaceDetailProps {
  selectedPlace: SidebarProps["selectedPlace"];
  selectedPlaceLoading: boolean;
  onSelectPlace: SidebarProps["onSelectPlace"];
  onSubmitReview: SidebarProps["onSubmitReview"];
}

export default function PlaceDetail({ selectedPlace, selectedPlaceLoading, onSelectPlace, onSubmitReview }: PlaceDetailProps) {
  if (selectedPlaceLoading && !selectedPlace) return <p className="empty-state">Loading…</p>;
  if (!selectedPlace) return null;
  return <div className="place-detail">
    <button type="button" className="back-button" onClick={() => onSelectPlace(null)}>← All places</button>
    <h2>{selectedPlace.name}</h2><span className="category-badge">{selectedPlace.category}</span>
    <p className="muted">{selectedPlace.address}</p><p className="place-summary">{formatDistance(selectedPlace.distanceMeters)} · {formatRating(selectedPlace.avgRating)} ({selectedPlace.reviewCount} reviews)</p>
    {selectedPlace.description && <p>{selectedPlace.description}</p>}
    <section className="reviews"><h3>Reviews</h3>{selectedPlace.reviews.length === 0 ? <p className="muted">No reviews yet.</p> : selectedPlace.reviews.map((review) => <article className="review" key={review.id}><div><strong>{review.author}</strong><span className="review-date">{formatDate(review.createdAt)}</span></div><span aria-label={`${review.rating} out of 5`} className="stars">{"★".repeat(review.rating)}</span><p>{review.body}</p></article>)}</section>
    <ReviewForm placeId={selectedPlace.id} onSubmit={onSubmitReview} />
  </div>;
}
