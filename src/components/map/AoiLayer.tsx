import { useEffect } from "react";
import type maplibregl from "maplibre-gl";
import type { AoiDrawingMode, AoiPolygonFeature } from "../../types/aoi";
import type { LngLat } from "../../utils/geojson";
import { buildAoiMapData, buildVerticesData } from "../../utils/geojson";
import {
  AOI_FILL_LAYER_ID,
  AOI_LINE_LAYER_ID,
  AOI_POLYGON_SOURCE_ID,
  AOI_VERTICES_LAYER_ID,
  AOI_VERTICES_SOURCE_ID,
  addAppLayer,
  ensureAppLayersOrder,
  removeLayerIfExists,
  removeSourceIfExists,
} from "../../utils/mapLayers";

interface AoiLayerProps {
  map: maplibregl.Map | null;
  mapReady: boolean;
  /** Bumps after basemap `setStyle` so sources/layers are re-attached. */
  styleEpoch: number;
  isDrawing: boolean;
  drawingMode?: AoiDrawingMode;
  draftVertices: LngLat[];
  completedAoi: AoiPolygonFeature | null;
}

function removeAoiLayers(map: maplibregl.Map) {
  for (const layerId of [
    AOI_VERTICES_LAYER_ID,
    AOI_LINE_LAYER_ID,
    AOI_FILL_LAYER_ID,
  ]) {
    removeLayerIfExists(map, layerId);
  }

  for (const sourceId of [AOI_VERTICES_SOURCE_ID, AOI_POLYGON_SOURCE_ID]) {
    removeSourceIfExists(map, sourceId);
  }
}

export default function AoiLayer({
  map,
  mapReady,
  styleEpoch,
  isDrawing,
  drawingMode = "polygon",
  draftVertices,
  completedAoi,
}: AoiLayerProps) {
  useEffect(() => {
    if (!map || !mapReady) {
      return;
    }

    if (!map.getSource(AOI_POLYGON_SOURCE_ID)) {
      map.addSource(AOI_POLYGON_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    addAppLayer(map, {
      id: AOI_FILL_LAYER_ID,
      type: "fill",
      source: AOI_POLYGON_SOURCE_ID,
      filter: ["==", "$type", "Polygon"],
      paint: {
        "fill-color": "#3182ce",
        "fill-opacity": 0.25,
      },
    });

    addAppLayer(map, {
      id: AOI_LINE_LAYER_ID,
      type: "line",
      source: AOI_POLYGON_SOURCE_ID,
      paint: {
        "line-color": "#2c5282",
        "line-width": 2,
      },
    });

    if (!map.getSource(AOI_VERTICES_SOURCE_ID)) {
      map.addSource(AOI_VERTICES_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    addAppLayer(map, {
      id: AOI_VERTICES_LAYER_ID,
      type: "circle",
      source: AOI_VERTICES_SOURCE_ID,
      paint: {
        "circle-radius": 5,
        "circle-color": "#e53e3e",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    ensureAppLayersOrder(map);

    return () => {
      removeAoiLayers(map);
    };
  }, [map, mapReady, styleEpoch]);

  useEffect(() => {
    if (!map || !mapReady) {
      return;
    }

    const polygonSource = map.getSource(
      AOI_POLYGON_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;
    const verticesSource = map.getSource(
      AOI_VERTICES_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;

    polygonSource?.setData(
      buildAoiMapData(draftVertices, completedAoi, isDrawing, drawingMode),
    );
    verticesSource?.setData(
      buildVerticesData(draftVertices, completedAoi, isDrawing, drawingMode),
    );
  }, [
    map,
    mapReady,
    styleEpoch,
    draftVertices,
    completedAoi,
    isDrawing,
    drawingMode,
  ]);

  return null;
}
