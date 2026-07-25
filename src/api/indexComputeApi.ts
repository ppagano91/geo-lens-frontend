import { API_BASE_URL } from "../config/env";
import { apiRequest } from "./client";
import type {
  IndexComputeResult,
  IndexComputeSaveResult,
  IndexPreviewResult,
} from "../types/indexCompute";

function indexPath(sceneId: string, indexKey: string, suffix: string): string {
  return `/api/v1/scenes/${sceneId}/indices/${encodeURIComponent(indexKey)}/${suffix}`;
}

export function computeIndex(
  sceneId: string,
  indexKey: string,
): Promise<IndexComputeResult> {
  return apiRequest<IndexComputeResult>(indexPath(sceneId, indexKey, "compute"), {
    method: "POST",
  });
}

export function computeAndSaveIndex(
  sceneId: string,
  indexKey: string,
): Promise<IndexComputeSaveResult> {
  return apiRequest<IndexComputeSaveResult>(
    indexPath(sceneId, indexKey, "compute-and-save"),
    { method: "POST" },
  );
}

export function createIndexPreview(
  sceneId: string,
  indexKey: string,
): Promise<IndexPreviewResult> {
  return apiRequest<IndexPreviewResult>(indexPath(sceneId, indexKey, "preview"), {
    method: "POST",
  });
}

/** Absolute URL for an existing preview PNG (GET; does not generate). */
export function getIndexPreviewPngUrl(
  sceneId: string,
  indexKey: string,
  cacheBust?: number | string,
): string {
  const path = indexPath(sceneId, indexKey, "preview.png");
  const url = `${API_BASE_URL}${path}`;

  if (cacheBust === undefined || cacheBust === null || cacheBust === "") {
    return url;
  }

  return `${url}?t=${encodeURIComponent(String(cacheBust))}`;
}
