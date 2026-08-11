import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";
import type { IndexMapOverlayCoordinates } from "../../types/indexCompute";
import {
  INDEX_OVERLAY_LAYER_ID,
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
      clearImageOverlay(map);
      return;
    }

    replaceImageOverlay(map, {
      url: imageUrl!,
      coordinates: coordinates!,
      opacity: opacityRef.current,
    });

    return () => {
      clearImageOverlay(map);
    };
  }, [map, mapReady, styleEpoch, overlayAssetId, imageUrl, coordinates]);

  useEffect(() => {
    if (!map || !mapReady || !map.getLayer(INDEX_OVERLAY_LAYER_ID)) {
      return;
    }

    map.setPaintProperty(INDEX_OVERLAY_LAYER_ID, "raster-opacity", opacity);
  }, [map, mapReady, styleEpoch, opacity]);

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
