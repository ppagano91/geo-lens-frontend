import { apiRequest } from "./client";
import type { DerivedAssetRead } from "../types/derivedAsset";

function sceneDerivedPath(sceneId: string): string {
  return `/api/v1/scenes/${sceneId}/derived-assets`;
}

function derivedAssetPath(assetId: string): string {
  return `/api/v1/derived-assets/${assetId}`;
}

export async function listSceneDerivedAssets(
  sceneId: string,
  options?: { assetType?: string },
): Promise<DerivedAssetRead[]> {
  const params = new URLSearchParams();
  if (options?.assetType) {
    params.set("asset_type", options.assetType);
  }
  const query = params.toString();
  const path = query
    ? `${sceneDerivedPath(sceneId)}?${query}`
    : sceneDerivedPath(sceneId);
  return apiRequest<DerivedAssetRead[]>(path);
}

export async function getDerivedAsset(
  assetId: string,
): Promise<DerivedAssetRead> {
  return apiRequest<DerivedAssetRead>(derivedAssetPath(assetId));
}

export async function softDeleteDerivedAsset(assetId: string): Promise<void> {
  await apiRequest<void>(derivedAssetPath(assetId), { method: "DELETE" });
}
