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
import {
  panelRasterOverlayId,
  type ActiveIndexOverlay,
} from "../../hooks/useIndexMapOverlay";
import type { AoiRecord } from "../../types/aoi";
import type { SceneListItem, SceneRead } from "../../types/scene";
import type { DerivedAssetRead } from "../../types/derivedAsset";
import {
  RGB_PRESET_DESCRIPTIONS,
  RGB_PRESET_GROUPS,
  RGB_PRESET_LABELS,
  RGB_PRESET_ROLES,
  rgbPresetDisplayName,
  type RgbPresetKey,
} from "../../types/rgbComposite";
import {
  evaluateRgbPresetCompatibility,
  getRgbCompatibilityMessage,
  resolvePresetBands,
  resolveRgbCompatibilityStatus,
} from "../../utils/rgbCompatibility";
import {
  detectSensorFromScene,
  getSensorLabel,
} from "../../utils/sensors";
import ExistingDerivedNotice from "./ExistingDerivedNotice";
import ActionRow from "../ui/ActionRow";
import IconButton from "../ui/IconButton";
import RadiometryBadge from "../ui/RadiometryBadge";
import SectionCard from "../ui/SectionCard";
import StatusBadge from "../ui/StatusBadge";
import {
  extractRadiometryFromMetadata,
  normalizeRadiometry,
} from "../../utils/radiometry";

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
  mapOverlayLoadingAssetId?: string | null;
  mapOverlayError: string | null;
  onAddRgbToMap: (sceneId: string, preset: string) => void;
  onAddRgbAoiToMap: (sceneId: string, aoiId: string, preset: string) => void;
  onRemoveOverlayFromMap: () => void;
  onOverlayOpacityChange: (opacity: number) => void;
  onFitOverlay: () => void;
  findExistingDerived: (
    assetType: string,
    productKey: string,
    aoiId?: string | null,
  ) => DerivedAssetRead | null;
  onViewInResults: () => void;
  onDerivedCatalogChanged: () => void;
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
  mapOverlayLoadingAssetId = null,
  mapOverlayError,
  onAddRgbToMap,
  onAddRgbAoiToMap,
  onRemoveOverlayFromMap,
  onOverlayOpacityChange,
  onFitOverlay,
  findExistingDerived,
  onViewInResults,
  onDerivedCatalogChanged,
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
  const compatibility = selectedScene
    ? evaluateRgbPresetCompatibility(preset, selectedScene)
    : null;
  const compatibilityStatus = resolveRgbCompatibilityStatus(
    preset,
    selectedScene,
  );
  const compatibilityMessage = getRgbCompatibilityMessage(
    compatibilityStatus,
    compatibility,
  );
  const bandsUsed = sensor ? resolvePresetBands(sensor, preset) : null;
  const sceneRadiometry = selectedScene
    ? extractRadiometryFromMetadata(selectedScene.metadata)
    : null;
  const canAct = Boolean(selectedSceneId && !sceneDetailLoading);
  const presetCompatible = compatibilityStatus !== "incompatible";
  const canActAoi = Boolean(canAct && selectedAoiId);
  const hasAois = savedAois.length > 0;

  const existingFull = selectedSceneId
    ? findExistingDerived("rgb_composite", preset, null)
    : null;
  const existingAoi =
    selectedSceneId && selectedAoiId
      ? findExistingDerived("rgb_composite_aoi", preset, selectedAoiId)
      : null;

  const runAndRefresh = async (work: () => void | Promise<void>) => {
    await work();
    onDerivedCatalogChanged();
  };

  const overlayIsFullRgb =
    mapOverlay?.kind === "rgb_composite" &&
    mapOverlay.sceneId === selectedSceneId &&
    mapOverlay.productKey === preset &&
    mapOverlay.aoiId == null;

  const overlayIsAoiRgb =
    mapOverlay?.kind === "rgb_composite_aoi" &&
    mapOverlay.sceneId === selectedSceneId &&
    mapOverlay.productKey === preset &&
    mapOverlay.aoiId === selectedAoiId;

  const fullOverlayId = selectedSceneId
    ? panelRasterOverlayId("rgb_composite", selectedSceneId, preset, null)
    : null;
  const aoiOverlayId =
    selectedSceneId && selectedAoiId
      ? panelRasterOverlayId(
          "rgb_composite_aoi",
          selectedSceneId,
          preset,
          selectedAoiId,
        )
      : null;

  const addFullRgbDisabled = !canAct || mapOverlayLoading || !previewResult;
  const addAoiRgbDisabled =
    !canActAoi || mapOverlayLoading || !aoiPreviewResult;

  const loadingFullRgb =
    !addFullRgbDisabled &&
    fullOverlayId != null &&
    mapOverlayLoadingAssetId === fullOverlayId;
  const loadingAoiRgb =
    !addAoiRgbDisabled &&
    aoiOverlayId != null &&
    mapOverlayLoadingAssetId === aoiOverlayId;

  const hasResult = Boolean(
    previewResult ||
      aoiPreviewResult ||
      previewUrl ||
      aoiPreviewUrl ||
      error ||
      successMessage ||
      imageError ||
      mapOverlay ||
      mapOverlayError,
  );

  return (
    <section
      className="index-preview-panel panel-stack"
      aria-label="Composiciones RGB"
    >
      <p className="sidebar-label">Composiciones</p>

      <SectionCard title="Selección">
        <div className="aoi-field">
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
        </div>

        <div className="aoi-field">
          <label className="aoi-field-label" htmlFor="rgb-preset-select">
            Preset RGB
          </label>
          <select
            id="rgb-preset-select"
            className="aoi-select"
            value={preset}
            onChange={(event) => setPreset(event.target.value as RgbPresetKey)}
          >
            {RGB_PRESET_GROUPS.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.keys.map((key) => (
                  <option key={key} value={key}>
                    {RGB_PRESET_LABELS[key]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="aoi-hint">{RGB_PRESET_DESCRIPTIONS[preset]}</p>
        </div>
      </SectionCard>

      <SectionCard title="Compatibilidad">
        <div className="status-badge-row">
          <StatusBadge
            label={
              compatibilityStatus === "compatible"
                ? "Compatible"
                : compatibilityStatus === "incompatible"
                  ? "No compatible"
                  : "Sin evaluar"
            }
            tone={
              compatibilityStatus === "compatible"
                ? "ok"
                : compatibilityStatus === "incompatible"
                  ? "warn"
                  : "muted"
            }
            title={compatibilityMessage}
          />
          {sensor ? (
            <StatusBadge label={getSensorLabel(sensor)} />
          ) : (
            <StatusBadge label="Sin escena" tone="muted" />
          )}
          <StatusBadge label={RGB_PRESET_LABELS[preset]} tone="neutral" />
        </div>
        {sceneRadiometry && (
          <RadiometryBadge radiometry={sceneRadiometry} />
        )}
        <p className="aoi-hint" role="status">
          {compatibilityMessage}
        </p>
        {bandsUsed && (
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
            {compatibility && compatibility.missing_bands.length > 0 ? (
              <div className="scene-detail-row">
                <dt>Faltantes</dt>
                <dd className="compatibility-missing">
                  {compatibility.missing_bands.join(", ")}
                </dd>
              </div>
            ) : null}
          </dl>
        )}
      </SectionCard>

      <SectionCard title="RGB escena completa">
        <ExistingDerivedNotice
          existing={existingFull}
          onViewInResults={onViewInResults}
          regenerateHint="Podés regenerar la composición para sobrescribir el PNG."
        />
        <ActionRow label="Composición RGB escena completa">
          <div className="aoi-icon-actions" role="group" aria-label="Generar">
            <IconButton
              className="composition-button"
              label={
                busyAction === "generate"
                  ? "Generando…"
                  : existingFull
                    ? "Regenerar composición"
                    : "Generar Composición"
              }
              text={existingFull ? "Regenerar" : "Por Escena"}
              tone="primary"
              onClick={() => void runAndRefresh(generate)}
              disabled={!canAct || loading || !presetCompatible}
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
          <div
            className="aoi-icon-actions"
            role="group"
            aria-label="Mapa y descarga"
          >
            <IconButton
              label={
                loadingFullRgb ? "Agregando al mapa…" : "Agregar al mapa"
              }
              onClick={() => {
                if (selectedSceneId) {
                  onAddRgbToMap(selectedSceneId, preset);
                }
              }}
              disabled={addFullRgbDisabled}
            >
              {loadingFullRgb ? (
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
        </ActionRow>
      </SectionCard>

      <SectionCard title="RGB por AOI">
        <div className="aoi-field">
          <label className="aoi-field-label" htmlFor="rgb-aoi-select">
            AOI
          </label>
          {hasAois ? (
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
          ) : (
            <p className="aoi-hint" role="status" id="rgb-aoi-select">
              No hay AOIs guardados.
            </p>
          )}
        </div>
        {selectedAoiName && (
          <p className="compact-meta-line">{selectedAoiName}</p>
        )}
        <ExistingDerivedNotice
          existing={existingAoi}
          onViewInResults={onViewInResults}
          regenerateHint="Podés regenerar la composición AOI para sobrescribir el PNG."
        />
        <ActionRow label="Composición RGB por AOI">
          <div className="aoi-icon-actions" role="group" aria-label="Generar AOI">
            <IconButton
              className="composition-button"
              label={
                busyAction === "generate-aoi"
                  ? "Generando composición por AOI…"
                  : existingAoi
                    ? "Regenerar composición por AOI"
                    : "Generar composición por AOI"
              }
              text={existingAoi ? "Regenerar" : "Por AOI"}
              tone="primary"
              onClick={() => void runAndRefresh(generateByAoi)}
              disabled={!canActAoi || loading || !hasAois || !presetCompatible}
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
                loadingAoiRgb
                  ? "Agregando recorte al mapa…"
                  : "Agregar recorte al mapa"
              }
              onClick={() => {
                if (selectedSceneId && selectedAoiId) {
                  onAddRgbAoiToMap(selectedSceneId, selectedAoiId, preset);
                }
              }}
              disabled={addAoiRgbDisabled}
            >
              {loadingAoiRgb ? (
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
        </ActionRow>
      </SectionCard>

      {hasResult && (
        <SectionCard title="Resultado / metadata">
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
          {mapOverlayError && (
            <p className="aoi-error" role="alert">
              {mapOverlayError}
            </p>
          )}

          {previewResult && (
            <>
              <p className="compact-meta-line">
                Completa · {rgbPresetDisplayName(previewResult.preset)} ·{" "}
                {previewResult.status} · {previewResult.width}×
                {previewResult.height}
              </p>
              {previewResult.radiometry && (
                <RadiometryBadge
                  radiometry={normalizeRadiometry(previewResult.radiometry)}
                />
              )}
            </>
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

          {aoiPreviewResult && (
            <>
              <p className="compact-meta-line">
                AOI · {rgbPresetDisplayName(aoiPreviewResult.preset)} ·{" "}
                {aoiPreviewResult.status} · {aoiPreviewResult.width}×
                {aoiPreviewResult.height}
              </p>
              {aoiPreviewResult.radiometry && (
                <RadiometryBadge
                  radiometry={normalizeRadiometry(aoiPreviewResult.radiometry)}
                />
              )}
            </>
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

          {mapOverlay && (
            <div
              className="index-overlay-controls"
              aria-label="Capa raster activa en el mapa"
            >
              <p className="compact-meta-line">
                Capa activa: {mapOverlay.kind.startsWith("rgb") ? "RGB " : ""}
                {rgbPresetDisplayName(mapOverlay.productKey)}
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
              <div
                className="aoi-icon-actions"
                role="group"
                aria-label="Controles de capa"
              >
                <IconButton label="Centrar capa" onClick={onFitOverlay}>
                  <Crosshair size={16} strokeWidth={2} aria-hidden="true" />
                </IconButton>
                <IconButton
                  label="Quitar capa"
                  onClick={onRemoveOverlayFromMap}
                >
                  <X size={16} strokeWidth={2} aria-hidden="true" />
                </IconButton>
              </div>
              {!overlayIsFullRgb && !overlayIsAoiRgb && (
                <p className="aoi-hint" role="status">
                  Hay otra capa en el mapa. Agregar esta composición la
                  reemplaza.
                </p>
              )}
            </div>
          )}
        </SectionCard>
      )}
    </section>
  );
}
