import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";
import type { IndexMapOverlayCoordinates } from "../../types/indexCompute";
import {
  INDEX_OVERLAY_LAYER_ID,
  INDEX_OVERLAY_SOURCE_ID,
  addAppLayer,
  ensureAppLayersOrder,
  removeLayerIfExists,
  removeSourceIfExists,
} from "../../utils/mapLayers";

export interface IndexOverlayLayerProps {
  map: maplibregl.Map | null;
  mapReady: boolean;
  /** Bumps after basemap `setStyle` so sources/layers are re-attached. */
  styleEpoch: number;
  imageUrl: string | null;
  coordinates: IndexMapOverlayCoordinates | null;
  opacity: number;
  fitTrigger: number;
}

function removeOverlay(map: maplibregl.Map) {
  removeLayerIfExists(map, INDEX_OVERLAY_LAYER_ID);
  removeSourceIfExists(map, INDEX_OVERLAY_SOURCE_ID);
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

export default function IndexOverlayLayer({
  map,
  mapReady,
  styleEpoch,
  imageUrl,
  coordinates,
  opacity,
  fitTrigger,
}: IndexOverlayLayerProps) {
  const lastFitTrigger = useRef(0);

  useEffect(() => {
    if (!map || !mapReady) {
      return;
    }

    if (!imageUrl || !coordinates) {
      removeOverlay(map);
      return;
    }

    removeOverlay(map);

    map.addSource(INDEX_OVERLAY_SOURCE_ID, {
      type: "image",
      url: imageUrl,
      coordinates,
    });

    addAppLayer(map, {
      id: INDEX_OVERLAY_LAYER_ID,
      type: "raster",
      source: INDEX_OVERLAY_SOURCE_ID,
      paint: {
        "raster-opacity": opacity,
        "raster-fade-duration": 0,
      },
    });

    ensureAppLayersOrder(map);

    return () => {
      removeOverlay(map);
    };
  }, [map, mapReady, styleEpoch, imageUrl, coordinates]);

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
  }, [map, mapReady, coordinates, fitTrigger]);

  return null;
}
