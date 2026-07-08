export type JsonMetadata = Record<string, unknown> | null;

export interface BandCreate {
  band_key: string;
  band_name: string;
  description?: string | null;
  resolution?: number | string | null;
  asset_path: string;
  nodata?: string | null;
  dtype?: string | null;
  metadata?: JsonMetadata;
}

export interface BandRead {
  id: string;
  scene_id: string;
  band_key: string;
  band_name: string;
  description: string | null;
  resolution: string | null;
  asset_path: string;
  nodata: string | null;
  dtype: string | null;
  metadata: JsonMetadata;
  created_at: string;
}
