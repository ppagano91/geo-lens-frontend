import { useEffect } from "react";
import type maplibregl from "maplibre-gl";
import type { SceneFootprintGeometry } from "../../types/scene";
import { sceneFootprintToFeatureCollection } from "../../utils/geojson";
import {
  SCENE_FOOTPRINT_FILL_LAYER_ID,
  SCENE_FOOTPRINT_LINE_LAYER_ID,
  SCENE_FOOTPRINT_SOURCE_ID,
  addAppLayer,
  ensureAppLayersOrder,
  removeLayerIfExists,
  removeSourceIfExists,
} from "../../utils/mapLayers";

interface SceneFootprintLayerProps {
  map: maplibregl.Map | null;
  mapReady: boolean;
  /** Bumps after basemap `setStyle` so sources/layers are re-attached. */
  styleEpoch: number;
  footprint: SceneFootprintGeometry | null;
  sceneName: string | null;
}

function removeFootprintLayers(map: maplibregl.Map) {
  for (const layerId of [
    SCENE_FOOTPRINT_LINE_LAYER_ID,
    SCENE_FOOTPRINT_FILL_LAYER_ID,
  ]) {
    removeLayerIfExists(map, layerId);
  }

  removeSourceIfExists(map, SCENE_FOOTPRINT_SOURCE_ID);
}

export default function SceneFootprintLayer({
  map,
  mapReady,
  styleEpoch,
  footprint,
  sceneName,
}: SceneFootprintLayerProps) {
  useEffect(() => {
    if (!map || !mapReady) {
      return;
    }

    if (!map.getSource(SCENE_FOOTPRINT_SOURCE_ID)) {
      map.addSource(SCENE_FOOTPRINT_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    addAppLayer(map, {
      id: SCENE_FOOTPRINT_FILL_LAYER_ID,
      type: "fill",
      source: SCENE_FOOTPRINT_SOURCE_ID,
      paint: {
        "fill-color": "#38a169",
        "fill-opacity": 0.18,
      },
    });

    addAppLayer(map, {
      id: SCENE_FOOTPRINT_LINE_LAYER_ID,
      type: "line",
      source: SCENE_FOOTPRINT_SOURCE_ID,
      paint: {
        "line-color": "#276749",
        "line-width": 2,
        "line-dasharray": [2, 1],
      },
    });

    ensureAppLayersOrder(map);

    return () => {
      removeFootprintLayers(map);
    };
  }, [map, mapReady, styleEpoch]);

  useEffect(() => {
    if (!map || !mapReady) {
      return;
    }

    const source = map.getSource(
      SCENE_FOOTPRINT_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;

    source?.setData(
      sceneFootprintToFeatureCollection(footprint, sceneName ?? undefined),
    );
  }, [map, mapReady, styleEpoch, footprint, sceneName]);

  return null;
}
