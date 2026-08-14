import type { AoiDrawingMode, AoiPolygonFeature, AoiRecord } from "../types/aoi";
import type { SceneFootprintGeometry } from "../types/scene";

export type LngLat = [number, number];

/** Minimum lng/lat span so a rectangle is not a degenerate line or point. */
export const MIN_RECTANGLE_SPAN_DEG = 1e-6;

export function rectangleRingFromCorners(a: LngLat, b: LngLat): LngLat[] {
  const minLng = Math.min(a[0], b[0]);
  const maxLng = Math.max(a[0], b[0]);
  const minLat = Math.min(a[1], b[1]);
  const maxLat = Math.max(a[1], b[1]);

  return [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat],
  ];
}

export function isValidAoiRectangle(a: LngLat, b: LngLat): boolean {
  const width = Math.abs(a[0] - b[0]);
  const height = Math.abs(a[1] - b[1]);
  return width >= MIN_RECTANGLE_SPAN_DEG && height >= MIN_RECTANGLE_SPAN_DEG;
}

export function closeRing(vertices: LngLat[]): LngLat[] {
  if (vertices.length === 0) {
    return [];
  }

  const first = vertices[0];
  const last = vertices[vertices.length - 1];

  if (first[0] === last[0] && first[1] === last[1]) {
    return [...vertices];
  }

  return [...vertices, first];
}

export function createAoiFeature(vertices: LngLat[]): AoiPolygonFeature {
  return {
    type: "Feature",
    properties: { name: "AOI local" },
    geometry: {
      type: "Polygon",
      coordinates: [closeRing(vertices)],
    },
  };
}

export function aoiRecordToFeature(aoi: AoiRecord): AoiPolygonFeature {
  return {
    type: "Feature",
    properties: { name: aoi.name },
    geometry: aoi.geometry,
  };
}

function collectLngLatsFromFootprint(
  footprint: SceneFootprintGeometry,
): LngLat[] {
  if (footprint.type === "Polygon") {
    return footprint.coordinates[0] as LngLat[];
  }

  return footprint.coordinates.flatMap((polygon) => polygon[0] as LngLat[]);
}

export function getPolygonBounds(
  aoi: AoiPolygonFeature,
): [[number, number], [number, number]] {
  return getFootprintBounds(aoi.geometry);
}

export function getFootprintBounds(
  footprint: SceneFootprintGeometry,
): [[number, number], [number, number]] {
  const coords = collectLngLatsFromFootprint(footprint);
  const lngs = coords.map((coord) => coord[0]);
  const lats = coords.map((coord) => coord[1]);

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export function footprintToPolygonFeatures(
  footprint: SceneFootprintGeometry,
  sceneName?: string,
): GeoJSON.Feature<GeoJSON.Polygon>[] {
  const properties = { name: sceneName ?? "Escena" };

  if (footprint.type === "Polygon") {
    return [
      {
        type: "Feature",
        properties,
        geometry: footprint,
      },
    ];
  }

  return footprint.coordinates.map((polygonCoords) => ({
    type: "Feature" as const,
    properties,
    geometry: {
      type: "Polygon" as const,
      coordinates: polygonCoords,
    },
  }));
}

export function sceneFootprintToFeatureCollection(
  footprint: SceneFootprintGeometry | null,
  sceneName?: string,
): GeoJSON.FeatureCollection {
  if (!footprint) {
    return { type: "FeatureCollection", features: [] };
  }

  return {
    type: "FeatureCollection",
    features: footprintToPolygonFeatures(footprint, sceneName),
  };
}

const emptyCollection = (): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: [],
});

export function buildAoiMapData(
  draftVertices: LngLat[],
  completedAoi: AoiPolygonFeature | null,
  isDrawing: boolean,
  drawingMode: AoiDrawingMode = "polygon",
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  if (completedAoi && !isDrawing) {
    features.push(completedAoi);
  }

  if (isDrawing && drawingMode === "rectangle" && draftVertices.length >= 2) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [rectangleRingFromCorners(draftVertices[0], draftVertices[1])],
      },
    });
  } else if (isDrawing && draftVertices.length >= 2) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: draftVertices,
      },
    });
  }

  return features.length > 0
    ? { type: "FeatureCollection", features }
    : emptyCollection();
}

export function buildVerticesData(
  draftVertices: LngLat[],
  completedAoi: AoiPolygonFeature | null,
  isDrawing: boolean,
  drawingMode: AoiDrawingMode = "polygon",
): GeoJSON.FeatureCollection {
  const vertices = isDrawing
    ? drawingMode === "rectangle" && draftVertices.length >= 2
      ? rectangleRingFromCorners(draftVertices[0], draftVertices[1]).slice(0, 4)
      : draftVertices
    : completedAoi
      ? (completedAoi.geometry.coordinates[0].slice(0, -1) as LngLat[])
      : [];

  const features: GeoJSON.Feature[] = vertices.map((coord) => ({
    type: "Feature",
    properties: {},
    geometry: {
      type: "Point",
      coordinates: coord,
    },
  }));

  return features.length > 0
    ? { type: "FeatureCollection", features }
    : emptyCollection();
}
