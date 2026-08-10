import { useCallback, useState } from "react";
import {
  getIndexAoiCropMapOverlay,
  getIndexMapOverlay,
} from "../api/indexComputeApi";
import { getRgbAoiCompositeMapOverlay, getRgbCompositeMapOverlay } from "../api/rgbCompositeApi";
import { ApiError } from "../api/client";
import { API_BASE_URL } from "../config/env";
import type {
  IndexAoiCropMapOverlayResult,
  IndexMapOverlayCoordinates,
  IndexMapOverlayResult,
} from "../types/indexCompute";
import type {
  RgbCompositeAoiMapOverlayResult,
  RgbCompositeMapOverlayResult,
} from "../types/rgbComposite";

export type ActiveOverlayKind = "index" | "rgb";

export interface ActiveIndexOverlay {
  kind: ActiveOverlayKind;
  sceneId: string;
  /** Index key (ndvi, …) or RGB preset (true_color, …). */
  indexKey: string;
  /** Present when the active overlay is an AOI crop (Fase 9F). */
  aoiId: string | null;
  imageUrl: string;
  coordinates: IndexMapOverlayCoordinates;
  width: number;
  height: number;
  crsOriginal: string;
  opacity: number;
}

const DEFAULT_OPACITY = 0.75;

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }

  if (err instanceof TypeError) {
    return "No se pudo conectar a la API. Verificá que el backend esté levantado.";
  }

  return fallback;
}

function toAbsoluteImageUrl(imageUrl: string, cacheBust: number): string {
  const base = imageUrl.startsWith("http")
    ? imageUrl
    : `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}t=${cacheBust}`;
}

function toActiveOverlay(
  result:
    | IndexMapOverlayResult
    | IndexAoiCropMapOverlayResult
    | RgbCompositeMapOverlayResult
    | RgbCompositeAoiMapOverlayResult,
  opacity: number,
  cacheBust: number,
  aoiId: string | null,
  kind: ActiveOverlayKind,
  key: string,
): ActiveIndexOverlay {
  return {
    kind,
    sceneId: result.scene_id,
    indexKey: key,
    aoiId,
    imageUrl: toAbsoluteImageUrl(result.image_url, cacheBust),
    coordinates: result.coordinates_wgs84 as IndexMapOverlayCoordinates,
    width: result.width,
    height: result.height,
    crsOriginal: result.crs_original,
    opacity,
  };
}

export function useIndexMapOverlay() {
  const [overlay, setOverlay] = useState<ActiveIndexOverlay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fitTrigger, setFitTrigger] = useState(0);

  const addToMap = useCallback(async (sceneId: string, indexKey: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getIndexMapOverlay(sceneId, indexKey);
      setOverlay((current) =>
        toActiveOverlay(
          result,
          current?.opacity ?? DEFAULT_OPACITY,
          Date.now(),
          null,
          "index",
          result.index_key,
        ),
      );
      setFitTrigger((value) => value + 1);
    } catch (err) {
      setError(
        formatApiError(
          err,
          "No se pudo agregar el índice al mapa. Generá GeoTIFF y preview primero.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const addCropToMap = useCallback(
    async (sceneId: string, indexKey: string, aoiId: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await getIndexAoiCropMapOverlay(
          sceneId,
          indexKey,
          aoiId,
        );
        setOverlay((current) =>
          toActiveOverlay(
            result,
            current?.opacity ?? DEFAULT_OPACITY,
            Date.now(),
            aoiId,
            "index",
            result.index_key,
          ),
        );
        setFitTrigger((value) => value + 1);
      } catch (err) {
        setError(
          formatApiError(
            err,
            "No se pudo agregar el recorte al mapa. Ejecutá «Recortar por AOI» primero.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const addRgbToMap = useCallback(async (sceneId: string, preset: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getRgbCompositeMapOverlay(sceneId, preset);
      setOverlay((current) =>
        toActiveOverlay(
          result,
          current?.opacity ?? DEFAULT_OPACITY,
          Date.now(),
          null,
          "rgb",
          result.preset,
        ),
      );
      setFitTrigger((value) => value + 1);
    } catch (err) {
      setError(
        formatApiError(
          err,
          "No se pudo agregar la composición al mapa. Generá el PNG primero.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const addRgbAoiToMap = useCallback(
    async (sceneId: string, aoiId: string, preset: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await getRgbAoiCompositeMapOverlay(
          sceneId,
          aoiId,
          preset,
        );
        setOverlay((current) =>
          toActiveOverlay(
            result,
            current?.opacity ?? DEFAULT_OPACITY,
            Date.now(),
            aoiId,
            "rgb",
            result.preset,
          ),
        );
        setFitTrigger((value) => value + 1);
      } catch (err) {
        setError(
          formatApiError(
            err,
            "No se pudo agregar la composición AOI al mapa. Generá el PNG primero.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const removeFromMap = useCallback(() => {
    setOverlay(null);
    setError(null);
  }, []);

  const setOpacity = useCallback((opacity: number) => {
    const clamped = Math.min(1, Math.max(0, opacity));
    setOverlay((current) =>
      current ? { ...current, opacity: clamped } : current,
    );
  }, []);

  const fitToOverlay = useCallback(() => {
    if (!overlay) {
      return;
    }
    setFitTrigger((value) => value + 1);
  }, [overlay]);

  return {
    overlay,
    loading,
    error,
    fitTrigger,
    addToMap,
    addCropToMap,
    addRgbToMap,
    addRgbAoiToMap,
    removeFromMap,
    setOpacity,
    fitToOverlay,
    clearError: () => setError(null),
  };
}
