export interface DemBounds {
  left: number;
  bottom: number;
  right: number;
  top: number;
}

export interface DemAssetRead {
  id: string;
  name: string;
  asset_path: string;
  preview_path: string | null;
  crs: string;
  width: number;
  height: number;
  bounds: DemBounds;
  min_elevation: number | null;
  max_elevation: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DemHillshadeResult {
  dem_id: string;
  status: string;
  preview_path: string;
  width: number;
  height: number;
  azimuth: number;
  altitude: number;
  nodata_transparent: boolean;
}

export interface DemMapOverlayResult {
  dem_id: string;
  image_url: string;
  width: number;
  height: number;
  crs_original: string;
  bounds_original: DemBounds;
  coordinates_wgs84: [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ];
}

export function demHasHillshade(dem: DemAssetRead): boolean {
  return Boolean(dem.preview_path);
}

export function demNodataLabel(dem: DemAssetRead): string {
  const nodata = dem.metadata?.nodata;
  if (nodata === null || nodata === undefined) {
    return "—";
  }
  if (typeof nodata === "number" && Number.isFinite(nodata)) {
    return String(nodata);
  }
  return String(nodata);
}
