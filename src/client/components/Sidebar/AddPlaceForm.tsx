import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from "react";
import type { GeocodeResult, LngLat, NewReviewInput, PlaceCategory } from "../../../shared/types";
import { PLACE_CATEGORIES, REVIEW_AUTHORS } from "../../../shared/types";
import ReviewFields from "./ReviewFields";
import { geocode } from "../../lib/api";
import { formatDistance } from "../../lib/format";
import type { SidebarProps } from "../contracts";

interface AddPlaceFormProps {
  onSubmit: SidebarProps["onAddPlace"];
  onCancel: () => void;
  pickMode: boolean;
  onPickModeChange: SidebarProps["onPickModeChange"];
  pickedLocation: LngLat | null;
  onPickLocation: SidebarProps["onPickLocation"];
  onPickedCategoryChange: SidebarProps["onPickedCategoryChange"];
}

/** How long typing must pause before the geocoder is asked. */
const SEARCH_DEBOUNCE_MS = 250;

export default function AddPlaceForm({ onSubmit, onCancel, pickMode, onPickModeChange, pickedLocation, onPickLocation, onPickedCategoryChange }: AddPlaceFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("food");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<LngLat | null>(null);
  const [review, setReview] = useState<NewReviewInput>({ author: REVIEW_AUTHORS[0], rating: 5, body: "" });
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // The name as last taken from a suggestion. Held in state, not a ref, because
  // the hint below the field reads it: it stops the just-chosen name from
  // immediately re-querying, and tells the two "no suggestions" cases apart.
  const [chosenName, setChosenName] = useState<string | null>(null);
  // Whether that same suggestion also set the category, so the hint can say so.
  const [chosenCategory, setChosenCategory] = useState<PlaceCategory | null>(null);
  const listboxId = useId();

  useEffect(() => {
    if (pickedLocation) setLocation(pickedLocation);
  }, [pickedLocation]);

  useEffect(() => {
    const query = name.trim();
    // Search from the very first character, so suggestions are already coming
    // back while the name is still being typed.
    if (query.length === 0 || query === chosenName) {
      setSuggestions([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await geocode(query, controller.signal);
        setSuggestions(results);
        setHighlighted(-1);
        setSuggestionsOpen(true);
        setSearchError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setSearchError(err instanceof Error ? err.message : "Place search failed");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [name, chosenName]);

  function chooseSuggestion(suggestion: GeocodeResult) {
    setChosenName(suggestion.name);
    setName(suggestion.name);
    if (suggestion.address) setAddress(suggestion.address);
    // The geocoder's tags say what kind of place this is (food, bar, park…),
    // so take its word for the category instead of leaving the default.
    const suggestionCategory = suggestion.category ?? category;
    setCategory(suggestionCategory);
    setChosenCategory(suggestion.category ?? null);
    const suggestionLocation = { lng: suggestion.lng, lat: suggestion.lat };
    setLocation(suggestionLocation);
    // Show the suggestion's pin on the map so the user can verify it is the
    // right place before submitting.
    onPickLocation(suggestionLocation);
    onPickedCategoryChange(suggestionCategory);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setHighlighted(-1);
    onPickModeChange(false);
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!suggestionsOpen || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && highlighted >= 0) {
      // Only swallow Enter when a suggestion is actually highlighted, so the
      // key still submits the form the rest of the time.
      event.preventDefault();
      chooseSuggestion(suggestions[highlighted]);
    } else if (event.key === "Escape") {
      setSuggestionsOpen(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!location) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), category, address: address.trim(), lng: location.lng, lat: location.lat, review: { ...review, body: review.body.trim() } }, password);
      onPickModeChange(false);
      onCancel();
    } catch (err) {
      // Drop a password the server refused rather than resending it.
      setPassword("");
      setError(err instanceof Error ? err.message : "Unable to add place");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="sidebar-form" onSubmit={handleSubmit}>
      <h2>Add a place</h2>
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="combobox">
        <label htmlFor={`${listboxId}-input`}>Name</label>
        <input
          id={`${listboxId}-input`}
          role="combobox"
          aria-expanded={suggestionsOpen && suggestions.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={highlighted >= 0 ? `${listboxId}-option-${highlighted}` : undefined}
          autoComplete="off"
          maxLength={120}
          placeholder="Start typing a place name"
          value={name}
          onChange={(event) => { setName(event.target.value); setChosenName(null); setChosenCategory(null); }}
          onKeyDown={handleNameKeyDown}
          onFocus={() => { if (suggestions.length > 0) setSuggestionsOpen(true); }}
        />
        {suggestionsOpen && suggestions.length > 0 && (
          <ul className="combobox-list" id={listboxId} role="listbox" aria-label="Place suggestions">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === highlighted}
                className={index === highlighted ? "is-highlighted" : undefined}
                // Mouse down fires before the input's blur, so the click is not
                // lost to the field losing focus.
                onMouseDown={(event) => { event.preventDefault(); chooseSuggestion(suggestion); }}
                onMouseEnter={() => setHighlighted(index)}
              >
                <strong>{suggestion.name}</strong>
                <span className="combobox-meta">
                  {suggestion.address || "No address"} · {formatDistance(suggestion.distanceMeters)} away
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="field-hint">
          {searchError ? <span className="form-error-inline">{searchError}</span>
            : searching ? "Searching…"
            : chosenName === name.trim() ? (chosenCategory ? "Name, address, category and location taken from this place." : "Name, address and location taken from this place.")
            : name.trim().length > 0 && suggestions.length === 0 ? "No matches. You can still fill in the details yourself."
            : "Start typing a place name. Picking a suggestion fills in the rest."}
        </p>
      </div>

      <label>Category<select value={category} onChange={(event) => {
        const next = event.target.value as PlaceCategory;
        setCategory(next);
        // Keep the map preview pin in step with the dropdown.
        if (location) onPickedCategoryChange(next);
      }}>{PLACE_CATEGORIES.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <label>Address<input maxLength={200} value={address} onChange={(event) => setAddress(event.target.value)} /></label>

      <div className="location-block">
        <span className="location-status">
          {location ? "Location set" : "No location yet"}
        </span>
        <button type="button" onClick={() => onPickModeChange(!pickMode)}>
          {pickMode ? "Picking… click the map" : location ? "Adjust on map" : "Pick on map"}
        </button>
      </div>

      <fieldset className="review-fieldset">
        <legend>Your review</legend>
        <p className="field-hint">A place is added with its first review, so both are saved together.</p>
        <ReviewFields value={review} onChange={setReview} />
      </fieldset>

      <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <div className="form-actions">
        <button type="button" onClick={() => { onPickModeChange(false); onPickLocation(null); onPickedCategoryChange(null); onCancel(); }}>Cancel</button>
        <button className="primary-button" type="submit" disabled={submitting || !name.trim() || !address.trim() || !location || !review.body.trim() || !password}>Add place</button>
      </div>
    </form>
  );
}
