import {
  Calculator,
  Crop,
  Crosshair,
  Download,
  Eye,
  HardDriveDownload,
  ImageDown,
  ImagePlus,
  LayersPlus,
  Loader2,
  X,
} from "lucide-react";
import { useIndexAoiCrop } from "../../hooks/useIndexAoiCrop";
import { useIndexCompute } from "../../hooks/useIndexCompute";
import {
  panelRasterOverlayId,
  type ActiveIndexOverlay,
} from "../../hooks/useIndexMapOverlay";
import type { AoiRecord } from "../../types/aoi";
import type { SceneListItem, SceneRead } from "../../types/scene";
import type { DerivedAssetRead } from "../../types/derivedAsset";
import {
  isComputableIndexKey,
  type IndexStats,
} from "../../types/indexCompute";
import type { SpectralIndexDefinition } from "../../types/spectralIndex";
import ExistingDerivedNotice from "./ExistingDerivedNotice";
import IconButton from "../ui/IconButton";

interface IndexPreviewPanelProps {
  scenes: SceneListItem[];
  selectedScene: SceneRead | null;
  selectedSceneId: string | null;
  selectedIndex: SpectralIndexDefinition | null;
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
  onAddIndexToMap: (sceneId: string, indexKey: string) => void;
  onAddCropToMap: (sceneId: string, indexKey: string, aoiId: string) => void;
  onRemoveIndexFromMap: () => void;
  onIndexOverlayOpacityChange: (opacity: number) => void;
  onFitIndexOverlay: () => void;
  findExistingDerived: (
    assetType: string,
    productKey: string,
    aoiId?: string | null,
  ) => DerivedAssetRead | null;
  onViewInResults: () => void;
  onDerivedCatalogChanged: () => void;
}

function formatStat(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number.isFinite(value) ? value.toFixed(4) : "—";
}

function StatsBlock({ stats }: { stats: IndexStats }) {
  return (
    <dl className="scene-detail-fields">
      <div className="scene-detail-row">
        <dt>Min</dt>
        <dd>{formatStat(stats.min)}</dd>
      </div>
      <div className="scene-detail-row">
        <dt>Max</dt>
        <dd>{formatStat(stats.max)}</dd>
      </div>
      <div className="scene-detail-row">
        <dt>Mean</dt>
        <dd>{formatStat(stats.mean)}</dd>
      </div>
      <div className="scene-detail-row">
        <dt>Válidos</dt>
        <dd>{stats.valid_pixels}</dd>
      </div>
      <div className="scene-detail-row">
        <dt>Nodata</dt>
        <dd>{stats.nodata_pixels}</dd>
      </div>
    </dl>
  );
}

export default function IndexPreviewPanel({
  scenes,
  selectedScene,
  selectedSceneId,
  selectedIndex,
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
  onAddIndexToMap,
  onAddCropToMap,
  onRemoveIndexFromMap,
  onIndexOverlayOpacityChange,
  onFitIndexOverlay,
  findExistingDerived,
  onViewInResults,
  onDerivedCatalogChanged,
}: IndexPreviewPanelProps) {
  const indexKey = selectedIndex?.key ?? null;
  const computable = indexKey ? isComputableIndexKey(indexKey) : false;
  const canAct = Boolean(selectedSceneId && indexKey && computable);

  const fullOverlayId =
    selectedSceneId && indexKey
      ? panelRasterOverlayId("index", selectedSceneId, indexKey, null)
      : null;
  const cropOverlayId =
    selectedSceneId && indexKey && selectedAoiId
      ? panelRasterOverlayId(
          "index_aoi_crop",
          selectedSceneId,
          indexKey,
          selectedAoiId,
        )
      : null;

  const {
    busyAction,
    loading,
    error,
    successMessage,
    computeResult,
    stats,
    previewResult,
    previewUrl,
    imageError,
    compute,
    computeAndSave,
    generatePreview,
    showPreview,
    downloadGeotiff,
    downloadPng,
    onPreviewImageError,
    onPreviewImageLoad,
  } = useIndexCompute(selectedSceneId, indexKey);

  const crop = useIndexAoiCrop(selectedSceneId, indexKey, selectedAoiId);
  // Overwrite checkbox UI is currently hidden; keep false until re-enabled.
  const cropOverwrite = false;

  const disabled = loading || sceneDetailLoading || !canAct;
  const addFullToMapDisabled = disabled || mapOverlayLoading;
  const cropDisabled =
    disabled || crop.loading || !selectedAoiId || mapOverlayLoading;

  // Never treat null===null as loading; never spin on a disabled button.
  const loadingFullOverlay =
    !addFullToMapDisabled &&
    fullOverlayId != null &&
    mapOverlayLoadingAssetId === fullOverlayId;
  const loadingCropOverlay =
    !cropDisabled &&
    cropOverlayId != null &&
    mapOverlayLoadingAssetId === cropOverlayId;

  const existingFull =
    selectedSceneId && indexKey
      ? findExistingDerived("index", indexKey, null)
      : null;
  const existingCrop =
    selectedSceneId && indexKey && selectedAoiId
      ? findExistingDerived("index_aoi_crop", indexKey, selectedAoiId)
      : null;

  const runAndRefresh = async (work: () => void | Promise<void>) => {
    await work();
    onDerivedCatalogChanged();
  };

  const overlayActiveFull =
    mapOverlay !== null &&
    mapOverlay.kind === "index" &&
    mapOverlay.sceneId === selectedSceneId &&
    mapOverlay.productKey === indexKey &&
    mapOverlay.aoiId == null;

  const overlayActiveCrop =
    mapOverlay !== null &&
    mapOverlay.kind === "index_aoi_crop" &&
    mapOverlay.sceneId === selectedSceneId &&
    mapOverlay.productKey === indexKey &&
    mapOverlay.aoiId === selectedAoiId;

  return (
    <section className="index-preview-panel" aria-label="Preview de índices">
      <p className="aoi-geojson-label">Cálculo y preview</p>

      <div className="index-filter">
        <label className="aoi-field-label" htmlFor="index-preview-scene">
          Escena
        </label>
        <select
          id="index-preview-scene"
          className="aoi-input"
          value={selectedSceneId ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            if (value) {
              void onSelectScene(value);
            }
          }}
          disabled={scenesLoading || sceneDetailLoading || loading}
        >
          <option value="">
            {scenesLoading ? "Cargando escenas..." : "Seleccioná una escena"}
          </option>
          {scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.name}
            </option>
          ))}
        </select>
      </div>

      <dl className="scene-detail-fields">
        <div className="scene-detail-row">
          <dt>Escena</dt>
          <dd>{selectedScene?.name ?? "Ninguna"}</dd>
        </div>
        <div className="scene-detail-row">
          <dt>Índice</dt>
          <dd>
            {selectedIndex
              ? selectedIndex.key.toUpperCase()
              : "Ninguno (NDVI / NDWI / NBR / NDMI)"}
          </dd>
        </div>
      </dl>

      {!selectedSceneId && (
        <p className="aoi-hint" role="status">
          Seleccioná una escena para calcular índices.
        </p>
      )}

      {selectedSceneId && !selectedIndex && (
        <p className="aoi-hint" role="status">
          Seleccioná un índice (NDVI, NDWI, NBR o NDMI).
        </p>
      )}

      {selectedIndex && !computable && (
        <p className="aoi-hint" role="status">
          El cálculo local solo soporta NDVI, NDWI, NBR y NDMI.
        </p>
      )}

      <ExistingDerivedNotice
        existing={existingFull}
        onViewInResults={onViewInResults}
        regenerateHint="Podés regenerar con «Calcular y guardar» para sobrescribir."
      />

      <div className="aoi-icon-toolbar index-preview-actions" aria-label="Acciones de índice">
        <div className="aoi-icon-actions" role="group" aria-label="Cálculo">
          <IconButton
            label={
              busyAction === "compute" ? "Calculando índice..." : "Calcular índice"
            }
            tone="primary"
            onClick={() => void compute()}
            disabled={disabled}
          >
            {busyAction === "compute" ? (
              <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
            ) : (
              <Calculator size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
          <IconButton
            label={
              busyAction === "compute-and-save"
                ? "Calculando y guardando GeoTIFF..."
                : existingFull
                  ? "Regenerar GeoTIFF"
                  : "Calcular y guardar GeoTIFF"
            }
            onClick={() => void runAndRefresh(computeAndSave)}
            disabled={disabled}
          >
            {busyAction === "compute-and-save" ? (
              <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
            ) : (
              <HardDriveDownload size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
        </div>

        <div className="aoi-icon-actions" role="group" aria-label="Preview">
          <IconButton
            label={
              busyAction === "preview"
                ? "Generando preview PNG..."
                : "Generar preview PNG"
            }
            onClick={() => void generatePreview()}
            disabled={disabled}
          >
            {busyAction === "preview" ? (
              <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
            ) : (
              <ImagePlus size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
          <IconButton
            label="Ver preview"
            onClick={showPreview}
            disabled={disabled}
          >
            <Eye size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </div>

        <div className="aoi-icon-actions" role="group" aria-label="Descargas del índice">
          <IconButton
            label={
              busyAction === "download-tif"
                ? "Descargando GeoTIFF..."
                : "Descargar GeoTIFF"
            }
            onClick={() => void downloadGeotiff()}
            disabled={disabled}
          >
            {busyAction === "download-tif" ? (
              <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
            ) : (
              <Download size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
          <IconButton
            label={
              busyAction === "download-png"
                ? "Descargando PNG..."
                : "Descargar PNG"
            }
            onClick={() => void downloadPng()}
            disabled={disabled}
          >
            {busyAction === "download-png" ? (
              <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
            ) : (
              <ImageDown size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
        </div>

        <div className="aoi-icon-actions" role="group" aria-label="Mapa">
          <IconButton
            label={
              loadingFullOverlay
                ? "Agregando al mapa..."
                : "Agregar al mapa"
            }
            onClick={() => {
              if (selectedSceneId && indexKey) {
                onAddIndexToMap(selectedSceneId, indexKey);
              }
            }}
            disabled={addFullToMapDisabled}
          >
            {loadingFullOverlay ? (
              <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
            ) : (
              <LayersPlus size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
        </div>
      </div>

      <div className="index-aoi-crop" aria-label="Recorte por AOI">
        <p className="aoi-geojson-label">Recorte por AOI</p>
        {/* <p className="aoi-hint" role="status">
          Recorta el índice derivado ya guardado (no las bandas originales).
          Primero ejecutá Calcular y guardar.
        </p> */}

        <ExistingDerivedNotice
          existing={existingCrop}
          onViewInResults={onViewInResults}
          regenerateHint="Podés regenerar el recorte (marcá sobrescribir si hace falta)."
        />

        <div className="index-filter">
          <label className="aoi-field-label" htmlFor="index-preview-aoi">
            AOI
          </label>
          <select
            id="index-preview-aoi"
            className="aoi-input"
            value={selectedAoiId ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              if (value) {
                onSelectAoi(value);
              }
            }}
            disabled={disabled || crop.loading}
          >
            <option value="">
              {savedAois.length === 0
                ? "No hay AOIs guardados"
                : "Seleccioná un AOI"}
            </option>
            {savedAois.map((aoi) => (
              <option key={aoi.id} value={aoi.id}>
                {aoi.name}
              </option>
            ))}
          </select>
        </div>

        <dl className="scene-detail-fields">
          <div className="scene-detail-row">
            <dt>AOI</dt>
            <dd>{selectedAoiName ?? "Ninguno"}</dd>
          </div>
        </dl>

        <div className="aoi-icon-toolbar index-preview-actions">
          <div className="aoi-icon-actions" role="group" aria-label="Recorte">
            <IconButton
              label={
                crop.busyAction === "crop"
                  ? "Recortando por AOI..."
                  : existingCrop
                    ? "Regenerar recorte AOI"
                    : "Recortar por AOI"
              }
              // text={crop.busyAction === "crop" ? undefined : "Recortar"}
              tone="primary"
              onClick={() =>
                void runAndRefresh(() =>
                  crop.cropByAoi({ overwrite: cropOverwrite || Boolean(existingCrop) }),
                )
              }
              disabled={cropDisabled}
            >
              {crop.busyAction === "crop" ? (
                <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
              ) : (
                <Crop size={16} strokeWidth={2} aria-hidden="true" />
              )}
            </IconButton>
            {/* <label className="aoi-field-label index-crop-overwrite" htmlFor="index-crop-overwrite">
              <input
                id="index-crop-overwrite"
                type="checkbox"
                checked={cropOverwrite}
                onChange={(event) => setCropOverwrite(event.target.checked)}
                disabled={cropDisabled}
              />{" "}
              Sobrescribir
            </label> */}
          </div>

          <div className="aoi-icon-actions" role="group" aria-label="Mapa del recorte">
            <IconButton
              label={
                loadingCropOverlay
                  ? "Agregando recorte al mapa..."
                  : "Agregar recorte al mapa"
              }
              onClick={() => {
                if (selectedSceneId && indexKey && selectedAoiId) {
                  onAddCropToMap(selectedSceneId, indexKey, selectedAoiId);
                }
              }}
              disabled={cropDisabled}
            >
              {loadingCropOverlay ? (
                <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
              ) : (
                <LayersPlus size={16} strokeWidth={2} aria-hidden="true" />
              )}
            </IconButton>
          </div>

          <div
            className="aoi-icon-actions"
            role="group"
            aria-label="Descargas del recorte AOI"
          >
            <IconButton
              label={
                crop.busyAction === "download-tif"
                  ? "Descargando GeoTIFF recortado..."
                  : "Descargar GeoTIFF recortado"
              }
              onClick={() => void crop.downloadGeotiff()}
              disabled={cropDisabled}
            >
              {crop.busyAction === "download-tif" ? (
                <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
              ) : (
                <Download size={16} strokeWidth={2} aria-hidden="true" />
              )}
            </IconButton>
            <IconButton
              label={
                crop.busyAction === "download-png"
                  ? "Descargando PNG recortado..."
                  : "Descargar PNG recortado"
              }
              onClick={() => void crop.downloadPng()}
              disabled={cropDisabled}
            >
              {crop.busyAction === "download-png" ? (
                <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
              ) : (
                <ImageDown size={16} strokeWidth={2} aria-hidden="true" />
              )}
            </IconButton>
          </div>
        </div>

        {crop.error && (
          <p className="aoi-error" role="alert">
            {crop.error}
          </p>
        )}

        {crop.successMessage && !crop.error && (
          <p
            className="compatibility-status compatibility-status--ok"
            role="status"
          >
            {crop.successMessage}
          </p>
        )}

        {crop.cropResult && (
          <div className="index-preview-stats">
            <p className="aoi-geojson-label">
              Recorte ({crop.cropResult.index_key.toUpperCase()} ·{" "}
              {crop.cropResult.status})
            </p>
            <dl className="scene-detail-fields">
              <div className="scene-detail-row">
                <dt>Tamaño</dt>
                <dd>
                  {crop.cropResult.raster.width}×{crop.cropResult.raster.height}
                </dd>
              </div>
              <div className="scene-detail-row">
                <dt>CRS</dt>
                <dd>{crop.cropResult.raster.crs ?? "—"}</dd>
              </div>
            </dl>
            <StatsBlock stats={crop.cropResult.stats} />
            <p className="aoi-hint" role="status">
              GeoTIFF: {crop.cropResult.output.geotiff_asset_path}
            </p>
            {crop.cropResult.output.png_asset_path && (
              <p className="aoi-hint" role="status">
                PNG: {crop.cropResult.output.png_asset_path}
              </p>
            )}
          </div>
        )}
      </div>

      {mapOverlay && (
        <div className="index-overlay-controls" aria-label="Capa de índice en el mapa">
          <p className="aoi-geojson-label">
            Capa activa:{" "}
            {mapOverlay.kind.startsWith("rgb") ? "RGB " : ""}
            {mapOverlay.productKey.toUpperCase()}
            {mapOverlay.aoiId ? " (recorte AOI)" : ""}
          </p>
          <label className="aoi-field-label" htmlFor="index-overlay-opacity">
            Opacidad ({Math.round(mapOverlay.opacity * 100)}%)
          </label>
          <input
            id="index-overlay-opacity"
            className="index-overlay-opacity"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={mapOverlay.opacity}
            onChange={(event) =>
              onIndexOverlayOpacityChange(Number(event.target.value))
            }
          />
          <div className="aoi-icon-actions" role="group" aria-label="Controles de capa">
            <IconButton label="Centrar capa" onClick={onFitIndexOverlay}>
              <Crosshair size={16} strokeWidth={2} aria-hidden="true" />
            </IconButton>
            <IconButton label="Quitar capa" onClick={onRemoveIndexFromMap}>
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </IconButton>
          </div>
          {!overlayActiveFull && !overlayActiveCrop && selectedSceneId && indexKey && (
            <p className="aoi-hint" role="status">
              Hay otra capa en el mapa. Agregar índice o recorte la reemplaza.
            </p>
          )}
        </div>
      )}

      {mapOverlayError && (
        <p className="aoi-error" role="alert">
          {mapOverlayError}
        </p>
      )}

      {error && (
        <p className="aoi-error" role="alert">
          {error}
        </p>
      )}

      {successMessage && !error && (
        <p className="compatibility-status compatibility-status--ok" role="status">
          {successMessage}
        </p>
      )}

      {stats && computeResult && (
        <div className="index-preview-stats">
          <p className="aoi-geojson-label">
            Stats ({computeResult.index} · {computeResult.status})
          </p>
          <StatsBlock stats={stats} />
          {"output" in computeResult && (
            <p className="aoi-hint" role="status">
              Guardado: {computeResult.output.asset_path}
            </p>
          )}
        </div>
      )}

      {previewResult && (
        <p className="aoi-hint" role="status">
          PNG: {previewResult.output.asset_path} ({previewResult.width}×
          {previewResult.height})
        </p>
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
            alt={`Preview ${indexKey?.toUpperCase() ?? "índice"}`}
            onError={onPreviewImageError}
            onLoad={onPreviewImageLoad}
          />
        </div>
      )}
    </section>
  );
}
