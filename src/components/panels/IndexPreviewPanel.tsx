import { useIndexCompute } from "../../hooks/useIndexCompute";
import type { SceneListItem, SceneRead } from "../../types/scene";
import {
  isComputableIndexKey,
  type IndexStats,
} from "../../types/indexCompute";
import type { SpectralIndexDefinition } from "../../types/spectralIndex";

interface IndexPreviewPanelProps {
  scenes: SceneListItem[];
  selectedScene: SceneRead | null;
  selectedSceneId: string | null;
  selectedIndex: SpectralIndexDefinition | null;
  scenesLoading: boolean;
  sceneDetailLoading: boolean;
  onSelectScene: (sceneId: string) => void;
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
}: IndexPreviewPanelProps) {
  const indexKey = selectedIndex?.key ?? null;
  const computable = indexKey ? isComputableIndexKey(indexKey) : false;
  const canAct = Boolean(selectedSceneId && indexKey && computable);

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

  const disabled = loading || sceneDetailLoading || !canAct;

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

      <div className="aoi-actions index-preview-actions">
        <button
          type="button"
          className="aoi-button"
          onClick={() => void compute()}
          disabled={disabled}
        >
          {busyAction === "compute" ? "Calculando..." : "Calcular"}
        </button>
        <button
          type="button"
          className="aoi-button aoi-button--secondary"
          onClick={() => void computeAndSave()}
          disabled={disabled}
        >
          {busyAction === "compute-and-save"
            ? "Guardando..."
            : "Calcular y guardar"}
        </button>
        <button
          type="button"
          className="aoi-button aoi-button--secondary"
          onClick={() => void generatePreview()}
          disabled={disabled}
        >
          {busyAction === "preview" ? "Generando..." : "Generar preview"}
        </button>
        <button
          type="button"
          className="aoi-button aoi-button--secondary"
          onClick={showPreview}
          disabled={disabled}
        >
          Ver preview
        </button>
        <button
          type="button"
          className="aoi-button aoi-button--secondary"
          onClick={() => void downloadGeotiff()}
          disabled={disabled}
        >
          {busyAction === "download-tif"
            ? "Descargando..."
            : "Descargar GeoTIFF"}
        </button>
        <button
          type="button"
          className="aoi-button aoi-button--secondary"
          onClick={() => void downloadPng()}
          disabled={disabled}
        >
          {busyAction === "download-png" ? "Descargando..." : "Descargar PNG"}
        </button>
      </div>

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
