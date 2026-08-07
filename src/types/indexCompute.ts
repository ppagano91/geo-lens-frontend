export const COMPUTABLE_INDEX_KEYS = ["ndvi", "ndwi", "nbr", "ndmi"] as const;

export type ComputableIndexKey = (typeof COMPUTABLE_INDEX_KEYS)[number];

export interface IndexBandUsed {
  band_key: string;
  band_id: string;
}

export interface IndexRasterInfo {
  width: number;
  height: number;
  crs: string | null;
  dtype: string;
}

export interface IndexStats {
  min: number | null;
  max: number | null;
  mean: number | null;
  valid_pixels: number;
  nodata_pixels: number;
}

export interface IndexComputeResult {
  scene_id: string;
  index: string;
  status: string;
  bands_used: Record<string, IndexBandUsed>;
  raster: IndexRasterInfo;
  stats: IndexStats;
}

export interface IndexOutputInfo {
  asset_path: string;
  resolved_path: string;
  nodata: number;
}

export interface IndexComputeSaveResult extends IndexComputeResult {
  output: IndexOutputInfo;
}

export interface IndexPreviewInputInfo {
  asset_path: string;
}

export interface IndexPreviewOutputInfo {
  asset_path: string;
  resolved_path: string;
}

export interface IndexPreviewResult {
  scene_id: string;
  index: string;
  status: string;
  input: IndexPreviewInputInfo;
  output: IndexPreviewOutputInfo;
  width: number;
  height: number;
}

/** Four [lng, lat] corners: top-left, top-right, bottom-right, bottom-left. */
export type IndexMapOverlayCoordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
];

export interface IndexMapOverlayBounds {
  left: number;
  bottom: number;
  right: number;
  top: number;
}

export interface IndexMapOverlayResult {
  scene_id: string;
  index_key: string;
  image_url: string;
  width: number;
  height: number;
  crs_original: string;
  bounds_original: IndexMapOverlayBounds;
  coordinates_wgs84: IndexMapOverlayCoordinates;
}

export interface IndexAoiCropRequest {
  aoi_id: string;
  overwrite?: boolean;
  generate_preview?: boolean;
}

export interface IndexAoiCropRasterInfo {
  width: number;
  height: number;
  crs: string | null;
  dtype: string;
  nodata: number;
}

export interface IndexAoiCropOutputInfo {
  geotiff_asset_path: string;
  png_asset_path: string | null;
}

export interface IndexAoiCropResult {
  scene_id: string;
  index_key: string;
  aoi_id: string;
  status: string;
  raster: IndexAoiCropRasterInfo;
  stats: IndexStats;
  output: IndexAoiCropOutputInfo;
}

export interface IndexAoiCropMapOverlayResult {
  scene_id: string;
  index_key: string;
  aoi_id: string;
  image_url: string;
  width: number;
  height: number;
  crs_original: string;
  bounds_original: IndexMapOverlayBounds;
  coordinates_wgs84: IndexMapOverlayCoordinates;
}

export function isComputableIndexKey(key: string): key is ComputableIndexKey {
  return (COMPUTABLE_INDEX_KEYS as readonly string[]).includes(
    key.trim().toLowerCase(),
  );
}
