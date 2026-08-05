export type AoiDrawingStatus = "idle" | "drawing" | "ready";

export interface AoiPolygonGeometry {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface AoiPolygonFeature {
  type: "Feature";
  properties: {
    name: string;
  };
  geometry: AoiPolygonGeometry;
}

export interface AoiCreatePayload {
  name: string;
  description?: string;
  geometry: AoiPolygonGeometry;
  properties?: Record<string, unknown>;
}

export interface AoiRecord {
  id: string;
  name: string;
  description: string | null;
  geometry: AoiPolygonGeometry;
  properties: Record<string, unknown> | null;
  is_active?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}
