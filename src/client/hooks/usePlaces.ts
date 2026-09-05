import { useEffect, useRef, useState } from "react";
import type { Place } from "../../shared/types";
import { fetchPlaces } from "../lib/api";

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  async function reload() {
    if (!mounted.current) return;
    setLoading(true);
    setError(null);
    try {
      const nextPlaces = await fetchPlaces();
      if (mounted.current) setPlaces(nextPlaces);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : "Network error");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    let active = true;

    fetchPlaces()
      .then((nextPlaces) => {
        if (active) {
          setPlaces(nextPlaces);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Network error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      mounted.current = false;
    };
  }, []);

  return { places, loading, error, reload };
}
