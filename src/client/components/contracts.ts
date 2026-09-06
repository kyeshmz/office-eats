/**
 * Prop contracts for the two top-level panels. App.tsx owns all state and passes it down;
 * MapView and Sidebar are built against these interfaces independently.
 */
import type { LngLat, NewPlaceInput, NewReviewInput, Place, PlaceCategory, PlaceWithReviews } from "../../shared/types";

export interface MapViewProps {
  /** Every reviewed place, unfiltered. */
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
  /** When true the map cursor is a crosshair and a click reports a location instead of selecting. */
  pickMode: boolean;
  pickedLocation: LngLat | null;
  /** Category of the place being added, so the preview pin matches the form. */
  pickedCategory: PlaceCategory | null;
  onPickLocation: (location: LngLat) => void;
}

export interface SidebarProps {
  /** Every reviewed place, unfiltered, already sorted by distanceMeters ascending. */
  places: Place[];
  placesLoading: boolean;
  placesError: string | null;
  selectedPlace: PlaceWithReviews | null;
  selectedPlaceLoading: boolean;
  onSelectPlace: (placeId: string | null) => void;
  /**
   * Writes a review on an existing place. Resolves once the API accepted it and
   * the parent has refreshed state; rejects with an Error whose message is
   * user-presentable. `password` is the shared posting password the user typed;
   * only the Worker can judge it, so a wrong one surfaces here as a rejection.
   */
  onSubmitReview: (placeId: string, input: NewReviewInput, password: string) => Promise<void>;
  /** Rewrites an existing review. Same semantics as onSubmitReview. */
  onUpdateReview: (placeId: string, reviewId: string, input: NewReviewInput, password: string) => Promise<void>;
  /** Adds a place together with its first review. Same semantics as onUpdateReview. */
  onAddPlace: (input: NewPlaceInput, password: string) => Promise<void>;
  pickMode: boolean;
  onPickModeChange: (on: boolean) => void;
  pickedLocation: LngLat | null;
  /** Reports a location the user chose (map click or picked suggestion); null clears the preview pin. */
  onPickLocation: (location: LngLat | null) => void;
  /** Category of the place being added, so the preview pin matches the form. Null clears it. */
  onPickedCategoryChange: (category: PlaceCategory | null) => void;
}
