import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "../api/client";
import {
  checkDerivedAssetExists,
  listSceneDerivedAssets,
  restoreDerivedAsset,
  softDeleteDerivedAsset,
} from "../api/derivedAssetApi";
import {
  downloadIndexAoiCropFile,
  downloadIndexFile,
} from "../api/indexComputeApi";
import {
  downloadRgbAoiCompositePng,
  downloadRgbCompositePng,
} from "../api/rgbCompositeApi";
import {
  DEFAULT_DERIVED_ASSET_FILTERS,
  type DerivedAssetExistsResult,
  type DerivedAssetListFilters,
  type DerivedAssetRead,
} from "../types/derivedAsset";

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof TypeError) {
    return "No se pudo conectar a la API. Verificá que el backend esté levantado.";
  }
  return fallback;
}

function matchesFilters(
  asset: DerivedAssetRead,
  filters: DerivedAssetListFilters,
): boolean {
  if (filters.assetType && asset.asset_type !== filters.assetType) {
    return false;
  }
  if (
    filters.productKey.trim() &&
    asset.product_key !== filters.productKey.trim().toLowerCase()
  ) {
    return false;
  }
  if (filters.aoiFilter === "with_aoi" && !asset.aoi_id) {
    return false;
  }
  if (filters.aoiFilter === "without_aoi" && asset.aoi_id) {
    return false;
  }
  if (filters.activeFilter === "active" && !asset.is_active) {
    return false;
  }
  if (filters.activeFilter === "inactive" && asset.is_active) {
    return false;
  }
  return true;
}

export function useDerivedAssets(selectedSceneId: string | null) {
  const [assets, setAssets] = useState<DerivedAssetRead[]>([]);
  const [existenceById, setExistenceById] = useState<
    Record<string, DerivedAssetExistsResult>
  >({});
  const [filters, setFilters] = useState<DerivedAssetListFilters>(
    DEFAULT_DERIVED_ASSET_FILTERS,
  );
  const [listLoading, setListLoading] = useState(false);
  const [busyAssetId, setBusyAssetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const includeInactive =
    filters.activeFilter === "inactive" || filters.activeFilter === "all";

  const refreshAssets = useCallback(async () => {
    if (!selectedSceneId) {
      setAssets([]);
      setExistenceById({});
      setError(null);
      return;
    }

    setListLoading(true);
    setError(null);
    try {
      const rows = await listSceneDerivedAssets(selectedSceneId, {
        includeInactive,
      });
      setAssets(rows);

      const existenceEntries = await Promise.all(
        rows.map(async (asset) => {
          try {
            const result = await checkDerivedAssetExists(asset.id);
            return [asset.id, result] as const;
          } catch {
            return null;
          }
        }),
      );
      const next: Record<string, DerivedAssetExistsResult> = {};
      for (const entry of existenceEntries) {
        if (entry) {
          next[entry[0]] = entry[1];
        }
      }
      setExistenceById(next);
    } catch (err) {
      setAssets([]);
      setExistenceById({});
      setError(
        formatApiError(err, "No se pudieron listar los productos derivados."),
      );
    } finally {
      setListLoading(false);
    }
  }, [selectedSceneId, includeInactive]);

  useEffect(() => {
    void refreshAssets();
  }, [refreshAssets]);

  const visibleAssets = useMemo(
    () => assets.filter((asset) => matchesFilters(asset, filters)),
    [assets, filters],
  );

  const findExisting = useCallback(
    (
      assetType: string,
      productKey: string,
      aoiId: string | null = null,
    ): DerivedAssetRead | null => {
      const key = productKey.trim().toLowerCase();
      return (
        assets.find(
          (asset) =>
            asset.is_active &&
            asset.asset_type === assetType &&
            asset.product_key === key &&
            (aoiId == null
              ? asset.aoi_id == null
              : asset.aoi_id === aoiId),
        ) ?? null
      );
    },
    [assets],
  );

  const downloadAsset = useCallback(
    async (asset: DerivedAssetRead) => {
      setBusyAssetId(asset.id);
      setError(null);
      setSuccessMessage(null);
      try {
        const existence =
          existenceById[asset.id] ?? (await checkDerivedAssetExists(asset.id));
        if (!existence.asset_exists) {
          throw new Error(
            `El archivo físico no existe en storage (${asset.asset_path}).`,
          );
        }

        switch (asset.asset_type) {
          case "index":
            await downloadIndexFile(asset.scene_id, asset.product_key, "tif");
            break;
          case "index_aoi_crop":
            if (!asset.aoi_id) {
              throw new Error("El producto AOI no tiene aoi_id.");
            }
            await downloadIndexAoiCropFile(
              asset.scene_id,
              asset.product_key,
              asset.aoi_id,
              "tif",
            );
            break;
          case "rgb_composite":
            await downloadRgbCompositePng(asset.scene_id, asset.product_key);
            break;
          case "rgb_composite_aoi":
            if (!asset.aoi_id) {
              throw new Error("El producto AOI no tiene aoi_id.");
            }
            await downloadRgbAoiCompositePng(
              asset.scene_id,
              asset.aoi_id,
              asset.product_key,
            );
            break;
          default:
            throw new Error(`Tipo de asset no soportado: ${asset.asset_type}`);
        }
        setSuccessMessage(`Descarga iniciada: ${asset.product_key}`);
      } catch (err) {
        setError(
          err instanceof Error && !(err instanceof ApiError)
            ? err.message
            : formatApiError(err, "No se pudo descargar el producto."),
        );
      } finally {
        setBusyAssetId(null);
      }
    },
    [existenceById],
  );

  const removeAsset = useCallback(
    async (assetId: string) => {
      setBusyAssetId(assetId);
      setError(null);
      setSuccessMessage(null);
      try {
        await softDeleteDerivedAsset(assetId);
        setSuccessMessage(
          "Producto dado de baja del catálogo (archivo intacto).",
        );
        await refreshAssets();
      } catch (err) {
        setError(formatApiError(err, "No se pudo dar de baja el producto."));
      } finally {
        setBusyAssetId(null);
      }
    },
    [refreshAssets],
  );

  const restoreAsset = useCallback(
    async (assetId: string) => {
      setBusyAssetId(assetId);
      setError(null);
      setSuccessMessage(null);
      try {
        await restoreDerivedAsset(assetId);
        setSuccessMessage("Producto restaurado en el catálogo.");
        await refreshAssets();
      } catch (err) {
        setError(formatApiError(err, "No se pudo restaurar el producto."));
      } finally {
        setBusyAssetId(null);
      }
    },
    [refreshAssets],
  );

  const updateFilters = useCallback(
    (patch: Partial<DerivedAssetListFilters>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  return {
    assets: visibleAssets,
    allAssets: assets,
    existenceById,
    filters,
    updateFilters,
    listLoading,
    busyAssetId,
    error,
    successMessage,
    refreshAssets,
    downloadAsset,
    removeAsset,
    restoreAsset,
    findExisting,
  };
}
