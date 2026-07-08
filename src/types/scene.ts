import type { BandCreate, BandRead } from "./band";

export type JsonMetadata = Record<string, unknown> | null;

export interface PolygonFootprint {
  type: "Polygon";
  coordinates: number[][][];
}

export interface MultiPolygonFootprint {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

export type SceneFootprintGeometry = PolygonFootprint | MultiPolygonFootprint;

export interface SceneCreate {
  name: string;
  source: string;
  acquisition_date: string;
  cloud_cover?: number | string | null;
  footprint: PolygonFootprint;
  metadata?: JsonMetadata;
  bands?: BandCreate[];
}

export interface SceneListItem {
  id: string;
  name: string;
  source: string;
  acquisition_date: string;
  cloud_cover: string | null;
  footprint: SceneFootprintGeometry;
  metadata: JsonMetadata;
  created_at: string;
  updated_at: string;
}

export interface SceneRead extends SceneListItem {
  bands: BandRead[];
}
