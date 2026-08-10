import { useCallback, useEffect, useState } from "react";
import {
  createRgbCompositePreview,
  createRgbCompositePreviewByAoi,
  downloadRgbAoiCompositePng,
  downloadRgbCompositePng,
  getRgbAoiCompositePreviewPngUrl,
  getRgbCompositePreviewPngUrl,
} from "../api/rgbCompositeApi";
import { ApiError } from "../api/client";
import type {
  RgbCompositeAoiPreviewResult,
  RgbCompositePreviewResult,
  RgbPresetKey,
} from "../types/rgbComposite";

export type RgbBusyAction =
  | "generate"
  | "generate-aoi"
  | "download"
  | "download-aoi"
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

export function useRgbComposite(
  sceneId: string | null,
  preset: RgbPresetKey,
  aoiId: string | null,
) {
  const [busyAction, setBusyAction] = useState<RgbBusyAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewResult, setPreviewResult] =
    useState<RgbCompositePreviewResult | null>(null);
  const [aoiPreviewResult, setAoiPreviewResult] =
    useState<RgbCompositeAoiPreviewResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aoiPreviewUrl, setAoiPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    setBusyAction(null);
    setError(null);
    setSuccessMessage(null);
    setPreviewResult(null);
    setAoiPreviewResult(null);
    setPreviewUrl(null);
    setAoiPreviewUrl(null);
    setImageError(null);
  }, [sceneId, preset, aoiId]);

  const loading = busyAction !== null;

  const generate = useCallback(async () => {
    if (!sceneId) {
      return;
    }

    setBusyAction("generate");
    setError(null);
    setSuccessMessage(null);
    setImageError(null);

    try {
      const result = await createRgbCompositePreview(sceneId, {
        preset,
        overwrite: true,
      });
      setPreviewResult(result);
      setPreviewUrl(
        getRgbCompositePreviewPngUrl(sceneId, result.preset, Date.now()),
      );
      setSuccessMessage(
        `Composición ${result.preset} generada (${result.width}×${result.height}).`,
      );
    } catch (err) {
      setError(
        formatApiError(
          err,
          "No se pudo generar la composición RGB. Revisá bandas y alineación.",
        ),
      );
    } finally {
      setBusyAction(null);
    }
  }, [sceneId, preset]);

  const generateByAoi = useCallback(async () => {
    if (!sceneId || !aoiId) {
      return;
    }

    setBusyAction("generate-aoi");
    setError(null);
    setSuccessMessage(null);
    setImageError(null);

    try {
      const result = await createRgbCompositePreviewByAoi(sceneId, {
        aoi_id: aoiId,
        preset,
        overwrite: true,
      });
      setAoiPreviewResult(result);
      setAoiPreviewUrl(
        getRgbAoiCompositePreviewPngUrl(
          sceneId,
          aoiId,
          result.preset,
          Date.now(),
        ),
      );
      setSuccessMessage(
        `Composición AOI ${result.preset} generada (${result.width}×${result.height}).`,
      );
    } catch (err) {
      setError(
        formatApiError(
          err,
          "No se pudo generar la composición por AOI. Revisá intersección y bandas.",
        ),
      );
    } finally {
      setBusyAction(null);
    }
  }, [sceneId, aoiId, preset]);

  const downloadPng = useCallback(async () => {
    if (!sceneId) {
      return;
    }

    setBusyAction("download");
    setError(null);

    try {
      await downloadRgbCompositePng(sceneId, preset);
      setSuccessMessage(`PNG descargado: ${preset}.png`);
    } catch (err) {
      setError(
        formatApiError(
          err,
          "No se pudo descargar el PNG. Generá la composición primero.",
        ),
      );
    } finally {
      setBusyAction(null);
    }
  }, [sceneId, preset]);

  const downloadAoiPng = useCallback(async () => {
    if (!sceneId || !aoiId) {
      return;
    }

    setBusyAction("download-aoi");
    setError(null);

    try {
      await downloadRgbAoiCompositePng(sceneId, aoiId, preset);
      setSuccessMessage(`PNG AOI descargado: ${preset}.png`);
    } catch (err) {
      setError(
        formatApiError(
          err,
          "No se pudo descargar el PNG. Generá la composición por AOI primero.",
        ),
      );
    } finally {
      setBusyAction(null);
    }
  }, [sceneId, aoiId, preset]);

  return {
    busyAction,
    loading,
    error,
    successMessage,
    previewResult,
    aoiPreviewResult,
    previewUrl,
    aoiPreviewUrl,
    imageError,
    generate,
    generateByAoi,
    downloadPng,
    downloadAoiPng,
    onPreviewImageError: () =>
      setImageError("No se pudo cargar la imagen preview."),
    onPreviewImageLoad: () => setImageError(null),
    clearError: () => setError(null),
  };
}
