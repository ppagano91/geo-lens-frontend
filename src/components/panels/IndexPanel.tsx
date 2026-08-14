import { RefreshCw } from "lucide-react";
import type { SceneListItem, SceneRead } from "../../types/scene";
import type { SpectralIndexDefinition } from "../../types/spectralIndex";
import type { AoiRecord } from "../../types/aoi";
import type { ActiveIndexOverlay } from "../../hooks/useIndexMapOverlay";
import type { DerivedAssetRead } from "../../types/derivedAsset";
import {
  detectSensorFromScene,
  getSensorLabel,
  resolveRequiredBandsForSensor,
} from "../../utils/sensors";
import CompatibilityPanel from "./CompatibilityPanel";
import IndexPreviewPanel from "./IndexPreviewPanel";
import CollapsibleSection from "../ui/CollapsibleSection";
import IconButton from "../ui/IconButton";
import SectionCard from "../ui/SectionCard";

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
    <section className="index-panel panel-stack" aria-label="Índices espectrales">
      <p className="sidebar-label">Índices</p>

      {error && (
        <p className="aoi-error" role="alert">
          {error}
        </p>
      )}

      <SectionCard
        title="Selección"
        actions={
          <IconButton
            label={listLoading ? "Cargando índices..." : "Refrescar índices"}
            onClick={onRefreshList}
            disabled={listLoading || detailLoading}
          >
            <RefreshCw
              size={16}
              aria-hidden="true"
              className={listLoading ? "icon-spin" : undefined}
            />
          </IconButton>
        }
      >
        <div className="aoi-field">
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
            disabled={scenesLoading || sceneDetailLoading}
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

        <div className="aoi-field">
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

        <div className="aoi-field">
          <p className="aoi-field-label" id="index-list-label">
            Índice
          </p>
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
            <ul className="compact-select-list" aria-labelledby="index-list-label">
              {indices.map((index) => {
                const isSelected = selectedIndexKey === index.key;
                return (
                  <li key={index.id}>
                    <button
                      type="button"
                      className={`compact-select-item${isSelected ? " compact-select-item--active" : ""}`}
                      onClick={() => void onSelectIndex(index.key)}
                      disabled={detailLoading}
                      aria-pressed={isSelected}
                    >
                      <span className="compact-select-item-name">
                        {index.key.toUpperCase()}
                      </span>
                      <span className="compact-select-item-meta">
                        {detailLoading && isSelected
                          ? "Cargando..."
                          : formatCategory(index.category)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SectionCard>

      <CompatibilityPanel
        selectedIndex={selectedIndex}
        selectedScene={selectedScene}
      />

      <IndexPreviewPanel
        selectedSceneId={selectedSceneId}
        selectedIndex={selectedIndex}
        sceneDetailLoading={sceneDetailLoading}
        savedAois={savedAois}
        selectedAoiId={selectedAoiId}
        selectedAoiName={selectedAoiName}
        onSelectAoi={onSelectAoi}
        mapOverlay={mapOverlay}
        mapOverlayLoading={mapOverlayLoading}
        mapOverlayLoadingAssetId={mapOverlayLoadingAssetId}
        mapOverlayError={mapOverlayError}
        onAddIndexToMap={onAddIndexToMap}
        onAddCropToMap={onAddCropToMap}
        onRemoveIndexFromMap={onRemoveIndexFromMap}
        onIndexOverlayOpacityChange={onIndexOverlayOpacityChange}
        onFitIndexOverlay={onFitIndexOverlay}
        findExistingDerived={findExistingDerived}
        onViewInResults={onViewInResults}
        onDerivedCatalogChanged={onDerivedCatalogChanged}
      />

      {selectedIndex && (
        <CollapsibleSection title="Detalle del índice" defaultOpen={false}>
          <dl className="scene-detail-fields index-detail">
            <div className="scene-detail-row">
              <dt>Nombre</dt>
              <dd>{selectedIndex.name}</dd>
            </div>
            <div className="scene-detail-row scene-detail-row--wrap">
              <dt>Descripción</dt>
              <dd>{selectedIndex.description}</dd>
            </div>
            <div className="scene-detail-row scene-detail-row--wrap">
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
            <div className="scene-detail-row scene-detail-row--wrap">
              <dt>Interpretación</dt>
              <dd>{selectedIndex.interpretation}</dd>
            </div>
          </dl>
        </CollapsibleSection>
      )}
    </section>
  );
}
