export type AoiDrawingStatus = "idle" | "drawing" | "ready";

export interface AoiPolygonFeature {
  type: "Feature";
  properties: {
    name: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
}
