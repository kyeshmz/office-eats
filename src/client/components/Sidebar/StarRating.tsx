import type { Rating } from "../../../shared/types";

interface StarRatingProps {
  value: Rating;
  onChange: (value: Rating) => void;
  /** Ties the control to its visible label. */
  id: string;
}

const STARS: Rating[] = [1, 2, 3, 4, 5];

/**
 * A star rating that is really a range input drawn as stars.
 *
 * Building it on a native range gives dragging, tapping anywhere along the
 * stars, arrow-key adjustment and screen-reader support for free, none of which
 * a row of custom buttons would have without reimplementing all of it. The
 * input sits transparent on top of the stars, so what the pointer touches and
 * what the eye sees are the same strip.
 */
export default function StarRating({ value, onChange, id }: StarRatingProps) {
  return (
    <span className="star-rating">
      <span className="star-rating-stars" aria-hidden="true">
        {STARS.map((star) => (
          <span key={star} className={star <= value ? "star is-on" : "star"}>★</span>
        ))}
      </span>
      <input
        id={id}
        className="star-rating-input"
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        aria-valuetext={`${value} out of 5 stars`}
        onChange={(event) => onChange(Number(event.target.value) as Rating)}
      />
    </span>
  );
}
