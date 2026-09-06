import { useEffect, useRef, useState } from "react";
import type { LngLat, NewPlaceInput, NewReviewInput, PlaceCategory, PlaceWithReviews } from "../shared/types";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar/Sidebar";
import { usePlaces } from "./hooks/usePlaces";
import { createPlace, createReview, fetchPlace, updateReview } from "./lib/api";
import "./App.css";

export default function App() {
  const { places, loading: placesLoading, error: placesError, reload } = usePlaces();
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithReviews | null>(null);
  const [selectedPlaceLoading, setSelectedPlaceLoading] = useState(false);
  const [selectedPlaceError, setSelectedPlaceError] = useState<string | null>(null);
  const [pickMode, setPickMode] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<LngLat | null>(null);
  const [pickedCategory, setPickedCategory] = useState<PlaceCategory | null>(null);
  const selectionVersion = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      selectionVersion.current += 1;
    };
  }, []);

  async function selectPlace(placeId: string | null) {
    const version = ++selectionVersion.current;
    setSelectedPlaceId(placeId);
    setSelectedPlaceError(null);
    if (placeId === null) {
      setSelectedPlace(null);
      setSelectedPlaceLoading(false);
      return;
    }

    setSelectedPlace(null);
    setSelectedPlaceLoading(true);
    try {
      const place = await fetchPlace(placeId);
      if (mounted.current && version === selectionVersion.current) setSelectedPlace(place);
    } catch (error) {
      if (mounted.current && version === selectionVersion.current) {
        setSelectedPlaceError(error instanceof Error ? error.message : "Network error");
      }
    } finally {
      if (mounted.current && version === selectionVersion.current) setSelectedPlaceLoading(false);
    }
  }

  async function refreshSelectedPlace(placeId: string) {
    const version = selectionVersion.current;
    const place = await fetchPlace(placeId);
    if (mounted.current && version === selectionVersion.current) setSelectedPlace(place);
  }

  async function submitReview(placeId: string, input: NewReviewInput, password: string) {
    await createReview(placeId, input, password);
    await Promise.all([reload(), refreshSelectedPlace(placeId)]);
  }

  async function editReview(placeId: string, reviewId: string, input: NewReviewInput, password: string) {
    await updateReview(placeId, reviewId, input, password);
    await Promise.all([reload(), refreshSelectedPlace(placeId)]);
  }

  async function addPlace(input: NewPlaceInput, password: string) {
    const created = await createPlace(input, password);
    await reload();
    setPickedLocation(null);
    setPickedCategory(null);
    setPickMode(false);
    await selectPlace(created.id);
  }

  function handlePickLocation(location: LngLat | null) {
    setPickedLocation(location);
    if (location) setPickMode(false);
    else setPickedCategory(null);
  }

  return (
    <div className="app-layout">
      <Sidebar
        places={places}
        placesLoading={placesLoading}
        placesError={placesError ?? selectedPlaceError}
        selectedPlace={selectedPlace}
        selectedPlaceLoading={selectedPlaceLoading}
        onSelectPlace={selectPlace}
        onSubmitReview={submitReview}
        onUpdateReview={editReview}
        onAddPlace={addPlace}
        pickMode={pickMode}
        onPickModeChange={setPickMode}
        pickedLocation={pickedLocation}
        onPickLocation={handlePickLocation}
        onPickedCategoryChange={setPickedCategory}
      />
      <div className="app-map">
        <MapView
          places={places}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={selectPlace}
          pickMode={pickMode}
          pickedLocation={pickedLocation}
          pickedCategory={pickedCategory}
          onPickLocation={handlePickLocation}
        />
      </div>
    </div>
  );
}
