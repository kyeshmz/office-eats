/**
 * Prop contracts for the two top-level panels. App.tsx owns all state and passes it down;
 * MapView and Sidebar are built against these interfaces independently.
 */
import type { LngLat, NewPlaceInput, NewReviewInput, Place, PlaceWithReviews } from "../../shared/types";

export interface MapViewProps {
  /** Every reviewed place, unfiltered. */
  places: Place[];
  /** Places currently matching the sidebar search; markers for these are emphasized, others dimmed. */
  visiblePlaceIds: ReadonlySet<string>;
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
  /** When true the map cursor is a crosshair and a click reports a location instead of selecting. */
  pickMode: boolean;
  pickedLocation: LngLat | null;
  onPickLocation: (location: LngLat) => void;
}

export interface SidebarProps {
  /** Every reviewed place, unfiltered, already sorted by distanceMeters ascending. */
  places: Place[];
  placesLoading: boolean;
  placesError: string | null;
  query: string;
  onQueryChange: (query: string) => void;
  selectedPlace: PlaceWithReviews | null;
  selectedPlaceLoading: boolean;
  onSelectPlace: (placeId: string | null) => void;
  /**
   * Rewrites an existing review. Resolves once the API accepted it and the
   * parent has refreshed state; rejects with an Error whose message is
   * user-presentable. `password` is the shared posting password the user typed;
   * only the Worker can judge it, so a wrong one surfaces here as a rejection.
   */
  onUpdateReview: (placeId: string, reviewId: string, input: NewReviewInput, password: string) => Promise<void>;
  /** Adds a place together with its first review. Same semantics as onUpdateReview. */
  onAddPlace: (input: NewPlaceInput, password: string) => Promise<void>;
  pickMode: boolean;
  onPickModeChange: (on: boolean) => void;
  pickedLocation: LngLat | null;
}
