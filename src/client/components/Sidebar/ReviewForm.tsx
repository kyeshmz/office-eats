import { useState, type FormEvent } from "react";
import type { NewReviewInput } from "../../../shared/types";
import type { SidebarProps } from "../contracts";

interface ReviewFormProps {
  placeId: string;
  onSubmit: SidebarProps["onSubmitReview"];
}

export default function ReviewForm({ placeId, onSubmit }: ReviewFormProps) {
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState<NewReviewInput["rating"]>(5);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(placeId, { author: author.trim(), rating, body: body.trim() });
      setAuthor("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="sidebar-form" onSubmit={handleSubmit}>
      <h3>Leave a review</h3>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label>Author<input maxLength={60} value={author} onChange={(event) => setAuthor(event.target.value)} /></label>
      <label>Rating<select value={rating} onChange={(event) => setRating(Number(event.target.value) as NewReviewInput["rating"])}>{[5, 4, 3, 2, 1].map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <label>Review<textarea maxLength={2000} value={body} onChange={(event) => setBody(event.target.value)} /></label>
      <button className="primary-button" type="submit" disabled={submitting || !author.trim() || !body.trim()}>Submit review</button>
    </form>
  );
}
