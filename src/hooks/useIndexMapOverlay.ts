import { useCallback, useRef, useState } from "react";
import {
  getIndexAoiCropMapOverlay,
  getIndexMapOverlay,
} from "../api/indexComputeApi";
import {
  getRgbAoiCompositeMapOverlay,
  getRgbCompositeMapOverlay,
} from "../api/rgbCompositeApi";
import { ApiError } from "../api/client";
import { API_BASE_URL } from "../config/env";
import type { DerivedAssetRead } from "../types/derivedAsset";
import type {
  IndexAoiCropMapOverlayResult,
  IndexMapOverlayCoordinates,
  IndexMapOverlayResult,
} from "../types/indexCompute";
import type {
  RgbCompositeAoiMapOverlayResult,
  RgbCompositeMapOverlayResult,
} from "../types/rgbComposite";

/** Derived / panel raster overlay kinds (single active slot). */
export type RasterOverlayKind =
  | "index"
  | "index_aoi_crop"
  | "rgb_composite"
  | "rgb_composite_aoi";

/**
 * Single source of truth for the map raster overlay.
 * ``assetId`` is ``DerivedAssetRead.id`` from Resultados, or a synthetic
 * ``panel:…`` id from Índices / Composiciones.
 */
export interface ActiveRasterOverlay {
  assetId: string;
  kind: RasterOverlayKind;
  sceneId: string;
  aoiId: string | null;
  productKey: string;
  imageUrl: string;
  coordinates: IndexMapOverlayCoordinates;
  width: number;
  height: number;
  crsOriginal: string;
  opacity: number;
}

/** @deprecated Prefer ActiveRasterOverlay; kept for existing panel imports. */
export type ActiveIndexOverlay = ActiveRasterOverlay;
/** @deprecated Prefer RasterOverlayKind. */
export type ActiveOverlayKind = "index" | "rgb";

const DEFAULT_OPACITY = 0.75;

export function panelRasterOverlayId(
  kind: RasterOverlayKind,
  sceneId: string,
  productKey: string,
  aoiId: string | null,
): string {
  return `panel:${kind}:${sceneId}:${productKey}:${aoiId ?? ""}`;
}

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

type OverlayApiResult =
  | IndexMapOverlayResult
  | IndexAoiCropMapOverlayResult
  | RgbCompositeMapOverlayResult
  | RgbCompositeAoiMapOverlayResult;

function buildActiveOverlay(params: {
  assetId: string;
  kind: RasterOverlayKind;
  sceneId: string;
  aoiId: string | null;
  productKey: string;
  result: OverlayApiResult;
  opacity: number;
  cacheBust: number;
}): ActiveRasterOverlay {
  return {
    assetId: params.assetId,
    kind: params.kind,
    sceneId: params.sceneId,
    aoiId: params.aoiId,
    productKey: params.productKey,
    imageUrl: toAbsoluteImageUrl(params.result.image_url, params.cacheBust),
    coordinates: params.result.coordinates_wgs84 as IndexMapOverlayCoordinates,
    width: params.result.width,
    height: params.result.height,
    crsOriginal: params.result.crs_original,
    opacity: params.opacity,
  };
}

async function fetchOverlayForDerivedAsset(
  asset: DerivedAssetRead,
): Promise<OverlayApiResult> {
  switch (asset.asset_type) {
    case "index":
      return getIndexMapOverlay(asset.scene_id, asset.product_key);
    case "index_aoi_crop":
      if (!asset.aoi_id) {
        throw new Error("El derivado AOI no tiene aoi_id.");
      }
      return getIndexAoiCropMapOverlay(
        asset.scene_id,
        asset.product_key,
        asset.aoi_id,
      );
    case "rgb_composite":
      return getRgbCompositeMapOverlay(asset.scene_id, asset.product_key);
    case "rgb_composite_aoi":
      if (!asset.aoi_id) {
        throw new Error("El derivado RGB AOI no tiene aoi_id.");
      }
      return getRgbAoiCompositeMapOverlay(
        asset.scene_id,
        asset.aoi_id,
        asset.product_key,
      );
    default:
      throw new Error(`Tipo de derivado no soportado: ${asset.asset_type}`);
  }
}

function derivedKind(asset: DerivedAssetRead): RasterOverlayKind {
  switch (asset.asset_type) {
    case "index":
    case "index_aoi_crop":
    case "rgb_composite":
    case "rgb_composite_aoi":
      return asset.asset_type;
    default:
      throw new Error(`Tipo de derivado no soportado: ${asset.asset_type}`);
  }
}

export function useIndexMapOverlay() {
  const [overlay, setOverlay] = useState<ActiveRasterOverlay | null>(null);
  const [loadingAssetId, setLoadingAssetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fitTrigger, setFitTrigger] = useState(0);

  /** Monotonic id; bumping discards any in-flight overlay response. */
  const requestIdRef = useRef(0);
  /** Opacity survives clear so the next overlay keeps the user preference. */
  const opacityRef = useRef(DEFAULT_OPACITY);

  const loading = loadingAssetId !== null;

  const clearActiveOverlay = useCallback(() => {
    requestIdRef.current += 1;
    setLoadingAssetId(null);
    setOverlay(null);
    setError(null);
  }, []);

  const beginRequest = useCallback((assetId: string): number => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoadingAssetId(assetId);
    setError(null);
    return requestId;
  }, []);

  const isStale = useCallback((requestId: number): boolean => {
    return requestId !== requestIdRef.current;
  }, []);

  const replaceActiveOverlay = useCallback(
    async (asset: DerivedAssetRead) => {
      const requestId = beginRequest(asset.id);
      // Drop previous raster immediately so A never stays while B loads.
      setOverlay(null);

      try {
        const kind = derivedKind(asset);
        const result = await fetchOverlayForDerivedAsset(asset);
        if (isStale(requestId)) {
          return;
        }

        setOverlay(
          buildActiveOverlay({
            assetId: asset.id,
            kind,
            sceneId: asset.scene_id,
            aoiId: asset.aoi_id,
            productKey: asset.product_key,
            result,
            opacity: opacityRef.current,
            cacheBust: Date.now(),
          }),
        );
        setFitTrigger((value) => value + 1);
        setLoadingAssetId(null);
      } catch (err) {
        if (isStale(requestId)) {
          return;
        }
        setLoadingAssetId(null);
        setError(
          formatApiError(
            err,
            "No se pudo agregar el producto al mapa. Verificá que el archivo exista.",
          ),
        );
      }
    },
    [beginRequest, isStale],
  );

  /**
   * Resultados: click toggles the same asset off, or replaces with another.
   * Identity is always ``asset.id`` (never product_key alone).
   */
  const toggleDerivedAsset = useCallback(
    async (asset: DerivedAssetRead) => {
      if (overlay?.assetId === asset.id || loadingAssetId === asset.id) {
        clearActiveOverlay();
        return;
      }
      await replaceActiveOverlay(asset);
    },
    [
      overlay?.assetId,
      loadingAssetId,
      clearActiveOverlay,
      replaceActiveOverlay,
    ],
  );

  const loadPanelOverlay = useCallback(
    async (params: {
      kind: RasterOverlayKind;
      sceneId: string;
      productKey: string;
      aoiId: string | null;
      fetch: () => Promise<OverlayApiResult>;
      errorFallback: string;
    }) => {
      const assetId = panelRasterOverlayId(
        params.kind,
        params.sceneId,
        params.productKey,
        params.aoiId,
      );
      const requestId = beginRequest(assetId);
      setOverlay(null);

      try {
        const result = await params.fetch();
        if (isStale(requestId)) {
          return;
        }

        setOverlay(
          buildActiveOverlay({
            assetId,
            kind: params.kind,
            sceneId: params.sceneId,
            aoiId: params.aoiId,
            productKey: params.productKey,
            result,
            opacity: opacityRef.current,
            cacheBust: Date.now(),
          }),
        );
        setFitTrigger((value) => value + 1);
        setLoadingAssetId(null);
      } catch (err) {
        if (isStale(requestId)) {
          return;
        }
        setLoadingAssetId(null);
        setError(formatApiError(err, params.errorFallback));
      }
    },
    [beginRequest, isStale],
  );

  const addToMap = useCallback(
    async (sceneId: string, indexKey: string) => {
      await loadPanelOverlay({
        kind: "index",
        sceneId,
        productKey: indexKey,
        aoiId: null,
        fetch: () => getIndexMapOverlay(sceneId, indexKey),
        errorFallback:
          "No se pudo agregar el índice al mapa. Generá GeoTIFF y preview primero.",
      });
    },
    [loadPanelOverlay],
  );

  const addCropToMap = useCallback(
    async (sceneId: string, indexKey: string, aoiId: string) => {
      await loadPanelOverlay({
        kind: "index_aoi_crop",
        sceneId,
        productKey: indexKey,
        aoiId,
        fetch: () => getIndexAoiCropMapOverlay(sceneId, indexKey, aoiId),
        errorFallback:
          "No se pudo agregar el recorte al mapa. Ejecutá «Recortar por AOI» primero.",
      });
    },
    [loadPanelOverlay],
  );

  const addRgbToMap = useCallback(
    async (sceneId: string, preset: string) => {
      await loadPanelOverlay({
        kind: "rgb_composite",
        sceneId,
        productKey: preset,
        aoiId: null,
        fetch: () => getRgbCompositeMapOverlay(sceneId, preset),
        errorFallback:
          "No se pudo agregar la composición al mapa. Generá el PNG primero.",
      });
    },
    [loadPanelOverlay],
  );

  const addRgbAoiToMap = useCallback(
    async (sceneId: string, aoiId: string, preset: string) => {
      await loadPanelOverlay({
        kind: "rgb_composite_aoi",
        sceneId,
        productKey: preset,
        aoiId,
        fetch: () => getRgbAoiCompositeMapOverlay(sceneId, aoiId, preset),
        errorFallback:
          "No se pudo agregar la composición AOI al mapa. Generá el PNG primero.",
      });
    },
    [loadPanelOverlay],
  );

  const removeFromMap = useCallback(() => {
    clearActiveOverlay();
  }, [clearActiveOverlay]);

  const setOpacity = useCallback((opacity: number) => {
    const clamped = Math.min(1, Math.max(0, opacity));
    opacityRef.current = clamped;
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
    loadingAssetId,
    error,
    fitTrigger,
    addToMap,
    addCropToMap,
    addRgbToMap,
    addRgbAoiToMap,
    toggleDerivedAsset,
    replaceActiveOverlay,
    clearActiveOverlay,
    removeFromMap,
    setOpacity,
    fitToOverlay,
    clearError: () => setError(null),
  };
}
