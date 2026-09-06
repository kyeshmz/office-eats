import { useId } from "react";
import type { NewReviewInput } from "../../../shared/types";
import { REVIEW_AUTHORS } from "../../../shared/types";
import StarRating from "./StarRating";

interface ReviewFieldsProps {
  value: NewReviewInput;
  onChange: (value: NewReviewInput) => void;
  /** Label above the free-text box, so each form can name it in its own words. */
  bodyLabel?: string;
}

/**
 * The author, rating and text of a review. Shared by the add-place form, which
 * takes the first review alongside the place, and the edit form.
 */
export default function ReviewFields({ value, onChange, bodyLabel = "Review" }: ReviewFieldsProps) {
  const ratingId = useId();

  return (
    <>
      <label>Author
        <select
          value={value.author}
          onChange={(event) => onChange({ ...value, author: event.target.value as NewReviewInput["author"] })}
        >
          {REVIEW_AUTHORS.map((author) => <option value={author} key={author}>{author}</option>)}
        </select>
      </label>
      <div className="field">
        <label htmlFor={ratingId}>Rating</label>
        <StarRating id={ratingId} value={value.rating} onChange={(rating) => onChange({ ...value, rating })} />
      </div>
      <label>{bodyLabel}
        <textarea
          maxLength={2000}
          value={value.body}
          onChange={(event) => onChange({ ...value, body: event.target.value })}
        />
      </label>
    </>
  );
}
