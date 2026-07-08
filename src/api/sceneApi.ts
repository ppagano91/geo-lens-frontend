import { apiRequest } from "./client";
import type { BandRead } from "../types/band";
import type { SceneListItem, SceneRead } from "../types/scene";

export function listScenes(limit = 50, offset = 0): Promise<SceneListItem[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return apiRequest<SceneListItem[]>(`/api/v1/scenes?${params.toString()}`);
}

export function getSceneById(sceneId: string): Promise<SceneRead> {
  return apiRequest<SceneRead>(`/api/v1/scenes/${sceneId}`);
}

export function getSceneBands(sceneId: string): Promise<BandRead[]> {
  return apiRequest<BandRead[]>(`/api/v1/scenes/${sceneId}/bands`);
}

export function deleteScene(sceneId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/scenes/${sceneId}`, {
    method: "DELETE",
  });
}
