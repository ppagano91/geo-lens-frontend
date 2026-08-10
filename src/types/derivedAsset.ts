export const DERIVED_ASSET_TYPES = [
  "index",
  "index_aoi_crop",
  "rgb_composite",
  "rgb_composite_aoi",
] as const;

export type DerivedAssetType = (typeof DERIVED_ASSET_TYPES)[number];

export interface DerivedAssetRead {
  id: string;
  scene_id: string;
  aoi_id: string | null;
  asset_type: string;
  product_key: string;
  asset_path: string;
  preview_path: string | null;
  georef_path: string | null;
  crs: string | null;
  width: number | null;
  height: number | null;
  nodata: string | null;
  dtype: string | null;
  stats: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export const DERIVED_ASSET_TYPE_LABELS: Record<DerivedAssetType, string> = {
  index: "Índice",
  index_aoi_crop: "Índice (AOI)",
  rgb_composite: "RGB",
  rgb_composite_aoi: "RGB (AOI)",
};

export function isDerivedAssetType(value: string): value is DerivedAssetType {
  return (DERIVED_ASSET_TYPES as readonly string[]).includes(value);
}

export function derivedAssetTypeLabel(assetType: string): string {
  if (isDerivedAssetType(assetType)) {
    return DERIVED_ASSET_TYPE_LABELS[assetType];
  }
  return assetType;
}
