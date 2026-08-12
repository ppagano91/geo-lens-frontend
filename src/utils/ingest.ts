import { ApiError } from "../api/client";
import type {
  IngestedBandInfo,
  IngestProductLevel,
  LocalSceneIngestFormValues,
  LocalSceneIngestRequest,
  LocalSceneIngestResult,
  UploadSceneIngestRequest,
} from "../types/ingest";

const UPLOAD_ALLOWED_EXTENSIONS = new Set([
  ".tif",
  ".tiff",
  ".txt",
  ".xml",
  ".safe",
]);

/** CRS / tamaño de referencia (primera banda; todas deben coincidir tras validación backend). */
export interface IngestRasterSummary {
  crs: string | null;
  width: number | null;
  height: number | null;
}

function optionalProductLevel(
  form: LocalSceneIngestFormValues,
): IngestProductLevel | null {
  if (form.source !== "sentinel-2") {
    return null;
  }
  if (!form.sentinelProductLevel) {
    return null;
  }
  return form.sentinelProductLevel;
}

function optionalSourceProductId(
  form: LocalSceneIngestFormValues,
): string | null {
  const value = form.sourceProductId.trim();
  return value.length > 0 ? value : null;
}

export function buildLocalSceneIngestPayload(
  form: LocalSceneIngestFormValues,
): LocalSceneIngestRequest {
  const scene_path = form.scenePath.trim();
  const name = form.name.trim();
  const product_level = optionalProductLevel(form);
  const source_product_id = optionalSourceProductId(form);

  return {
    scene_path,
    source: form.source,
    name: name.length > 0 ? name : null,
    overwrite: form.overwrite,
    ...(product_level ? { product_level } : {}),
    ...(source_product_id ? { source_product_id } : {}),
  };
}

export function buildUploadSceneIngestPayload(
  form: LocalSceneIngestFormValues,
): UploadSceneIngestRequest {
  const name = form.name.trim();
  const product_level = optionalProductLevel(form);
  const source_product_id = optionalSourceProductId(form);

  return {
    files: form.files,
    source: form.source,
    name: name.length > 0 ? name : null,
    overwrite: form.overwrite,
    ...(product_level ? { product_level } : {}),
    ...(source_product_id ? { source_product_id } : {}),
  };
}

function fileExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx < 0) {
    return "";
  }
  return filename.slice(idx).toLowerCase();
}

function expectedBandsHint(source: LocalSceneIngestFormValues["source"]): string {
  if (source === "sentinel-2") {
    return "B02/B03/B04/B08";
  }
  return "SR_B2…SR_B7";
}

export function validateLocalSceneIngestForm(
  form: LocalSceneIngestFormValues,
): string | null {
  if (form.mode === "upload") {
    if (form.files.length === 0) {
      return `Seleccioná al menos un archivo GeoTIFF (${expectedBandsHint(form.source)}).`;
    }

    const invalid = form.files.filter(
      (file) => !UPLOAD_ALLOWED_EXTENSIONS.has(fileExtension(file.name)),
    );
    if (invalid.length > 0) {
      return (
        "Extensiones no permitidas: " +
        invalid.map((file) => file.name).join(", ") +
        ". Usá .tif, .tiff, .txt (MTL), .xml o .safe (metadata SAFE)."
      );
    }

    const hasGeotiff = form.files.some((file) => {
      const ext = fileExtension(file.name);
      return ext === ".tif" || ext === ".tiff";
    });
    if (!hasGeotiff) {
      return `Incluí al menos un GeoTIFF (.tif/.tiff) con las bandas ${expectedBandsHint(form.source)}.`;
    }
  } else if (!form.scenePath.trim()) {
    return "Indicá la ruta relativa de la carpeta (scene_path) bajo DATA_ROOT.";
  }

  if (!form.source) {
    return "Seleccioná un sensor / source.";
  }

  return null;
}

export function isAuxiliaryMetadataFile(filename: string): boolean {
  const ext = fileExtension(filename);
  const base = filename.replace(/\\/g, "/").split("/").pop()?.toUpperCase() ?? "";
  if (ext === ".xml" || ext === ".safe") {
    return true;
  }
  if (ext === ".txt" && base.includes("MTL")) {
    return true;
  }
  return false;
}

/** True when ingest noted Sentinel SWIR 20 m detection and/or resampling. */
export function hasSentinelSwirResolutionWarning(
  result: LocalSceneIngestResult,
): boolean {
  return result.warnings.some(
    (warning) =>
      warning.code === "sentinel_swir_20m_detected" ||
      warning.code === "sentinel_swir_resampled" ||
      // Legacy 9K codes (pre-resampling skip).
      warning.code === "sentinel_swir_not_aligned" ||
      warning.code === "sentinel_swir_skipped",
  );
}

/** True when B11/B12 were resampled onto the 10 m grid (Fase 9L). */
export function hasSentinelSwirResampled(result: LocalSceneIngestResult): boolean {
  return result.warnings.some(
    (warning) => warning.code === "sentinel_swir_resampled",
  );
}

const SENTINEL_SWIR_KEYS = new Set(["B11", "B12"]);

export type SentinelSwirBandBadge =
  | {
      kind: "resampled";
      label: string;
      method: string;
      reference: string;
    }
  | {
      kind: "original";
      label: string;
    };

function readMetaString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  if (!metadata) {
    return null;
  }
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isTruthyMeta(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): boolean {
  if (!metadata) {
    return false;
  }
  return metadata[key] === true || metadata[key] === "true";
}

/** Badge info for Sentinel-2 SWIR bands in the ingest band list. */
export function getSentinelSwirBandBadge(
  band: IngestedBandInfo,
): SentinelSwirBandBadge | null {
  if (!SENTINEL_SWIR_KEYS.has(band.band_key)) {
    return null;
  }

  const meta = band.metadata ?? null;
  const resampled =
    isTruthyMeta(meta, "resampled") ||
    isTruthyMeta(meta, "aligned") ||
    band.asset_path.includes("/aligned/");

  if (resampled) {
    return {
      kind: "resampled",
      label: "Resampleada 20 m → 10 m",
      method: readMetaString(meta, "resampling_method") ?? "bilinear",
      reference: readMetaString(meta, "reference_band") ?? "B08",
    };
  }

  return {
    kind: "original",
    label: "Alineada originalmente",
  };
}

export function summarizeIngestRaster(
  bands: IngestedBandInfo[],
): IngestRasterSummary {
  const first = bands[0];
  if (!first) {
    return { crs: null, width: null, height: null };
  }

  return {
    crs: first.crs,
    width: first.width,
    height: first.height,
  };
}

export function formatIngestApiError(
  err: unknown,
  fallback = "No se pudo registrar la escena local",
): string {
  if (err instanceof ApiError) {
    if (err.status === 409) {
      return `Conflicto (409): ${err.message}`;
    }

    if (err.status === 422) {
      return `Validación (422): ${err.message}`;
    }

    return err.message;
  }

  if (err instanceof TypeError) {
    return "No se pudo conectar a la API. Verificá que el backend esté levantado.";
  }

  return fallback;
}

export function formatAcquisitionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

export function compatibleIndicesLabel(
  result: LocalSceneIngestResult,
): string {
  const compatible = result.available_indices.filter((item) => item.compatible);
  if (compatible.length === 0) {
    return "Ninguno";
  }

  return compatible.map((item) => item.display_name).join(", ");
}

export function formatSelectedFilesLabel(files: File[]): string {
  if (files.length === 0) {
    return "Ningún archivo seleccionado";
  }
  if (files.length === 1) {
    return files[0].name;
  }
  return `${files.length} archivos seleccionados`;
}
