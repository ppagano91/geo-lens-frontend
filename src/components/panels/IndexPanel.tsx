import type { SceneListItem, SceneRead } from "../../types/scene";
import type { SpectralIndexDefinition } from "../../types/spectralIndex";
import {
  detectSensorFromScene,
  getSensorLabel,
  resolveRequiredBandsForSensor,
} from "../../utils/sensors";
import CompatibilityPanel from "./CompatibilityPanel";
import IndexPreviewPanel from "./IndexPreviewPanel";

interface IndexPanelProps {
  indices: SpectralIndexDefinition[];
  selectedIndex: SpectralIndexDefinition | null;
  selectedIndexKey: string | null;
  scenes: SceneListItem[];
  selectedScene: SceneRead | null;
  selectedSceneId: string | null;
  scenesLoading: boolean;
  sceneDetailLoading: boolean;
  categoryFilter: string;
  listLoading: boolean;
  detailLoading: boolean;
  error: string | null;
  onRefreshList: () => void;
  onSelectIndex: (indexKey: string) => void;
  onSelectScene: (sceneId: string) => void;
  onCategoryFilterChange: (category: string) => void;
}

const CATEGORY_OPTIONS = [
  { value: "", label: "Todas las categorías" },
  { value: "vegetation", label: "Vegetación" },
  { value: "water", label: "Agua" },
  { value: "burn", label: "Quemas" },
  { value: "moisture", label: "Humedad" },
] as const;

function formatCategory(category: string): string {
  const match = CATEGORY_OPTIONS.find((option) => option.value === category);
  return match?.label ?? category;
}

function formatOutputRange(
  outputRange: SpectralIndexDefinition["output_range"],
): string | null {
  if (!outputRange) {
    return null;
  }

  const { min, max } = outputRange;
  if (min !== undefined && max !== undefined) {
    return `${min} a ${max}`;
  }

  if (min !== undefined) {
    return `≥ ${min}`;
  }

  if (max !== undefined) {
    return `≤ ${max}`;
  }

  return null;
}

function RequiredBandsList({
  requiredBands,
}: {
  requiredBands: Record<string, string>;
}) {
  const entries = Object.entries(requiredBands);

  if (entries.length === 0) {
    return <dd>—</dd>;
  }

  return (
    <dd>
      <ul className="index-band-list">
        {entries.map(([role, bandKey]) => (
          <li key={role}>
            <span className="index-band-role">{role}</span>
            <span className="index-band-key">{bandKey}</span>
          </li>
        ))}
      </ul>
    </dd>
  );
}

export default function IndexPanel({
  indices,
  selectedIndex,
  selectedIndexKey,
  scenes,
  selectedScene,
  selectedSceneId,
  scenesLoading,
  sceneDetailLoading,
  categoryFilter,
  listLoading,
  detailLoading,
  error,
  onRefreshList,
  onSelectIndex,
  onSelectScene,
  onCategoryFilterChange,
}: IndexPanelProps) {
  const sceneSensor = selectedScene
    ? detectSensorFromScene(selectedScene)
    : null;
  const detailRequiredBands =
    selectedIndex == null
      ? null
      : sceneSensor
        ? resolveRequiredBandsForSensor(
            selectedIndex.required_bands,
            sceneSensor,
          )
        : selectedIndex.required_bands;

  return (
    <section className="index-panel" aria-label="Índices espectrales">
      <p className="sidebar-label">Índices</p>

      <IndexPreviewPanel
        scenes={scenes}
        selectedScene={selectedScene}
        selectedSceneId={selectedSceneId}
        selectedIndex={selectedIndex}
        scenesLoading={scenesLoading}
        sceneDetailLoading={sceneDetailLoading}
        onSelectScene={onSelectScene}
      />

      <CompatibilityPanel
        selectedIndex={selectedIndex}
        selectedScene={selectedScene}
      />

      {error && (
        <p className="aoi-error" role="alert">
          {error}
        </p>
      )}

      <div className="index-filter">
        <label className="aoi-field-label" htmlFor="index-category-filter">
          Categoría
        </label>
        <select
          id="index-category-filter"
          className="aoi-input"
          value={categoryFilter}
          onChange={(event) => onCategoryFilterChange(event.target.value)}
          disabled={listLoading || detailLoading}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="aoi-actions">
        <button
          type="button"
          className="aoi-button aoi-button--secondary"
          onClick={onRefreshList}
          disabled={listLoading || detailLoading}
        >
          {listLoading ? "Cargando índices..." : "Refrescar índices"}
        </button>
      </div>

      <div className="index-list">
        {listLoading && indices.length === 0 && (
          <p className="aoi-hint" role="status">
            Cargando índices...
          </p>
        )}

        {!listLoading && indices.length === 0 && (
          <p className="aoi-hint" role="status">
            Sin índices disponibles.
          </p>
        )}

        {indices.length > 0 && (
          <ul className="aoi-saved-items">
            {indices.map((index) => {
              const isSelected = selectedIndexKey === index.key;

              return (
                <li
                  key={index.id}
                  className={`aoi-saved-item${isSelected ? " aoi-saved-item--selected" : ""}`}
                >
                  <div className="aoi-saved-item-header">
                    <strong className="aoi-saved-item-name">
                      {index.key.toUpperCase()}
                    </strong>
                    <span className="aoi-saved-item-date">
                      {formatCategory(index.category)}
                    </span>
                  </div>
                  <p className="index-item-meta">{index.name}</p>
                  <div className="aoi-saved-item-actions">
                    <button
                      type="button"
                      className="aoi-button aoi-button--small"
                      onClick={() => void onSelectIndex(index.key)}
                      disabled={detailLoading}
                    >
                      {detailLoading && isSelected ? "Cargando..." : "Seleccionar"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selectedIndex && (
        <div className="index-detail">
          <p className="aoi-geojson-label">Índice seleccionado</p>

          <dl className="scene-detail-fields">
            <div className="scene-detail-row">
              <dt>Key</dt>
              <dd>{selectedIndex.key}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Nombre</dt>
              <dd>{selectedIndex.name}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Categoría</dt>
              <dd>{formatCategory(selectedIndex.category)}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Descripción</dt>
              <dd>{selectedIndex.description}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Fórmula</dt>
              <dd>
                <code className="index-formula">{selectedIndex.formula}</code>
              </dd>
            </div>
            <div className="scene-detail-row index-detail-bands">
              <dt>
                Bandas
                {sceneSensor ? ` (${getSensorLabel(sceneSensor)})` : ""}
              </dt>
              <RequiredBandsList requiredBands={detailRequiredBands ?? {}} />
            </div>
            {formatOutputRange(selectedIndex.output_range) && (
              <div className="scene-detail-row">
                <dt>Rango</dt>
                <dd>{formatOutputRange(selectedIndex.output_range)}</dd>
              </div>
            )}
            <div className="scene-detail-row">
              <dt>Interpretación</dt>
              <dd>{selectedIndex.interpretation}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
