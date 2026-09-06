import { useEffect, useState } from "react";
import type { SidebarProps } from "../contracts";
import { IMPULSE_SF } from "../../../shared/config";
import PlaceList from "./PlaceList";
import PlaceDetail from "./PlaceDetail";
import AddPlaceForm from "./AddPlaceForm";
import "./Sidebar.css";

export default function Sidebar(props: SidebarProps) {
  const [mode, setMode] = useState<"list" | "add">("list");
  useEffect(() => {
    if (props.selectedPlace || props.selectedPlaceLoading) {
      setMode("list");
      props.onPickModeChange(false);
    }
  }, [props.selectedPlace, props.selectedPlaceLoading, props.onPickModeChange]);

  function selectPlace(placeId: string | null) {
    if (placeId !== null) {
      setMode("list");
      props.onPickModeChange(false);
    }
    props.onSelectPlace(placeId);
  }

  const showDetail = props.selectedPlaceLoading || props.selectedPlace;
  return <aside className="sidebar">
    <header className="sidebar-header"><h1>Around {IMPULSE_SF.name}</h1><p>{IMPULSE_SF.address}</p></header>
    <div className="sidebar-body">
      {showDetail ? <PlaceDetail selectedPlace={props.selectedPlace} selectedPlaceLoading={props.selectedPlaceLoading} onSelectPlace={selectPlace} onSubmitReview={props.onSubmitReview} onUpdateReview={props.onUpdateReview} /> : mode === "add" ? <AddPlaceForm onSubmit={async (input, password) => { await props.onAddPlace(input, password); setMode("list"); }} onCancel={() => setMode("list")} pickMode={props.pickMode} onPickModeChange={props.onPickModeChange} pickedLocation={props.pickedLocation} onPickLocation={props.onPickLocation} /> : props.placesError ? <p className="form-error" role="alert">{props.placesError}</p> : <><PlaceList places={props.places} placesLoading={props.placesLoading} onSelectPlace={selectPlace} /><button type="button" className="primary-button add-place-button" onClick={() => setMode("add")}>Add a place</button></>}
    </div>
  </aside>;
}
