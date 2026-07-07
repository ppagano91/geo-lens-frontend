import { useEffect } from "react";
import type maplibregl from "maplibre-gl";
import type { AoiPolygonFeature } from "../../types/aoi";
import type { LngLat } from "../../utils/geojson";
import { buildAoiMapData, buildVerticesData } from "../../utils/geojson";

const POLYGON_SOURCE_ID = "aoi-polygon";
const VERTICES_SOURCE_ID = "aoi-vertices";
const FILL_LAYER_ID = "aoi-fill";
const LINE_LAYER_ID = "aoi-line";
const VERTICES_LAYER_ID = "aoi-vertices";

interface AoiLayerProps {
  map: maplibregl.Map | null;
  mapReady: boolean;
  isDrawing: boolean;
  draftVertices: LngLat[];
  completedAoi: AoiPolygonFeature | null;
}

function removeAoiLayers(map: maplibregl.Map) {
  for (const layerId of [VERTICES_LAYER_ID, LINE_LAYER_ID, FILL_LAYER_ID]) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  }

  for (const sourceId of [VERTICES_SOURCE_ID, POLYGON_SOURCE_ID]) {
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }
}

export default function AoiLayer({
  map,
  mapReady,
  isDrawing,
  draftVertices,
  completedAoi,
}: AoiLayerProps) {
  useEffect(() => {
    if (!map || !mapReady) {
      return;
    }

    if (!map.getSource(POLYGON_SOURCE_ID)) {
      map.addSource(POLYGON_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: POLYGON_SOURCE_ID,
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": "#3182ce",
          "fill-opacity": 0.25,
        },
      });

      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: POLYGON_SOURCE_ID,
        paint: {
          "line-color": "#2c5282",
          "line-width": 2,
        },
      });
    }

    if (!map.getSource(VERTICES_SOURCE_ID)) {
      map.addSource(VERTICES_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: VERTICES_LAYER_ID,
        type: "circle",
        source: VERTICES_SOURCE_ID,
        paint: {
          "circle-radius": 5,
          "circle-color": "#e53e3e",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }

    return () => {
      removeAoiLayers(map);
    };
  }, [map, mapReady]);

  useEffect(() => {
    if (!map || !mapReady) {
      return;
    }

    const polygonSource = map.getSource(
      POLYGON_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;
    const verticesSource = map.getSource(
      VERTICES_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;

    polygonSource?.setData(
      buildAoiMapData(draftVertices, completedAoi, isDrawing),
    );
    verticesSource?.setData(
      buildVerticesData(draftVertices, completedAoi, isDrawing),
    );
  }, [map, mapReady, draftVertices, completedAoi, isDrawing]);

  return null;
}
