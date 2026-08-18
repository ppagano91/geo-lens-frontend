import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";
import type { IndexMapOverlayCoordinates } from "../../types/indexCompute";
import {
  INDEX_OVERLAY_LAYER_ID,
  INDEX_OVERLAY_SOURCE_ID,
  clearImageOverlay,
  replaceImageOverlay,
} from "../../utils/mapLayers";

export interface IndexOverlayLayerProps {
  map: maplibregl.Map | null;
  mapReady: boolean;
  /** Bumps after basemap `setStyle` so sources/layers are re-attached. */
  styleEpoch: number;
  /** Stable id of the active overlay; null clears the map slot. */
  overlayAssetId: string | null;
  imageUrl: string | null;
  coordinates: IndexMapOverlayCoordinates | null;
  opacity: number;
  fitTrigger: number;
  sourceId?: string;
  layerId?: string;
}

function coordinatesBounds(
  coordinates: IndexMapOverlayCoordinates,
): [[number, number], [number, number]] {
  const lngs = coordinates.map((corner) => corner[0]);
  const lats = coordinates.map((corner) => corner[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

/**
 * Fully controlled single raster overlay.
 * When ``overlayAssetId`` / image props are null, the MapLibre source/layer
 * are removed and nothing is re-inserted (including after basemap changes).
 */
export default function IndexOverlayLayer({
  map,
  mapReady,
  styleEpoch,
  overlayAssetId,
  imageUrl,
  coordinates,
  opacity,
  fitTrigger,
  sourceId = INDEX_OVERLAY_SOURCE_ID,
  layerId = INDEX_OVERLAY_LAYER_ID,
}: IndexOverlayLayerProps) {
  const lastFitTrigger = useRef(0);
  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;

  useEffect(() => {
    if (!map || !mapReady) {
      return;
    }

    const hasOverlay =
      Boolean(overlayAssetId) && Boolean(imageUrl) && Boolean(coordinates);

    if (!hasOverlay) {
      clearImageOverlay(map, sourceId, layerId);
      return;
    }

    replaceImageOverlay(map, {
      url: imageUrl!,
      coordinates: coordinates!,
      opacity: opacityRef.current,
      sourceId,
      layerId,
    });

    return () => {
      clearImageOverlay(map, sourceId, layerId);
    };
  }, [map, mapReady, styleEpoch, overlayAssetId, imageUrl, coordinates, sourceId, layerId]);

  useEffect(() => {
    if (!map || !mapReady || !map.getLayer(layerId)) {
      return;
    }

    map.setPaintProperty(layerId, "raster-opacity", opacity);
  }, [map, mapReady, styleEpoch, opacity, layerId]);

  useEffect(() => {
    if (
      !map ||
      !mapReady ||
      !coordinates ||
      !overlayAssetId ||
      fitTrigger === 0 ||
      fitTrigger === lastFitTrigger.current
    ) {
      return;
    }

    lastFitTrigger.current = fitTrigger;
    map.fitBounds(coordinatesBounds(coordinates), {
      padding: 48,
      maxZoom: 14,
      duration: 500,
    });
  }, [map, mapReady, coordinates, overlayAssetId, fitTrigger]);

  return null;
}
