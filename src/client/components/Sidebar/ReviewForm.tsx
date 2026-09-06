import { useState, type FormEvent } from "react";
import type { NewReviewInput } from "../../../shared/types";
import ReviewFields from "./ReviewFields";

interface ReviewFormProps {
  heading: string;
  submitLabel: string;
  /** The review being changed. */
  initial: NewReviewInput;
  /** Rejects with an Error whose message is shown above the form. */
  onSubmit: (input: NewReviewInput, password: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * Edits an existing review. New reviews are not written here: a place takes its
 * first review as part of the add-place form.
 */
export default function ReviewForm({ heading, submitLabel, initial, onSubmit, onCancel }: ReviewFormProps) {
  const [review, setReview] = useState<NewReviewInput>(initial);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ ...review, body: review.body.trim() }, password);
    } catch (err) {
      // Drop a password the server refused rather than resending it.
      setPassword("");
      setError(err instanceof Error ? err.message : "Unable to save review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="sidebar-form" onSubmit={handleSubmit}>
      <h3>{heading}</h3>
      {error && <p className="form-error" role="alert">{error}</p>}
      <ReviewFields value={review} onChange={setReview} />
      <label>Password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <div className="form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button className="primary-button" type="submit" disabled={submitting || !review.body.trim() || !password}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
