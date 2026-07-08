import type { AoiPolygonFeature, AoiRecord } from "../types/aoi";

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

export function getPolygonBounds(
  aoi: AoiPolygonFeature,
): [[number, number], [number, number]] {
  const ring = aoi.geometry.coordinates[0];
  const lngs = ring.map((coord) => coord[0]);
  const lats = ring.map((coord) => coord[1]);

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
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
