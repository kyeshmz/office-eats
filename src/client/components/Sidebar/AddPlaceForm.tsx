import { useEffect, useState, type FormEvent } from "react";
import type { LngLat, PlaceCategory } from "../../../shared/types";
import { PLACE_CATEGORIES } from "../../../shared/types";
import type { SidebarProps } from "../contracts";

interface AddPlaceFormProps {
  onSubmit: SidebarProps["onAddPlace"];
  onCancel: () => void;
  pickMode: boolean;
  onPickModeChange: SidebarProps["onPickModeChange"];
  pickedLocation: LngLat | null;
}

export default function AddPlaceForm({ onSubmit, onCancel, pickMode, onPickModeChange, pickedLocation }: AddPlaceFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("food");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (pickedLocation) {
      setLng(String(pickedLocation.lng));
      setLat(String(pickedLocation.lat));
    }
  }, [pickedLocation]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), category, address: address.trim(), lng: Number(lng), lat: Number(lat), description: description.trim() || undefined });
      onPickModeChange(false);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add place");
    } finally {
      setSubmitting(false);
    }
  }

  const validLocation = Number.isFinite(Number(lng)) && Number.isFinite(Number(lat)) && lng !== "" && lat !== "";
  return (
    <form className="sidebar-form" onSubmit={handleSubmit}>
      <h2>Add a place</h2>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label>Name<input maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Category<select value={category} onChange={(event) => setCategory(event.target.value as PlaceCategory)}>{PLACE_CATEGORIES.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <label>Address<input maxLength={200} value={address} onChange={(event) => setAddress(event.target.value)} /></label>
      <label>Description<textarea maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <div className="location-block"><button type="button" onClick={() => onPickModeChange(!pickMode)}>{pickMode ? "Picking… click the map" : "Pick on map"}</button><label>Longitude<input type="number" step="any" value={lng} onChange={(event) => setLng(event.target.value)} /></label><label>Latitude<input type="number" step="any" value={lat} onChange={(event) => setLat(event.target.value)} /></label></div>
      <div className="form-actions"><button type="button" onClick={() => { onPickModeChange(false); onCancel(); }}>Cancel</button><button className="primary-button" type="submit" disabled={submitting || !name.trim() || !address.trim() || !validLocation}>Add place</button></div>
    </form>
  );
}
