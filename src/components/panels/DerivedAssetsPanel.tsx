import { useMemo, useState } from "react";
import {
  ArchiveRestore,
  Download,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Map as MapIcon,
  RefreshCw,
} from "lucide-react";
import type { AoiRecord } from "../../types/aoi";
import {
  DERIVED_ASSET_TYPES,
  derivedAssetTypeLabel,
  type DerivedActiveFilter,
  type DerivedAoiFilter,
  type DerivedAssetExistsResult,
  type DerivedAssetListFilters,
  type DerivedAssetRead,
} from "../../types/derivedAsset";
import type { SceneListItem } from "../../types/scene";
import IconButton from "../ui/IconButton";

interface DerivedAssetsPanelProps {
  scenes: SceneListItem[];
  selectedSceneId: string | null;
  scenesLoading: boolean;
  onSelectScene: (sceneId: string) => void;
  savedAois: AoiRecord[];
  assets: DerivedAssetRead[];
  /** Unfiltered catalog rows (for product-key dropdown options). */
  allAssets: DerivedAssetRead[];
  existenceById: Record<string, DerivedAssetExistsResult>;
  filters: DerivedAssetListFilters;
  onFiltersChange: (patch: Partial<DerivedAssetListFilters>) => void;
  listLoading: boolean;
  busyAssetId: string | null;
  error: string | null;
  successMessage?: string | null;
  onRefresh: () => void;
  onToggleOnMap: (asset: DerivedAssetRead) => void;
  onDownload: (asset: DerivedAssetRead) => void;
  onSoftDelete: (assetId: string) => void;
  onRestore: (assetId: string) => void;
  /** Derived asset id currently on the map (single slot). */
  activeOverlayAssetId?: string | null;
  /** Derived asset id whose map-overlay request is in flight. */
  loadingOverlayAssetId?: string | null;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatSize(asset: DerivedAssetRead): string {
  if (asset.width != null && asset.height != null) {
    return `${asset.width} × ${asset.height}`;
  }
  return "—";
}

function aoiName(aoiId: string | null, aois: AoiRecord[]): string {
  if (!aoiId) {
    return "—";
  }
  const match = aois.find((aoi) => aoi.id === aoiId);
  return match?.name ?? aoiId.slice(0, 8);
}

function sceneName(sceneId: string, scenes: SceneListItem[]): string {
  return scenes.find((scene) => scene.id === sceneId)?.name ?? sceneId.slice(0, 8);
}

function StatusBadges({
  asset,
  existence,
}: {
  asset: DerivedAssetRead;
  existence: DerivedAssetExistsResult | undefined;
}) {
  return (
    <div className="results-status-row" aria-label="Estado del producto">
      <span
        className={
          asset.is_active
            ? "results-badge results-badge--ok"
            : "results-badge results-badge--muted"
        }
      >
        {asset.is_active ? "Activo" : "Dado de baja"}
      </span>
      {existence ? (
        <span
          className={
            existence.asset_exists
              ? "results-badge results-badge--ok"
              : "results-badge results-badge--warn"
          }
        >
          {existence.asset_exists ? "Archivo presente" : "Archivo faltante"}
        </span>
      ) : (
        <span className="results-badge results-badge--muted">
          Archivo sin verificar
        </span>
      )}
    </div>
  );
}

export default function DerivedAssetsPanel({
  scenes,
  selectedSceneId,
  scenesLoading,
  onSelectScene,
  savedAois,
  assets,
  allAssets,
  existenceById,
  filters,
  onFiltersChange,
  listLoading,
  busyAssetId,
  error,
  successMessage = null,
  onRefresh,
  onToggleOnMap,
  onDownload,
  onSoftDelete,
  onRestore,
  activeOverlayAssetId = null,
  loadingOverlayAssetId = null,
}: DerivedAssetsPanelProps) {
  const [metadataAssetId, setMetadataAssetId] = useState<string | null>(null);

  const metadataAsset = useMemo(
    () => assets.find((asset) => asset.id === metadataAssetId) ?? null,
    [assets, metadataAssetId],
  );

  const productOptions = useMemo(() => {
    const keys = new Set(allAssets.map((asset) => asset.product_key));
    if (filters.productKey.trim()) {
      keys.add(filters.productKey.trim().toLowerCase());
    }
    return Array.from(keys).sort();
  }, [allAssets, filters.productKey]);

  return (
    <section className="results-panel">
      <h2 className="sidebar-label">Resultados</h2>
      <p className="aoi-hint">
        Administrá productos derivados del catálogo (archivos en DATA_ROOT).
      </p>

      <div className="aoi-field">
        <label className="aoi-field-label" htmlFor="results-scene-select">
          Escena
        </label>
        <select
          id="results-scene-select"
          className="aoi-input"
          value={selectedSceneId ?? ""}
          disabled={scenesLoading || listLoading}
          onChange={(event) => {
            const value = event.target.value;
            if (value) {
              onSelectScene(value);
            }
          }}
        >
          <option value="">Seleccionar escena…</option>
          {scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.name}
            </option>
          ))}
        </select>
      </div>

      <div className="results-filters" aria-label="Filtros de resultados">
        <div className="aoi-field">
          <label className="aoi-field-label" htmlFor="results-type-filter">
            Tipo de producto
          </label>
          <select
            id="results-type-filter"
            className="aoi-input"
            value={filters.assetType}
            disabled={!selectedSceneId || listLoading}
            onChange={(event) =>
              onFiltersChange({ assetType: event.target.value })
            }
          >
            <option value="">Todos</option>
            {DERIVED_ASSET_TYPES.map((type) => (
              <option key={type} value={type}>
                {derivedAssetTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="aoi-field">
          <label className="aoi-field-label" htmlFor="results-product-filter">
            Índice / composición
          </label>
          <select
            id="results-product-filter"
            className="aoi-input"
            value={filters.productKey}
            disabled={!selectedSceneId || listLoading}
            onChange={(event) =>
              onFiltersChange({ productKey: event.target.value })
            }
          >
            <option value="">Todos</option>
            {productOptions.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        <div className="aoi-field">
          <label className="aoi-field-label" htmlFor="results-aoi-filter">
            AOI
          </label>
          <select
            id="results-aoi-filter"
            className="aoi-input"
            value={filters.aoiFilter}
            disabled={!selectedSceneId || listLoading}
            onChange={(event) =>
              onFiltersChange({
                aoiFilter: event.target.value as DerivedAoiFilter,
              })
            }
          >
            <option value="all">Todos</option>
            <option value="with_aoi">Con AOI</option>
            <option value="without_aoi">Sin AOI</option>
          </select>
        </div>

        <div className="aoi-field">
          <label className="aoi-field-label" htmlFor="results-active-filter">
            Estado
          </label>
          <select
            id="results-active-filter"
            className="aoi-input"
            value={filters.activeFilter}
            disabled={!selectedSceneId || listLoading}
            onChange={(event) =>
              onFiltersChange({
                activeFilter: event.target.value as DerivedActiveFilter,
              })
            }
          >
            <option value="active">Activos</option>
            <option value="inactive">Dados de baja</option>
            <option value="all">Activos e inactivos</option>
          </select>
        </div>
      </div>

      <div className="aoi-actions">
        <IconButton
          label="Actualizar lista de derivados"
          text="Actualizar"
          onClick={onRefresh}
          disabled={!selectedSceneId || listLoading}
        >
          {listLoading ? (
            <Loader2 size={16} className="icon-spin" aria-hidden />
          ) : (
            <RefreshCw size={16} aria-hidden />
          )}
        </IconButton>
      </div>

      {error ? <p className="aoi-error">{error}</p> : null}
      {successMessage ? (
        <p className="compatibility-status compatibility-status--ok">
          {successMessage}
        </p>
      ) : null}

      {!selectedSceneId ? (
        <p className="aoi-hint">Elegí una escena para ver sus derivados.</p>
      ) : listLoading ? (
        <p className="aoi-hint">Cargando productos…</p>
      ) : assets.length === 0 ? (
        <p className="aoi-hint">
          No hay productos con estos filtros. Generá un índice o una composición
          RGB, o ampliá los filtros.
        </p>
      ) : (
        <ul className="aoi-saved-items results-asset-list">
          {assets.map((asset) => {
            const existence = existenceById[asset.id];
            const fileMissing = existence ? !existence.asset_exists : false;
            const isOverlayActive = activeOverlayAssetId === asset.id;
            const mapButtonDisabled =
              busyAssetId === asset.id || !asset.is_active || fileMissing;
            const isOverlayLoading =
              !mapButtonDisabled && loadingOverlayAssetId === asset.id;
            const busy = busyAssetId === asset.id || isOverlayLoading;
            return (
              <li
                key={asset.id}
                className={
                  asset.is_active
                    ? "aoi-saved-item results-asset-item"
                    : "aoi-saved-item results-asset-item results-asset-item--inactive"
                }
              >
                <div className="results-asset-header">
                  <strong>{derivedAssetTypeLabel(asset.asset_type)}</strong>
                  <span className="results-asset-product">
                    {asset.product_key}
                  </span>
                </div>
                <StatusBadges asset={asset} existence={existence} />
                {fileMissing ? (
                  <p className="aoi-error" role="status">
                    Archivo físico no encontrado
                    {existence?.missing_paths?.length
                      ? `: ${existence.missing_paths.join(", ")}`
                      : "."}
                  </p>
                ) : null}
                <div className="scene-detail-fields">
                  <div className="scene-detail-row">
                    <span>Escena</span>
                    <span>{sceneName(asset.scene_id, scenes)}</span>
                  </div>
                  <div className="scene-detail-row">
                    <span>AOI</span>
                    <span>{aoiName(asset.aoi_id, savedAois)}</span>
                  </div>
                  <div className="scene-detail-row">
                    <span>Tamaño</span>
                    <span>{formatSize(asset)}</span>
                  </div>
                  <div className="scene-detail-row">
                    <span>Creado</span>
                    <span>{formatDateTime(asset.created_at)}</span>
                  </div>
                  <div className="scene-detail-row">
                    <span>Actualizado</span>
                    <span>{formatDateTime(asset.updated_at)}</span>
                  </div>
                </div>
                <div className="aoi-icon-actions">
                  <IconButton
                    label={
                      isOverlayLoading
                        ? "Cargando en el mapa..."
                        : isOverlayActive
                          ? "Quitar del mapa"
                          : "Agregar al mapa"
                    }
                    onClick={() => onToggleOnMap(asset)}
                    disabled={mapButtonDisabled}
                    tone={isOverlayActive ? "primary" : "default"}
                  >
                    {isOverlayLoading ? (
                      <Loader2 size={16} className="icon-spin" aria-hidden />
                    ) : (
                      <MapIcon size={16} aria-hidden />
                    )}
                  </IconButton>
                  <IconButton
                    label="Descargar"
                    onClick={() => void onDownload(asset)}
                    disabled={busy || fileMissing}
                  >
                    <Download size={16} aria-hidden />
                  </IconButton>
                  <IconButton
                    label="Ver metadata"
                    onClick={() =>
                      setMetadataAssetId(
                        metadataAssetId === asset.id ? null : asset.id,
                      )
                    }
                    tone={metadataAssetId === asset.id ? "primary" : "default"}
                  >
                    {metadataAssetId === asset.id ? (
                      <Eye size={16} aria-hidden />
                    ) : (
                      <Info size={16} aria-hidden />
                    )}
                  </IconButton>
                  {asset.is_active ? (
                    <IconButton
                      label="Dar de baja"
                      onClick={() => void onSoftDelete(asset.id)}
                      disabled={busy}
                    >
                      <EyeOff size={16} aria-hidden />
                    </IconButton>
                  ) : (
                    <IconButton
                      label="Restaurar"
                      onClick={() => void onRestore(asset.id)}
                      disabled={busy}
                      tone="primary"
                    >
                      <ArchiveRestore size={16} aria-hidden />
                    </IconButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {metadataAsset ? (
        <div className="results-metadata">
          <h3 className="aoi-geojson-label">Metadata</h3>
          <pre className="results-metadata-pre">
            {JSON.stringify(
              {
                id: metadataAsset.id,
                asset_type: metadataAsset.asset_type,
                product_key: metadataAsset.product_key,
                scene_id: metadataAsset.scene_id,
                aoi_id: metadataAsset.aoi_id,
                asset_path: metadataAsset.asset_path,
                preview_path: metadataAsset.preview_path,
                georef_path: metadataAsset.georef_path,
                crs: metadataAsset.crs,
                width: metadataAsset.width,
                height: metadataAsset.height,
                nodata: metadataAsset.nodata,
                dtype: metadataAsset.dtype,
                stats: metadataAsset.stats,
                metadata: metadataAsset.metadata,
                is_active: metadataAsset.is_active,
                deleted_at: metadataAsset.deleted_at,
                created_at: metadataAsset.created_at,
                updated_at: metadataAsset.updated_at,
                file_check: existenceById[metadataAsset.id] ?? null,
              },
              null,
              2,
            )}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
