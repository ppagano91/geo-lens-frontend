import { useEffect } from "react";
import type maplibregl from "maplibre-gl";
import type { SceneFootprintGeometry } from "../../types/scene";
import { sceneFootprintToFeatureCollection } from "../../utils/geojson";

const FOOTPRINT_SOURCE_ID = "scene-footprint";
const FILL_LAYER_ID = "scene-footprint-fill";
const LINE_LAYER_ID = "scene-footprint-line";

interface SceneFootprintLayerProps {
  map: maplibregl.Map | null;
  mapReady: boolean;
  footprint: SceneFootprintGeometry | null;
  sceneName: string | null;
}

function removeFootprintLayers(map: maplibregl.Map) {
  for (const layerId of [LINE_LAYER_ID, FILL_LAYER_ID]) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  }

  if (map.getSource(FOOTPRINT_SOURCE_ID)) {
    map.removeSource(FOOTPRINT_SOURCE_ID);
  }
}

export default function SceneFootprintLayer({
  map,
  mapReady,
  footprint,
  sceneName,
}: SceneFootprintLayerProps) {
  useEffect(() => {
    if (!map || !mapReady) {
      return;
    }

    if (!map.getSource(FOOTPRINT_SOURCE_ID)) {
      map.addSource(FOOTPRINT_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: FOOTPRINT_SOURCE_ID,
        paint: {
          "fill-color": "#38a169",
          "fill-opacity": 0.18,
        },
      });

      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: FOOTPRINT_SOURCE_ID,
        paint: {
          "line-color": "#276749",
          "line-width": 2,
          "line-dasharray": [2, 1],
        },
      });
    }

    return () => {
      removeFootprintLayers(map);
    };
  }, [map, mapReady]);

  useEffect(() => {
    if (!map || !mapReady) {
      return;
    }

    const source = map.getSource(
      FOOTPRINT_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;

    source?.setData(
      sceneFootprintToFeatureCollection(footprint, sceneName ?? undefined),
    );
  }, [map, mapReady, footprint, sceneName]);

  return null;
}
