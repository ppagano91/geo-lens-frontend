/** Tipos para POST /api/v1/ingest/local-scene y /upload-scene (Fase 9A–9D). */

export type LocalSceneSource = "landsat-8";

export type IngestMode = "local" | "upload";

export interface LocalSceneIngestRequest {
  scene_path: string;
  source: string;
  name?: string | null;
  overwrite?: boolean;
}

export interface UploadSceneIngestRequest {
  files: File[];
  source: string;
  name?: string | null;
  overwrite?: boolean;
}

export interface IngestedBandInfo {
  band_key: string;
  band_name: string;
  asset_path: string;
  width: number;
  height: number;
  crs: string | null;
  dtype: string | null;
  nodata: string | null;
}

export interface AvailableIndexInfo {
  index_key: string;
  display_name: string;
  compatible: boolean;
  missing_roles: string[];
}

export interface IngestionWarning {
  code: string;
  title: string;
  description?: string | null;
  items?: string[];
  severity?: "info" | "warning" | "error";
}

export interface LocalSceneIngestResult {
  scene_id: string;
  name: string;
  source: string;
  sensor: string;
  acquisition_date: string;
  scene_path: string;
  bands: IngestedBandInfo[];
  warnings: IngestionWarning[];
  available_indices: AvailableIndexInfo[];
  metadata: Record<string, unknown> | null;
  overwritten: boolean;
}

export interface LocalSceneIngestFormValues {
  mode: IngestMode;
  scenePath: string;
  files: File[];
  source: LocalSceneSource;
  name: string;
  overwrite: boolean;
}

export const DEFAULT_INGEST_FORM: LocalSceneIngestFormValues = {
  mode: "upload",
  scenePath: "",
  files: [],
  source: "landsat-8",
  name: "",
  overwrite: false,
};

export const LOCAL_SCENE_SOURCES: ReadonlyArray<{
  value: LocalSceneSource;
  label: string;
}> = [{ value: "landsat-8", label: "Landsat 8" }];

export const INGEST_MODES: ReadonlyArray<{
  value: IngestMode;
  label: string;
}> = [
  { value: "upload", label: "Subir archivos" },
  { value: "local", label: "Registrar carpeta existente" },
];
