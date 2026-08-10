import { useCallback, useEffect, useState } from "react";
import {
  createRgbCompositePreview,
  downloadRgbCompositePng,
  getRgbCompositePreviewPngUrl,
} from "../api/rgbCompositeApi";
import { ApiError } from "../api/client";
import type {
  RgbCompositePreviewResult,
  RgbPresetKey,
} from "../types/rgbComposite";

export type RgbBusyAction = "generate" | "download" | null;

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }

  if (err instanceof TypeError) {
    return "No se pudo conectar a la API. Verificá que el backend esté levantado.";
  }

  return fallback;
}

export function useRgbComposite(sceneId: string | null, preset: RgbPresetKey) {
  const [busyAction, setBusyAction] = useState<RgbBusyAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewResult, setPreviewResult] =
    useState<RgbCompositePreviewResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    setBusyAction(null);
    setError(null);
    setSuccessMessage(null);
    setPreviewResult(null);
    setPreviewUrl(null);
    setImageError(null);
  }, [sceneId, preset]);

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

  return {
    busyAction,
    loading,
    error,
    successMessage,
    previewResult,
    previewUrl,
    imageError,
    generate,
    downloadPng,
    onPreviewImageError: () =>
      setImageError("No se pudo cargar la imagen preview."),
    onPreviewImageLoad: () => setImageError(null),
    clearError: () => setError(null),
  };
}
