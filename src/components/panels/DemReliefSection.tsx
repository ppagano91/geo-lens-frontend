import { useRef, useState } from "react";
import { Crosshair, X } from "lucide-react";
import type { ActiveDemOverlay } from "../../hooks/useDemOverlay";
import {
  demHasHillshade,
  demNodataLabel,
  type DemAssetRead,
} from "../../types/dem";
import IconButton from "../ui/IconButton";

function formatElevation(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return `${value.toFixed(1)} m`;
}

function formatBounds(dem: DemAssetRead): string {
  const { left, bottom, right, top } = dem.bounds;
  return `${left.toFixed(4)}, ${bottom.toFixed(4)} → ${right.toFixed(4)}, ${top.toFixed(4)}`;
}

function DetailRow({
  label,
  value,
  wrap = false,
}: {
  label: string;
  value: string;
  wrap?: boolean;
}) {
  return (
    <div className={`scene-detail-row${wrap ? " scene-detail-row--wrap" : ""}`}>
      <dt>{label}</dt>
      <dd title={value}>{value}</dd>
    </div>
  );
}

export interface DemReliefSectionProps {
  dems: DemAssetRead[];
  selectedDem: DemAssetRead | null;
  overlay: ActiveDemOverlay | null;
  listLoading: boolean;
  uploading: boolean;
  generating: boolean;
  addingToMap: boolean;
  error: string | null;
  successMessage: string | null;
  onSelectDem: (demId: string) => void;
  onUpload: (file: File, name?: string) => Promise<unknown>;
  onGenerateHillshade: (demId: string) => Promise<unknown>;
  onAddToMap: (demId: string) => Promise<unknown>;
  onRemoveFromMap: () => void;
  onOpacityChange: (opacity: number) => void;
  onFitOverlay: () => void;
}

export default function DemReliefSection({
  dems,
  selectedDem,
  overlay,
  listLoading,
  uploading,
  generating,
  addingToMap,
  error,
  successMessage,
  onSelectDem,
  onUpload,
  onGenerateHillshade,
  onAddToMap,
  onRemoveFromMap,
  onOpacityChange,
  onFitOverlay,
}: DemReliefSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const overlayOnMap = overlay != null && overlay.demId === selectedDem?.id;
  const opacityPct = overlay ? Math.round(overlay.opacity * 100) : 45;
  const busy = uploading || generating || addingToMap;

  const handleUpload = async () => {
    if (!file) {
      return;
    }
    const created = await onUpload(file, name);
    if (created) {
      setName("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="map-dem-subsection">
        <h4 className="map-dem-subsection-title">DEM propio</h4>
      {error ? (
        <p className="aoi-error" role="alert">
          {error}
        </p>
      ) : null}
      {successMessage ? (
        <p className="compatibility-status compatibility-status--ok" role="status">
          {successMessage}
        </p>
      ) : null}

      <div className="aoi-field">
        <label className="aoi-field-label" htmlFor="map-dem-file">
          GeoTIFF DEM
        </label>
        <input
          ref={fileInputRef}
          id="map-dem-file"
          className="aoi-input ingest-file-input"
          type="file"
          accept=".tif,.tiff,.TIF,.TIFF"
          disabled={busy}
          onChange={(event) => {
            const next = event.target.files?.[0] ?? null;
            setFile(next);
          }}
        />
        <label className="aoi-field-label" htmlFor="map-dem-name">
          Nombre (opcional)
        </label>
        <input
          id="map-dem-name"
          className="aoi-input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Relieve experimental"
          disabled={busy}
          autoComplete="off"
        />
        <button
          type="button"
          className="aoi-button"
          disabled={!file || busy}
          onClick={() => void handleUpload()}
        >
          {uploading ? "Subiendo…" : "Subir DEM"}
        </button>
      </div>

      {listLoading && dems.length === 0 ? (
        <p className="aoi-hint" role="status">
          Cargando DEMs…
        </p>
      ) : null}

      {dems.length === 0 && !listLoading ? (
        <div className="map-inspector-empty" role="status">
          <p className="map-inspector-empty-title">No hay DEM cargado</p>
          <p className="aoi-hint">
            Subí un GeoTIFF de una sola banda para generar un hillshade
            experimental y agregarlo al mapa.
          </p>
        </div>
      ) : null}

      {dems.length > 0 ? (
        <>
          <label className="aoi-field-label" htmlFor="map-dem-select">
            DEMs disponibles
          </label>
          <select
            id="map-dem-select"
            className="aoi-input"
            value={selectedDem?.id ?? ""}
            onChange={(event) => onSelectDem(event.target.value)}
            disabled={busy}
          >
            {dems.map((dem) => (
              <option key={dem.id} value={dem.id}>
                {dem.name}
                {demHasHillshade(dem) ? " · hillshade" : ""}
              </option>
            ))}
          </select>
        </>
      ) : null}

      {selectedDem ? (
        <>
          <dl className="scene-detail-fields map-dem-meta">
            <DetailRow label="CRS" value={selectedDem.crs} wrap />
            <DetailRow
              label="Tamaño"
              value={`${selectedDem.width} × ${selectedDem.height}`}
            />
            <DetailRow
              label="Elev. min"
              value={formatElevation(selectedDem.min_elevation)}
            />
            <DetailRow
              label="Elev. max"
              value={formatElevation(selectedDem.max_elevation)}
            />
            <DetailRow label="Nodata" value={demNodataLabel(selectedDem)} />
            <DetailRow label="Bounds" value={formatBounds(selectedDem)} wrap />
          </dl>

          <div className="map-dem-actions">
            <button
              type="button"
              className="aoi-button aoi-button--secondary"
              disabled={busy}
              onClick={() => void onGenerateHillshade(selectedDem.id)}
            >
              {generating ? "Generando…" : "Generar hillshade"}
            </button>
            {overlayOnMap ? (
              <button
                type="button"
                className="aoi-button aoi-button--secondary"
                disabled={busy}
                onClick={onRemoveFromMap}
              >
                Quitar del mapa
              </button>
            ) : (
              <button
                type="button"
                className="aoi-button"
                disabled={busy}
                onClick={() => void onAddToMap(selectedDem.id)}
              >
                {addingToMap ? "Agregando…" : "Agregar al mapa"}
              </button>
            )}
          </div>
        </>
      ) : null}

      {overlay ? (
        <div
          className="index-overlay-controls map-inspector-controls"
          aria-label="Controles de relieve"
        >
          <label className="aoi-field-label" htmlFor="map-dem-opacity">
            Opacidad ({opacityPct}%)
          </label>
          <input
            id="map-dem-opacity"
            className="index-overlay-opacity"
            type="range"
            min={0}
            max={100}
            step={1}
            value={opacityPct}
            onChange={(event) =>
              onOpacityChange(Number(event.target.value) / 100)
            }
          />
          <div
            className="aoi-icon-actions"
            role="group"
            aria-label="Acciones de relieve"
          >
            <IconButton label="Centrar DEM" onClick={onFitOverlay}>
              <Crosshair size={16} strokeWidth={2} aria-hidden="true" />
            </IconButton>
            <IconButton label="Quitar DEM" onClick={onRemoveFromMap}>
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </IconButton>
          </div>
          <p className="aoi-hint">
            El relieve queda debajo del índice o RGB activo.
          </p>
        </div>
      ) : null}
    </div>
  );
}
