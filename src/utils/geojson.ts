import type { AoiPolygonFeature, AoiRecord } from "../types/aoi";
import type { SceneFootprintGeometry } from "../types/scene";

export type LngLat = [number, number];

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
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  if (completedAoi && !isDrawing) {
    features.push(completedAoi);
  }

  if (isDrawing && draftVertices.length >= 2) {
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
): GeoJSON.FeatureCollection {
  const vertices = isDrawing
    ? draftVertices
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
