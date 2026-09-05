import { useEffect, useMemo, useRef, useState } from "react";
import type { LngLat, NewPlaceInput, NewReviewInput, PlaceWithReviews } from "../shared/types";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar/Sidebar";
import { usePlaces } from "./hooks/usePlaces";
import { createPlace, createReview, fetchPlace } from "./lib/api";
import { filterPlaces } from "./lib/search";
import "./App.css";

export default function App() {
  const { places, loading: placesLoading, error: placesError, reload } = usePlaces();
  const [query, setQuery] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithReviews | null>(null);
  const [selectedPlaceLoading, setSelectedPlaceLoading] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<LngLat | null>(null);
  const selectionVersion = useRef(0);
  const mounted = useRef(true);
  const visiblePlaceIds = useMemo(
    () => new Set(filterPlaces(places, query).map((place) => place.id)),
    [places, query],
  );

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
    } finally {
      if (mounted.current && version === selectionVersion.current) setSelectedPlaceLoading(false);
    }
  }

  async function refreshSelectedPlace(placeId: string) {
    const place = await fetchPlace(placeId);
    if (mounted.current && selectedPlaceId === placeId) setSelectedPlace(place);
  }

  async function submitReview(placeId: string, input: NewReviewInput) {
    await createReview(placeId, input);
    await Promise.all([reload(), refreshSelectedPlace(placeId)]);
  }

  async function addPlace(input: NewPlaceInput) {
    const created = await createPlace(input);
    await reload();
    setPickedLocation(null);
    setPickMode(false);
    await selectPlace(created.id);
  }

  return (
    <div className="app-layout">
      <Sidebar
        places={places}
        placesLoading={placesLoading}
        placesError={placesError}
        query={query}
        onQueryChange={setQuery}
        selectedPlace={selectedPlace}
        selectedPlaceLoading={selectedPlaceLoading}
        onSelectPlace={selectPlace}
        onSubmitReview={submitReview}
        onAddPlace={addPlace}
        pickMode={pickMode}
        onPickModeChange={setPickMode}
        pickedLocation={pickedLocation}
      />
      <div className="app-map">
        <MapView
          places={places}
          visiblePlaceIds={visiblePlaceIds}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={selectPlace}
          pickMode={pickMode}
          pickedLocation={pickedLocation}
          onPickLocation={(location) => {
            setPickedLocation(location);
            setPickMode(false);
          }}
        />
      </div>
    </div>
  );
}
