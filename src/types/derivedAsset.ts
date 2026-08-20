import { isRgbPresetKey, RGB_PRESET_LABELS } from "./rgbComposite";

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

export interface DerivedAssetExistsResult {
  asset_id: string;
  asset_exists: boolean;
  preview_exists: boolean;
  georef_exists: boolean;
  missing_paths: string[];
}

export interface ListDerivedAssetsOptions {
  assetType?: string;
  productKey?: string;
  aoiId?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}

export type DerivedAoiFilter = "all" | "with_aoi" | "without_aoi";
export type DerivedActiveFilter = "active" | "inactive" | "all";

export interface DerivedAssetListFilters {
  assetType: string;
  productKey: string;
  aoiFilter: DerivedAoiFilter;
  activeFilter: DerivedActiveFilter;
}

export const DEFAULT_DERIVED_ASSET_FILTERS: DerivedAssetListFilters = {
  assetType: "",
  productKey: "",
  aoiFilter: "all",
  activeFilter: "active",
};

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

/** Readable product name for Results (RGB presets keep a Spanish label). */
export function derivedProductDisplayName(productKey: string): string {
  const key = productKey.trim().toLowerCase();
  if (isRgbPresetKey(key)) {
    return RGB_PRESET_LABELS[key];
  }
  return productKey;
}

/** Primary product file is present on disk (unknown when not checked yet). */
export function isPrimaryFilePresent(
  existence: DerivedAssetExistsResult | undefined,
): boolean | null {
  if (!existence) {
    return null;
  }
  return existence.asset_exists;
}
