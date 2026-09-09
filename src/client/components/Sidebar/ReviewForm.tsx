import { useState, type FormEvent } from "react";
import type { NewReviewInput } from "../../../shared/types";
import { REVIEW_AUTHORS } from "../../../shared/types";
import { clearDeviceToken, hasDeviceToken } from "../../lib/trustedDevice";
import ReviewFields from "./ReviewFields";

interface ReviewFormProps {
  heading: string;
  submitLabel: string;
  /** Pre-filled values when editing an existing review. Absent when writing one. */
  initial?: NewReviewInput;
  /** Authors who already have a review here, so writing again would append to theirs. */
  authorsWithReviews?: ReadonlySet<string>;
  /** Rejects with an Error whose message is shown above the form. */
  onSubmit: (input: NewReviewInput, password: string) => Promise<void>;
  /** Shown as a Cancel button when present. */
  onCancel?: () => void;
  /** Clear the text after a successful submit. Wanted when writing, not when editing. */
  clearOnSuccess?: boolean;
}

/** Writes a new review, or edits an existing one when `initial` is given. */
export default function ReviewForm({
  heading,
  submitLabel,
  initial,
  authorsWithReviews,
  onSubmit,
  onCancel,
  clearOnSuccess = false,
}: ReviewFormProps) {
  const [review, setReview] = useState<NewReviewInput>(
    initial ?? { author: REVIEW_AUTHORS[0], rating: 5, body: "" },
  );
  const [password, setPassword] = useState("");
  // True once this browser has written before, so the server likely already
  // trusts it and the password can be skipped. Falls back to asking again if
  // the server ever rejects the device.
  const [remembered, setRemembered] = useState(() => hasDeviceToken());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Only meaningful when writing: editing already targets one specific review.
  const willAppend = !initial && authorsWithReviews?.has(review.author);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ ...review, body: review.body.trim() }, password);
      // A success means the server trusts this device from now on.
      setRemembered(true);
      if (clearOnSuccess) setReview((current) => ({ ...current, body: "" }));
      // The password is kept so a reviewer can post twice without retyping it,
      // and cleared below whenever the server refused it.
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save review";
      // The device is no longer trusted (or never was): forget it and ask for
      // the password again rather than resending a rejected id.
      if (message === "Incorrect password") {
        clearDeviceToken();
        setRemembered(false);
      }
      setPassword("");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="sidebar-form" onSubmit={handleSubmit}>
      <h3>{heading}</h3>
      {error && <p className="form-error" role="alert">{error}</p>}
      <ReviewFields value={review} onChange={setReview} />
      {willAppend && (
        <p className="field-hint">
          {review.author} already reviewed this place. This text will be added to that review, and the rating replaced.
        </p>
      )}
      {!remembered && (
        <label>Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
      )}
      <div className="form-actions">
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
        <button className="primary-button" type="submit" disabled={submitting || !review.body.trim() || (!remembered && !password)}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
