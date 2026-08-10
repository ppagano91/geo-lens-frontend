import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../api/client";
import {
  listSceneDerivedAssets,
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
import type { DerivedAssetRead } from "../types/derivedAsset";

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof TypeError) {
    return "No se pudo conectar a la API. Verificá que el backend esté levantado.";
  }
  return fallback;
}

export function useDerivedAssets(selectedSceneId: string | null) {
  const [assets, setAssets] = useState<DerivedAssetRead[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [busyAssetId, setBusyAssetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refreshAssets = useCallback(async () => {
    if (!selectedSceneId) {
      setAssets([]);
      setError(null);
      return;
    }

    setListLoading(true);
    setError(null);
    try {
      const rows = await listSceneDerivedAssets(selectedSceneId);
      setAssets(rows);
    } catch (err) {
      setAssets([]);
      setError(formatApiError(err, "No se pudieron listar los productos derivados."));
    } finally {
      setListLoading(false);
    }
  }, [selectedSceneId]);

  useEffect(() => {
    void refreshAssets();
  }, [refreshAssets]);

  const downloadAsset = useCallback(async (asset: DerivedAssetRead) => {
    setBusyAssetId(asset.id);
    setError(null);
    setSuccessMessage(null);
    try {
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
      setError(formatApiError(err, "No se pudo descargar el producto."));
    } finally {
      setBusyAssetId(null);
    }
  }, []);

  const removeAsset = useCallback(
    async (assetId: string) => {
      setBusyAssetId(assetId);
      setError(null);
      setSuccessMessage(null);
      try {
        await softDeleteDerivedAsset(assetId);
        setSuccessMessage("Producto dado de baja del catálogo (archivo intacto).");
        await refreshAssets();
      } catch (err) {
        setError(formatApiError(err, "No se pudo dar de baja el producto."));
      } finally {
        setBusyAssetId(null);
      }
    },
    [refreshAssets],
  );

  return {
    assets,
    listLoading,
    busyAssetId,
    error,
    successMessage,
    refreshAssets,
    downloadAsset,
    removeAsset,
  };
}
