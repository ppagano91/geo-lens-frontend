import { apiRequest } from "./client";
import type {
  DerivedAssetExistsResult,
  DerivedAssetRead,
  ListDerivedAssetsOptions,
} from "../types/derivedAsset";

function sceneDerivedPath(sceneId: string): string {
  return `/api/v1/scenes/${sceneId}/derived-assets`;
}

function derivedAssetPath(assetId: string): string {
  return `/api/v1/derived-assets/${assetId}`;
}

export async function listSceneDerivedAssets(
  sceneId: string,
  options?: ListDerivedAssetsOptions,
): Promise<DerivedAssetRead[]> {
  const params = new URLSearchParams();
  if (options?.assetType) {
    params.set("asset_type", options.assetType);
  }
  if (options?.productKey) {
    params.set("product_key", options.productKey);
  }
  if (options?.aoiId) {
    params.set("aoi_id", options.aoiId);
  }
  if (options?.includeInactive) {
    params.set("include_inactive", "true");
  }
  if (options?.limit != null) {
    params.set("limit", String(options.limit));
  }
  if (options?.offset != null) {
    params.set("offset", String(options.offset));
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

export async function restoreDerivedAsset(
  assetId: string,
): Promise<DerivedAssetRead> {
  return apiRequest<DerivedAssetRead>(`${derivedAssetPath(assetId)}/restore`, {
    method: "PATCH",
  });
}

export async function checkDerivedAssetExists(
  assetId: string,
): Promise<DerivedAssetExistsResult> {
  return apiRequest<DerivedAssetExistsResult>(
    `${derivedAssetPath(assetId)}/exists`,
  );
}
