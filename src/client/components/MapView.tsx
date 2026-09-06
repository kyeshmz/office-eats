import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre resolves its worker chunk from `import.meta.url`, which breaks once
// Vite bundles the library (dev pre-bundle and production build alike). Point it
// at a worker Vite builds for us so vector tiles actually load.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { DEFAULT_ZOOM, IMPULSE_SF, OPENFREEMAP_STYLE_URL } from "../../shared/config";
import type { MapViewProps } from "./contracts";
import "./MapView.css";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

export default function MapView({
  places,
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
    // The OpenFreeMap style already declares this attribution on its source, so
    // passing it again as customAttribution printed the whole line twice. On a
    // phone that wrapped to two rows and ate the bottom of the map.
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const anchorElement = document.createElement("div");
    anchorElement.className = "anchor-marker";
    anchorElement.title = IMPULSE_SF.name;
    anchorElement.setAttribute("role", "img");
    anchorElement.setAttribute("aria-label", IMPULSE_SF.name);
    anchorElement.innerHTML = `
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M5 29h22M8 27V10l8-5 8 5v17M12 13h3v4h-3zm5 0h3v4h-3zM12 20h3v4h-3zm5 0h3v4h-3z" />
      </svg>
    `;
    new maplibregl.Marker({ element: anchorElement })
      .setLngLat([IMPULSE_SF.lng, IMPULSE_SF.lat])
      .addTo(map);

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);
    map.once("load", () => {
      map.resize();
      map.setCenter([IMPULSE_SF.lng, IMPULSE_SF.lat]);
    });

    map.on("click", (event: maplibregl.MapMouseEvent) => {
      if (pickModeRef.current) {
        onPickLocationRef.current({ lng: event.lngLat.lng, lat: event.lngLat.lat });
      } else {
        onSelectPlaceRef.current(null);
      }
    });

    return () => {
      resizeObserver.disconnect();
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
        // The pin shape lives on a child element. MapLibre writes its own
        // positioning transform onto `element` every frame, so anything we set
        // there would either be ignored or, if transitioned, make the marker
        // drift behind the map.
        const pin = document.createElement("span");
        pin.className = "place-marker__pin";
        element.append(pin);
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectPlaceRef.current(place.id);
        });
        marker = new maplibregl.Marker({ element, anchor: "bottom" })
          .setLngLat([place.lng, place.lat])
          .addTo(map);
        markers.set(place.id, marker);
      } else {
        marker.setLngLat([place.lng, place.lat]);
      }

      const element = marker.getElement();
      element.classList.toggle("is-selected", selectedPlaceId === place.id);
    }
  }, [places, selectedPlaceId]);

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
      const pin = document.createElement("span");
      pin.className = "pick-marker__pin";
      element.append(pin);
      // Position the marker before adding it: MapLibre reads the coordinate as
      // soon as the marker joins the map, and throws if it has not been set.
      pickMarkerRef.current = new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([pickedLocation.lng, pickedLocation.lat])
        .addTo(map);
    }
    pickMarkerRef.current.setLngLat([pickedLocation.lng, pickedLocation.lat]);
    // A picked suggestion can be across town from the current view, so bring
    // the camera to the pin the user is being asked to verify.
    map.flyTo({
      center: [pickedLocation.lng, pickedLocation.lat],
      zoom: Math.max(map.getZoom(), 15),
    });
  }, [pickedLocation]);

  return <div ref={containerRef} className="map-view" />;
}
