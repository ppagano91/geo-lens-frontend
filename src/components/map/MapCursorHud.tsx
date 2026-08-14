import { formatMapZoom } from "../../utils/mapInspector";

interface MapCursorHudProps {
  zoom: number | null;
}

/** Compact zoom readout on the map canvas (no lat/lon overlay). */
export default function MapCursorHud({ zoom }: MapCursorHudProps) {
  return (
    <div className="map-cursor-hud" aria-live="polite">
      <span>Zoom {formatMapZoom(zoom)}</span>
    </div>
  );
}
