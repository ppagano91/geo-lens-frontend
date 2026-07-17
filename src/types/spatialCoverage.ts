export type CoverageStatus = "full" | "partial" | "none";

export interface SpatialCoverageResult {
  aoi_id: string;
  scene_id: string;
  coverage_status: CoverageStatus;
  intersects: boolean;
  covered: boolean;
  coverage_percent: number;
  message: string;
}

export type SpatialCoverageUiStatus =
  | "idle"
  | "loading"
  | "full"
  | "partial"
  | "none"
  | "error";
