import { useState } from "react";
import {
  Aperture,
  Crosshair,
  Download,
  ImagePlus,
  Layers,
  LayersPlus,
  Loader2,
  X,
} from "lucide-react";
import { useRgbComposite } from "../../hooks/useRgbComposite";
import type { ActiveIndexOverlay } from "../../hooks/useIndexMapOverlay";
import type { SceneListItem, SceneRead } from "../../types/scene";
import {
  RGB_PRESET_KEYS,
  RGB_PRESET_LABELS,
  RGB_PRESET_ROLES,
  type RgbPresetKey,
} from "../../types/rgbComposite";
import {
  detectSensorFromScene,
  getBandMap,
  getSensorLabel,
} from "../../utils/sensors";
import IconButton from "../ui/IconButton";

interface RgbCompositePanelProps {
  scenes: SceneListItem[];
  selectedScene: SceneRead | null;
  selectedSceneId: string | null;
  scenesLoading: boolean;
  sceneDetailLoading: boolean;
  onSelectScene: (sceneId: string) => void;
  mapOverlay: ActiveIndexOverlay | null;
  mapOverlayLoading: boolean;
  mapOverlayError: string | null;
  onAddRgbToMap: (sceneId: string, preset: string) => void;
  onRemoveOverlayFromMap: () => void;
  onOverlayOpacityChange: (opacity: number) => void;
  onFitOverlay: () => void;
}

function resolvePresetBands(
  sensorId: ReturnType<typeof detectSensorFromScene>,
  preset: RgbPresetKey,
): Record<string, string> {
  const roles = RGB_PRESET_ROLES[preset];
  const bandMap = getBandMap(sensorId);
  return {
    red: bandMap[roles.red] ?? roles.red,
    green: bandMap[roles.green] ?? roles.green,
    blue: bandMap[roles.blue] ?? roles.blue,
  };
}

export default function RgbCompositePanel({
  scenes,
  selectedScene,
  selectedSceneId,
  scenesLoading,
  sceneDetailLoading,
  onSelectScene,
  mapOverlay,
  mapOverlayLoading,
  mapOverlayError,
  onAddRgbToMap,
  onRemoveOverlayFromMap,
  onOverlayOpacityChange,
  onFitOverlay,
}: RgbCompositePanelProps) {
  const [preset, setPreset] = useState<RgbPresetKey>("true_color");

  const {
    busyAction,
    loading,
    error,
    successMessage,
    previewResult,
    previewUrl,
    imageError,
    generate,
    downloadPng,
    onPreviewImageError,
    onPreviewImageLoad,
  } = useRgbComposite(selectedSceneId, preset);

  const sensor = selectedScene ? detectSensorFromScene(selectedScene) : null;
  const bandsUsed = sensor ? resolvePresetBands(sensor, preset) : null;
  const canAct = Boolean(selectedSceneId && !sceneDetailLoading);
  const overlayIsThisRgb =
    mapOverlay?.kind === "rgb" &&
    mapOverlay.sceneId === selectedSceneId &&
    mapOverlay.indexKey === preset;

  return (
    <section className="index-preview-panel" aria-label="Composiciones RGB">
      <p className="aoi-geojson-label">Composiciones RGB</p>
      <p className="aoi-hint">
        Primera aproximación a un módulo tipo SCP / Band Set: combiná tres
        bandas en un PNG visual y agregalo al mapa.
      </p>

      <label className="aoi-field-label" htmlFor="rgb-scene-select">
        Escena
      </label>
      <select
        id="rgb-scene-select"
        className="aoi-select"
        value={selectedSceneId ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          if (value) {
            onSelectScene(value);
          }
        }}
        disabled={scenesLoading}
      >
        <option value="">
          {scenesLoading ? "Cargando escenas…" : "Seleccionar escena"}
        </option>
        {scenes.map((scene) => (
          <option key={scene.id} value={scene.id}>
            {scene.name}
          </option>
        ))}
      </select>

      {sensor && (
        <p className="aoi-hint" role="status">
          Sensor detectado: {getSensorLabel(sensor)}
        </p>
      )}

      <label className="aoi-field-label" htmlFor="rgb-preset-select">
        Preset
      </label>
      <select
        id="rgb-preset-select"
        className="aoi-select"
        value={preset}
        onChange={(event) => setPreset(event.target.value as RgbPresetKey)}
      >
        {RGB_PRESET_KEYS.map((key) => (
          <option key={key} value={key}>
            {RGB_PRESET_LABELS[key]}
          </option>
        ))}
      </select>

      {bandsUsed && (
        <div className="index-preview-stats">
          <p className="aoi-geojson-label">Bandas usadas (R / G / B)</p>
          <dl className="scene-detail-fields">
            <div className="scene-detail-row">
              <dt>Rojo</dt>
              <dd>
                {RGB_PRESET_ROLES[preset].red} → {bandsUsed.red}
              </dd>
            </div>
            <div className="scene-detail-row">
              <dt>Verde</dt>
              <dd>
                {RGB_PRESET_ROLES[preset].green} → {bandsUsed.green}
              </dd>
            </div>
            <div className="scene-detail-row">
              <dt>Azul</dt>
              <dd>
                {RGB_PRESET_ROLES[preset].blue} → {bandsUsed.blue}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div className="aoi-icon-toolbar" role="toolbar" aria-label="Composición RGB">
        <div className="aoi-icon-actions" role="group" aria-label="Generar">
          <IconButton
            label={
              busyAction === "generate"
                ? "Generando composición…"
                : "Generar composición"
            }
            text="Generar composición"
            tone="primary"
            onClick={() => void generate()}
            disabled={!canAct || loading}
          >
            {busyAction === "generate" ? (
              <Loader2
                size={16}
                strokeWidth={2}
                className="icon-spin"
                aria-hidden="true"
              />
            ) : (
              <Aperture size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
        </div>

        <div className="aoi-icon-actions" role="group" aria-label="Mapa y descarga">
          <IconButton
            label={
              mapOverlayLoading && overlayIsThisRgb
                ? "Agregando al mapa…"
                : "Agregar al mapa"
            }
            onClick={() => {
              if (selectedSceneId) {
                onAddRgbToMap(selectedSceneId, preset);
              }
            }}
            disabled={!canAct || mapOverlayLoading || !previewResult}
          >
            {mapOverlayLoading && overlayIsThisRgb ? (
              <Loader2
                size={16}
                strokeWidth={2}
                className="icon-spin"
                aria-hidden="true"
              />
            ) : (
              <LayersPlus size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
          <IconButton
            label={
              busyAction === "download"
                ? "Descargando PNG…"
                : "Descargar PNG"
            }
            onClick={() => void downloadPng()}
            disabled={!canAct || loading || !previewResult}
          >
            {busyAction === "download" ? (
              <Loader2
                size={16}
                strokeWidth={2}
                className="icon-spin"
                aria-hidden="true"
              />
            ) : (
              <Download size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
          {!previewResult && canAct && (
            <span className="aoi-hint" role="status">
              Generá la composición para habilitar mapa y descarga.
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="aoi-error" role="alert">
          {error}
        </p>
      )}

      {successMessage && !error && (
        <p
          className="compatibility-status compatibility-status--ok"
          role="status"
        >
          {successMessage}
        </p>
      )}

      {previewResult && (
        <div className="index-preview-stats">
          <p className="aoi-geojson-label">
            Resultado ({previewResult.preset} · {previewResult.status})
          </p>
          <dl className="scene-detail-fields">
            <div className="scene-detail-row">
              <dt>Sensor</dt>
              <dd>{previewResult.sensor}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Tamaño</dt>
              <dd>
                {previewResult.width}×{previewResult.height}
              </dd>
            </div>
            <div className="scene-detail-row">
              <dt>CRS</dt>
              <dd>{previewResult.crs ?? "—"}</dd>
            </div>
          </dl>
          <p className="aoi-hint" role="status">
            PNG: {previewResult.output.asset_path}
          </p>
          <ul className="index-band-list">
            {Object.entries(previewResult.bands_used).map(([channel, key]) => (
              <li key={channel}>
                <span className="index-band-role">{channel}</span>
                <span className="index-band-key">{key}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {imageError && (
        <p className="aoi-error" role="alert">
          {imageError}
        </p>
      )}

      {previewUrl && (
        <div className="index-preview-image-wrap">
          <img
            className="index-preview-image"
            src={previewUrl}
            alt={`Composición RGB ${RGB_PRESET_LABELS[preset]}`}
            onError={onPreviewImageError}
            onLoad={onPreviewImageLoad}
          />
        </div>
      )}

      {mapOverlay && (
        <div
          className="index-overlay-controls"
          aria-label="Capa raster activa en el mapa"
        >
          <p className="aoi-geojson-label">
            Capa activa:{" "}
            {mapOverlay.kind === "rgb" ? "RGB " : ""}
            {mapOverlay.indexKey.toUpperCase()}
            {mapOverlay.aoiId ? " (recorte AOI)" : ""}
          </p>
          <label className="aoi-field-label" htmlFor="rgb-overlay-opacity">
            Opacidad ({Math.round(mapOverlay.opacity * 100)}%)
          </label>
          <input
            id="rgb-overlay-opacity"
            className="index-overlay-opacity"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={mapOverlay.opacity}
            onChange={(event) =>
              onOverlayOpacityChange(Number(event.target.value))
            }
          />
          <div className="aoi-icon-actions" role="group" aria-label="Controles de capa">
            <IconButton label="Centrar capa" onClick={onFitOverlay}>
              <Crosshair size={16} strokeWidth={2} aria-hidden="true" />
            </IconButton>
            <IconButton label="Quitar capa" onClick={onRemoveOverlayFromMap}>
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </IconButton>
          </div>
          {!overlayIsThisRgb && (
            <p className="aoi-hint" role="status">
              Hay otra capa en el mapa. Agregar esta composición la reemplaza.
            </p>
          )}
        </div>
      )}

      {mapOverlayError && (
        <p className="aoi-error" role="alert">
          {mapOverlayError}
        </p>
      )}

      {!previewResult && (
        <p className="aoi-hint" role="status">
          <ImagePlus size={14} strokeWidth={2} aria-hidden="true" /> Stretch
          percentile 2–98; nodata transparente. Sin stack GeoTIFF ni crop AOI
          todavía.
        </p>
      )}
    </section>
  );
}
