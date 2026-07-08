import { BASEMAPS } from "../../config/basemaps";

interface BasemapSelectorProps {
  value: string;
  onChange: (basemapId: string) => void;
}

export default function BasemapSelector({ value, onChange }: BasemapSelectorProps) {
  return (
    <div className="basemap-selector">
      <label className="basemap-selector-label" htmlFor="basemap-select">
        Mapa base
      </label>
      <select
        id="basemap-select"
        className="basemap-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {BASEMAPS.map((basemap) => (
          <option key={basemap.id} value={basemap.id}>
            {basemap.label}
          </option>
        ))}
      </select>
    </div>
  );
}
