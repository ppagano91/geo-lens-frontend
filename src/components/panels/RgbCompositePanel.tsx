import { useState } from "react";
import {
  Aperture,
  Crop,
  Crosshair,
  Download,
  LayersPlus,
  Loader2,
  X,
} from "lucide-react";
import { useRgbComposite } from "../../hooks/useRgbComposite";
import type { ActiveIndexOverlay } from "../../hooks/useIndexMapOverlay";
import type { AoiRecord } from "../../types/aoi";
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
  savedAois: AoiRecord[];
  selectedAoiId: string | null;
  selectedAoiName: string | null;
  onSelectAoi: (aoiId: string) => void;
  mapOverlay: ActiveIndexOverlay | null;
  mapOverlayLoading: boolean;
  mapOverlayError: string | null;
  onAddRgbToMap: (sceneId: string, preset: string) => void;
  onAddRgbAoiToMap: (sceneId: string, aoiId: string, preset: string) => void;
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
  savedAois,
  selectedAoiId,
  selectedAoiName,
  onSelectAoi,
  mapOverlay,
  mapOverlayLoading,
  mapOverlayError,
  onAddRgbToMap,
  onAddRgbAoiToMap,
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
    aoiPreviewResult,
    previewUrl,
    aoiPreviewUrl,
    imageError,
    generate,
    generateByAoi,
    downloadPng,
    downloadAoiPng,
    onPreviewImageError,
    onPreviewImageLoad,
  } = useRgbComposite(selectedSceneId, preset, selectedAoiId);

  const sensor = selectedScene ? detectSensorFromScene(selectedScene) : null;
  const bandsUsed = sensor ? resolvePresetBands(sensor, preset) : null;
  const canAct = Boolean(selectedSceneId && !sceneDetailLoading);
  const canActAoi = Boolean(canAct && selectedAoiId);
  const hasAois = savedAois.length > 0;

  const overlayIsFullRgb =
    mapOverlay?.kind === "rgb" &&
    mapOverlay.sceneId === selectedSceneId &&
    mapOverlay.indexKey === preset &&
    mapOverlay.aoiId == null;

  const overlayIsAoiRgb =
    mapOverlay?.kind === "rgb" &&
    mapOverlay.sceneId === selectedSceneId &&
    mapOverlay.indexKey === preset &&
    mapOverlay.aoiId === selectedAoiId;

  return (
    <section className="index-preview-panel" aria-label="Composiciones RGB">
      <p className="aoi-geojson-label">Composiciones RGB</p>
      <p className="aoi-hint">
        Combiná tres bandas (escena completa o recorte por AOI) y agregalas al
        mapa.
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

      <label className="aoi-field-label" htmlFor="rgb-aoi-select">
        AOI
      </label>
      {hasAois ? (
        <>
          <select
            id="rgb-aoi-select"
            className="aoi-select"
            value={selectedAoiId ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              if (value) {
                onSelectAoi(value);
              }
            }}
          >
            <option value="">Seleccionar AOI</option>
            {savedAois.map((aoi) => (
              <option key={aoi.id} value={aoi.id}>
                {aoi.name}
              </option>
            ))}
          </select>
          {selectedAoiName && (
            <p className="aoi-hint" role="status">
              AOI seleccionado: {selectedAoiName}
            </p>
          )}
        </>
      ) : (
        <p className="aoi-hint" role="status" id="rgb-aoi-select">
          No hay AOIs guardados. Dibujá y guardá uno en la pestaña AOI.
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

      <p className="aoi-geojson-label">Generar Composición</p>
      <div
        className="aoi-icon-toolbar"
        role="toolbar"
        aria-label="Composición RGB escena completa"
      >
        <div className="aoi-icon-actions" role="group" aria-label="Generar">
          <IconButton
            className="composition-button"
            label={
              busyAction === "generate"
                ? "Generando…"
                : "Generar Composición"
            }
            text="Por Escena"
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
              mapOverlayLoading && overlayIsFullRgb
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
            {mapOverlayLoading && overlayIsFullRgb ? (
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
              busyAction === "download" ? "Descargando PNG…" : "Descargar PNG"
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
        </div>
      </div>

      {previewResult && (
        <div className="index-preview-stats">
          <p className="aoi-geojson-label">
            Completa ({previewResult.preset} · {previewResult.status})
          </p>
          <p className="aoi-hint" role="status">
            {previewResult.width}×{previewResult.height} ·{" "}
            {previewResult.output.asset_path}
          </p>
        </div>
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

      {/* <p className="aoi-geojson-label">Por AOI</p> */}
      <div
        className="aoi-icon-toolbar"
        role="toolbar"
        aria-label="Composición RGB por AOI"
      >
        <div className="aoi-icon-actions" role="group" aria-label="Generar AOI">
          <IconButton
            className="composition-button"
            label={
              busyAction === "generate-aoi"
                ? "Generando composición por AOI…"
                : "Generar composición por AOI"
            }
            text="Por AOI"
            tone="primary"
            onClick={() => void generateByAoi()}
            disabled={!canActAoi || loading || !hasAois}
          >
            {busyAction === "generate-aoi" ? (
              <Loader2
                size={16}
                strokeWidth={2}
                className="icon-spin"
                aria-hidden="true"
              />
            ) : (
              <Crop size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
        </div>

        <div
          className="aoi-icon-actions"
          role="group"
          aria-label="Mapa y descarga AOI"
        >
          <IconButton
            label={
              mapOverlayLoading && overlayIsAoiRgb
                ? "Agregando recorte al mapa…"
                : "Agregar recorte al mapa"
            }
            onClick={() => {
              if (selectedSceneId && selectedAoiId) {
                onAddRgbAoiToMap(selectedSceneId, selectedAoiId, preset);
              }
            }}
            disabled={!canActAoi || mapOverlayLoading || !aoiPreviewResult}
          >
            {mapOverlayLoading && overlayIsAoiRgb ? (
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
              busyAction === "download-aoi"
                ? "Descargando PNG AOI…"
                : "Descargar PNG AOI"
            }
            onClick={() => void downloadAoiPng()}
            disabled={!canActAoi || loading || !aoiPreviewResult}
          >
            {busyAction === "download-aoi" ? (
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
        </div>
      </div>

      {aoiPreviewResult && (
        <div className="index-preview-stats">
          <p className="aoi-geojson-label">
            AOI ({aoiPreviewResult.preset} · {aoiPreviewResult.status})
          </p>
          <p className="aoi-hint" role="status">
            {aoiPreviewResult.width}×{aoiPreviewResult.height} ·{" "}
            {aoiPreviewResult.output.asset_path}
          </p>
        </div>
      )}

      {aoiPreviewUrl && (
        <div className="index-preview-image-wrap">
          <img
            className="index-preview-image"
            src={aoiPreviewUrl}
            alt={`Composición RGB AOI ${RGB_PRESET_LABELS[preset]}`}
            onError={onPreviewImageError}
            onLoad={onPreviewImageLoad}
          />
        </div>
      )}

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

      {imageError && (
        <p className="aoi-error" role="alert">
          {imageError}
        </p>
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
          {!overlayIsFullRgb && !overlayIsAoiRgb && (
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
    </section>
  );
}
