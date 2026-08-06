import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";
import type { IndexMapOverlayCoordinates } from "../../types/indexCompute";

const SOURCE_ID = "index-overlay";
const LAYER_ID = "index-overlay-raster";

export interface IndexOverlayLayerProps {
  map: maplibregl.Map | null;
  mapReady: boolean;
  imageUrl: string | null;
  coordinates: IndexMapOverlayCoordinates | null;
  opacity: number;
  fitTrigger: number;
}

function removeOverlay(map: maplibregl.Map) {
  if (map.getLayer(LAYER_ID)) {
    map.removeLayer(LAYER_ID);
  }
  if (map.getSource(SOURCE_ID)) {
    map.removeSource(SOURCE_ID);
  }
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

    map.addSource(SOURCE_ID, {
      type: "image",
      url: imageUrl,
      coordinates,
    });

    map.addLayer({
      id: LAYER_ID,
      type: "raster",
      source: SOURCE_ID,
      paint: {
        "raster-opacity": opacity,
        "raster-fade-duration": 0,
      },
    });

    return () => {
      removeOverlay(map);
    };
  }, [map, mapReady, imageUrl, coordinates]);

  useEffect(() => {
    if (!map || !mapReady || !map.getLayer(LAYER_ID)) {
      return;
    }

    map.setPaintProperty(LAYER_ID, "raster-opacity", opacity);
  }, [map, mapReady, opacity]);

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
