import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEFAULT_ZOOM, IMPULSE_SF, OPENFREEMAP_ATTRIBUTION, OPENFREEMAP_STYLE_URL } from "../../shared/config";
import type { MapViewProps } from "./contracts";
import "./MapView.css";

export default function MapView({
  places,
  visiblePlaceIds,
  selectedPlaceId,
  onSelectPlace,
  pickMode,
  pickedLocation,
  onPickLocation,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const placeMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const pickMarkerRef = useRef<maplibregl.Marker | null>(null);
  const pickModeRef = useRef(pickMode);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const onPickLocationRef = useRef(onPickLocation);

  pickModeRef.current = pickMode;
  onSelectPlaceRef.current = onSelectPlace;
  onPickLocationRef.current = onPickLocation;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: OPENFREEMAP_STYLE_URL,
      center: [IMPULSE_SF.lng, IMPULSE_SF.lat],
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(
      new maplibregl.AttributionControl({
        compact: false,
        customAttribution: OPENFREEMAP_ATTRIBUTION,
      }),
    );
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const anchorElement = document.createElement("div");
    anchorElement.className = "anchor-marker";
    anchorElement.title = IMPULSE_SF.name;
    new maplibregl.Marker({ element: anchorElement })
      .setLngLat([IMPULSE_SF.lng, IMPULSE_SF.lat])
      .addTo(map);

    map.on("click", (event: maplibregl.MapMouseEvent) => {
      if (pickModeRef.current) {
        onPickLocationRef.current({ lng: event.lngLat.lng, lat: event.lngLat.lat });
      } else {
        onSelectPlaceRef.current(null);
      }
    });

    return () => {
      placeMarkersRef.current.clear();
      pickMarkerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = placeMarkersRef.current;
    const placeIds = new Set(places.map((place) => place.id));

    for (const [id, marker] of markers) {
      if (!placeIds.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }

    for (const place of places) {
      let marker = markers.get(place.id);
      if (!marker) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "place-marker";
        element.dataset.category = place.category;
        element.title = place.name;
        element.setAttribute("aria-label", place.name);
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectPlaceRef.current(place.id);
        });
        marker = new maplibregl.Marker({ element }).setLngLat([place.lng, place.lat]).addTo(map);
        markers.set(place.id, marker);
      } else {
        marker.setLngLat([place.lng, place.lat]);
      }

      const element = marker.getElement();
      element.classList.toggle("is-selected", selectedPlaceId === place.id);
      element.classList.toggle("is-dimmed", !visiblePlaceIds.has(place.id));
    }
  }, [places, selectedPlaceId, visiblePlaceIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPlaceId) return;

    const place = places.find(({ id }) => id === selectedPlaceId);
    if (place) {
      map.flyTo({
        center: [place.lng, place.lat],
        zoom: Math.max(map.getZoom(), 16),
      });
    }
  }, [places, selectedPlaceId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = pickMode ? "crosshair" : "";
  }, [pickMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!pickedLocation) {
      pickMarkerRef.current?.remove();
      pickMarkerRef.current = null;
      return;
    }

    if (!pickMarkerRef.current) {
      const element = document.createElement("div");
      element.className = "pick-marker";
      pickMarkerRef.current = new maplibregl.Marker({ element }).addTo(map);
    }
    pickMarkerRef.current.setLngLat([pickedLocation.lng, pickedLocation.lat]);
  }, [pickedLocation]);

  return <div ref={containerRef} className="map-view" />;
}
