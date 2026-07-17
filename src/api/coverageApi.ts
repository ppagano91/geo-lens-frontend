import { apiRequest } from "./client";
import type { SpatialCoverageResult } from "../types/spatialCoverage";

export function getSpatialCoverage(
  aoiId: string,
  sceneId: string,
): Promise<SpatialCoverageResult> {
  return apiRequest<SpatialCoverageResult>(
    `/api/v1/spatial-coverage/aoi/${aoiId}/scene/${sceneId}`,
  );
}
