import {
  formatCursorLine,
  formatMapZoom,
  type MapCursorPosition,
} from "../../utils/mapInspector";

interface MapCursorHudProps {
  cursor: MapCursorPosition | null;
  zoom: number | null;
}

/** Compact live cursor / zoom readout on the map canvas. */
export default function MapCursorHud({ cursor, zoom }: MapCursorHudProps) {
  const { lat, lon } = formatCursorLine(cursor);

  return (
    <div className="map-cursor-hud" aria-live="polite">
      <span>
        <abbr title="Latitud">Lat</abbr> {lat}
      </span>
      <span>
        <abbr title="Longitud">Lon</abbr> {lon}
      </span>
      <span>Zoom {formatMapZoom(zoom)}</span>
    </div>
  );
}
