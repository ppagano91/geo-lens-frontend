import { apiRequest } from "./client";
import type { AoiCreatePayload, AoiRecord } from "../types/aoi";

export function createAoi(payload: AoiCreatePayload): Promise<AoiRecord> {
  return apiRequest<AoiRecord>("/api/v1/aois", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listAois(limit = 50, offset = 0): Promise<AoiRecord[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return apiRequest<AoiRecord[]>(`/api/v1/aois?${params.toString()}`);
}

export function getAoiById(aoiId: string): Promise<AoiRecord> {
  return apiRequest<AoiRecord>(`/api/v1/aois/${aoiId}`);
}

export function deleteAoi(aoiId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/aois/${aoiId}`, {
    method: "DELETE",
  });
}
