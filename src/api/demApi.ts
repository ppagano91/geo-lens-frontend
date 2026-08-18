import { apiRequest } from "./client";
import type {
  DemAssetRead,
  DemHillshadeResult,
  DemMapOverlayResult,
} from "../types/dem";

export function listDems(): Promise<DemAssetRead[]> {
  return apiRequest<DemAssetRead[]>("/api/v1/dems");
}

export function getDem(demId: string): Promise<DemAssetRead> {
  return apiRequest<DemAssetRead>(`/api/v1/dems/${demId}`);
}

export function uploadDem(file: File, name?: string): Promise<DemAssetRead> {
  const formData = new FormData();
  formData.append("file", file);
  if (name?.trim()) {
    formData.append("name", name.trim());
  }
  return apiRequest<DemAssetRead>("/api/v1/dems/upload", {
    method: "POST",
    body: formData,
  });
}

export function generateDemHillshade(
  demId: string,
): Promise<DemHillshadeResult> {
  return apiRequest<DemHillshadeResult>(`/api/v1/dems/${demId}/hillshade`, {
    method: "POST",
  });
}

export function getDemMapOverlay(
  demId: string,
): Promise<DemMapOverlayResult> {
  return apiRequest<DemMapOverlayResult>(`/api/v1/dems/${demId}/map-overlay`);
}
