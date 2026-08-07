import { useCallback, useEffect, useState } from "react";
import {
  cropIndexByAoi,
  downloadIndexAoiCropFile,
} from "../api/indexComputeApi";
import type { IndexAoiCropResult } from "../types/indexCompute";
import {
  buildIndexAoiCropPayload,
  formatIndexAoiCropApiError,
} from "../utils/indexAoiCrop";

export type IndexAoiCropAction =
  | "crop"
  | "download-tif"
  | "download-png"
  | null;

export function useIndexAoiCrop(
  sceneId: string | null,
  indexKey: string | null,
  aoiId: string | null,
) {
  const [busyAction, setBusyAction] = useState<IndexAoiCropAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cropResult, setCropResult] = useState<IndexAoiCropResult | null>(null);

  useEffect(() => {
    setBusyAction(null);
    setError(null);
    setSuccessMessage(null);
    setCropResult(null);
  }, [sceneId, indexKey, aoiId]);

  const loading = busyAction !== null;

  const cropByAoi = useCallback(
    async (options?: { overwrite?: boolean }) => {
      if (!sceneId || !indexKey) {
        setError("Seleccioná una escena y un índice.");
        return;
      }
      if (!aoiId) {
        setError("Seleccioná un AOI guardado.");
        return;
      }

      setBusyAction("crop");
      setError(null);
      setSuccessMessage(null);

      try {
        const result = await cropIndexByAoi(
          sceneId,
          indexKey,
          buildIndexAoiCropPayload(aoiId, {
            overwrite: options?.overwrite ?? false,
            generatePreview: true,
          }),
        );
        setCropResult(result);
        setSuccessMessage(
          `Recorte listo (${result.raster.width}×${result.raster.height}).`,
        );
      } catch (err) {
        setError(formatIndexAoiCropApiError(err));
      } finally {
        setBusyAction(null);
      }
    },
    [sceneId, indexKey, aoiId],
  );

  const downloadGeotiff = useCallback(async () => {
    if (!sceneId || !indexKey || !aoiId) {
      setError("Seleccioná escena, índice y AOI.");
      return;
    }

    setBusyAction("download-tif");
    setError(null);

    try {
      await downloadIndexAoiCropFile(sceneId, indexKey, aoiId, "tif");
      setSuccessMessage("Descarga GeoTIFF recortado iniciada.");
    } catch (err) {
      setError(formatIndexAoiCropApiError(err, "No se pudo descargar el GeoTIFF."));
    } finally {
      setBusyAction(null);
    }
  }, [sceneId, indexKey, aoiId]);

  const downloadPng = useCallback(async () => {
    if (!sceneId || !indexKey || !aoiId) {
      setError("Seleccioná escena, índice y AOI.");
      return;
    }

    setBusyAction("download-png");
    setError(null);

    try {
      await downloadIndexAoiCropFile(sceneId, indexKey, aoiId, "png");
      setSuccessMessage("Descarga PNG recortado iniciada.");
    } catch (err) {
      setError(formatIndexAoiCropApiError(err, "No se pudo descargar el PNG."));
    } finally {
      setBusyAction(null);
    }
  }, [sceneId, indexKey, aoiId]);

  return {
    busyAction,
    loading,
    error,
    successMessage,
    cropResult,
    cropByAoi,
    downloadGeotiff,
    downloadPng,
    clearError: () => setError(null),
  };
}
