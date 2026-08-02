import { useCallback, useEffect, useState } from "react";
import {
  computeAndSaveIndex,
  computeIndex,
  createIndexPreview,
  downloadIndexFile,
  getIndexPreviewPngUrl,
} from "../api/indexComputeApi";
import { ApiError } from "../api/client";
import type {
  IndexComputeResult,
  IndexComputeSaveResult,
  IndexPreviewResult,
  IndexStats,
} from "../types/indexCompute";

export type IndexComputeAction =
  | "compute"
  | "compute-and-save"
  | "preview"
  | "download-tif"
  | "download-png"
  | null;

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }

  if (err instanceof TypeError) {
    return "No se pudo conectar a la API. Verificá que el backend esté levantado.";
  }

  return fallback;
}

function extractStats(
  result: IndexComputeResult | IndexComputeSaveResult | null,
): IndexStats | null {
  return result?.stats ?? null;
}

export function useIndexCompute(
  sceneId: string | null,
  indexKey: string | null,
) {
  const [busyAction, setBusyAction] = useState<IndexComputeAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [computeResult, setComputeResult] = useState<
    IndexComputeResult | IndexComputeSaveResult | null
  >(null);
  const [previewResult, setPreviewResult] = useState<IndexPreviewResult | null>(
    null,
  );
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewCacheBust, setPreviewCacheBust] = useState<number | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    setBusyAction(null);
    setError(null);
    setSuccessMessage(null);
    setComputeResult(null);
    setPreviewResult(null);
    setPreviewVisible(false);
    setPreviewCacheBust(null);
    setImageError(null);
  }, [sceneId, indexKey]);

  const runAction = useCallback(
    async (
      action: Exclude<IndexComputeAction, null>,
      fallback: string,
      work: () => Promise<void>,
    ) => {
      if (!sceneId || !indexKey) {
        setError("Seleccioná una escena y un índice.");
        return;
      }

      setBusyAction(action);
      setError(null);
      setSuccessMessage(null);
      setImageError(null);

      try {
        await work();
      } catch (err) {
        setError(formatApiError(err, fallback));
      } finally {
        setBusyAction(null);
      }
    },
    [sceneId, indexKey],
  );

  const compute = useCallback(() => {
    return runAction("compute", "No se pudo calcular el índice", async () => {
      const result = await computeIndex(sceneId!, indexKey!);
      setComputeResult(result);
      setSuccessMessage(`Índice ${result.index} calculado.`);
    });
  }, [runAction, sceneId, indexKey]);

  const computeAndSave = useCallback(() => {
    return runAction(
      "compute-and-save",
      "No se pudo calcular y guardar el índice",
      async () => {
        const result = await computeAndSaveIndex(sceneId!, indexKey!);
        setComputeResult(result);
        setSuccessMessage(
          `Índice ${result.index} guardado en ${result.output.asset_path}.`,
        );
      },
    );
  }, [runAction, sceneId, indexKey]);

  const generatePreview = useCallback(() => {
    return runAction(
      "preview",
      "No se pudo generar el preview PNG",
      async () => {
        const result = await createIndexPreview(sceneId!, indexKey!);
        setPreviewResult(result);
        setPreviewCacheBust(Date.now());
        setPreviewVisible(true);
        setSuccessMessage(
          `Preview ${result.index} generado (${result.width}×${result.height}).`,
        );
      },
    );
  }, [runAction, sceneId, indexKey]);

  const showPreview = useCallback(() => {
    if (!sceneId || !indexKey) {
      setError("Seleccioná una escena y un índice.");
      return;
    }

    setError(null);
    setImageError(null);
    setPreviewCacheBust((current) => current ?? Date.now());
    setPreviewVisible(true);
    setSuccessMessage("Mostrando preview PNG.");
  }, [sceneId, indexKey]);

  const downloadGeotiff = useCallback(() => {
    return runAction(
      "download-tif",
      "No se pudo descargar el GeoTIFF",
      async () => {
        await downloadIndexFile(sceneId!, indexKey!, "tif");
        setSuccessMessage(
          `Descarga GeoTIFF iniciada (${sceneId}_${indexKey}.tif).`,
        );
      },
    );
  }, [runAction, sceneId, indexKey]);

  const downloadPng = useCallback(() => {
    return runAction(
      "download-png",
      "No se pudo descargar el PNG",
      async () => {
        await downloadIndexFile(sceneId!, indexKey!, "png");
        setSuccessMessage(
          `Descarga PNG iniciada (${sceneId}_${indexKey}.png).`,
        );
      },
    );
  }, [runAction, sceneId, indexKey]);

  const onPreviewImageError = useCallback(() => {
    setImageError(
      "No se pudo cargar el PNG. Generá el preview primero (requiere GeoTIFF derivado).",
    );
  }, []);

  const onPreviewImageLoad = useCallback(() => {
    setImageError(null);
  }, []);

  const previewUrl =
    previewVisible && sceneId && indexKey
      ? getIndexPreviewPngUrl(sceneId, indexKey, previewCacheBust ?? undefined)
      : null;

  return {
    busyAction,
    loading: busyAction !== null,
    error,
    successMessage,
    computeResult,
    stats: extractStats(computeResult),
    previewResult,
    previewVisible,
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
  };
}
