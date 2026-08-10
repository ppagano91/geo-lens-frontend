import { useMemo, useState } from "react";
import {
  Download,
  Eye,
  Info,
  Loader2,
  Map as MapIcon,
  RefreshCw,
} from "lucide-react";
import type { AoiRecord } from "../../types/aoi";
import {
  derivedAssetTypeLabel,
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
  listLoading: boolean;
  busyAssetId: string | null;
  error: string | null;
  successMessage?: string | null;
  onRefresh: () => void;
  onAddToMap: (asset: DerivedAssetRead) => void;
  onDownload: (asset: DerivedAssetRead) => void;
  mapOverlayLoading?: boolean;
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

function aoiName(
  aoiId: string | null,
  aois: AoiRecord[],
): string {
  if (!aoiId) {
    return "—";
  }
  const match = aois.find((aoi) => aoi.id === aoiId);
  return match?.name ?? aoiId.slice(0, 8);
}

export default function DerivedAssetsPanel({
  scenes,
  selectedSceneId,
  scenesLoading,
  onSelectScene,
  savedAois,
  assets,
  listLoading,
  busyAssetId,
  error,
  successMessage = null,
  onRefresh,
  onAddToMap,
  onDownload,
  mapOverlayLoading = false,
}: DerivedAssetsPanelProps) {
  const [metadataAssetId, setMetadataAssetId] = useState<string | null>(null);

  const metadataAsset = useMemo(
    () => assets.find((asset) => asset.id === metadataAssetId) ?? null,
    [assets, metadataAssetId],
  );

  return (
    <section className="results-panel">
      <h2 className="sidebar-label">Resultados</h2>
      <p className="aoi-hint">
        Productos derivados registrados para la escena seleccionada (catálogo DB;
        archivos en DATA_ROOT).
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
          No hay productos registrados todavía. Generá un índice o una
          composición RGB.
        </p>
      ) : (
        <ul className="aoi-saved-items results-asset-list">
          {assets.map((asset) => {
            const busy = busyAssetId === asset.id || mapOverlayLoading;
            return (
              <li key={asset.id} className="aoi-saved-item results-asset-item">
                <div className="results-asset-header">
                  <strong>{derivedAssetTypeLabel(asset.asset_type)}</strong>
                  <span className="results-asset-product">
                    {asset.product_key}
                  </span>
                </div>
                <div className="scene-detail-fields">
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
                </div>
                <div className="aoi-icon-actions">
                  <IconButton
                    label="Agregar al mapa"
                    onClick={() => onAddToMap(asset)}
                    disabled={busy}
                    tone="primary"
                  >
                    {busy ? (
                      <Loader2 size={16} className="icon-spin" aria-hidden />
                    ) : (
                      <MapIcon size={16} aria-hidden />
                    )}
                  </IconButton>
                  <IconButton
                    label="Descargar"
                    onClick={() => void onDownload(asset)}
                    disabled={busy}
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
                created_at: metadataAsset.created_at,
                updated_at: metadataAsset.updated_at,
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
