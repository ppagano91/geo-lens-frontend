import { ApiError } from "../api/client";
import type {
  IngestedBandInfo,
  LocalSceneIngestFormValues,
  LocalSceneIngestRequest,
  LocalSceneIngestResult,
  UploadSceneIngestRequest,
} from "../types/ingest";

const UPLOAD_ALLOWED_EXTENSIONS = new Set([".tif", ".tiff", ".txt"]);

/** CRS / tamaño de referencia (primera banda; todas deben coincidir tras validación backend). */
export interface IngestRasterSummary {
  crs: string | null;
  width: number | null;
  height: number | null;
}

export function buildLocalSceneIngestPayload(
  form: LocalSceneIngestFormValues,
): LocalSceneIngestRequest {
  const scene_path = form.scenePath.trim();
  const name = form.name.trim();

  return {
    scene_path,
    source: form.source,
    name: name.length > 0 ? name : null,
    overwrite: form.overwrite,
  };
}

export function buildUploadSceneIngestPayload(
  form: LocalSceneIngestFormValues,
): UploadSceneIngestRequest {
  const name = form.name.trim();

  return {
    files: form.files,
    source: form.source,
    name: name.length > 0 ? name : null,
    overwrite: form.overwrite,
  };
}

function fileExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx < 0) {
    return "";
  }
  return filename.slice(idx).toLowerCase();
}

export function validateLocalSceneIngestForm(
  form: LocalSceneIngestFormValues,
): string | null {
  if (form.mode === "upload") {
    if (form.files.length === 0) {
      return "Seleccioná al menos un archivo GeoTIFF (SR_B2…SR_B7).";
    }

    const invalid = form.files.filter(
      (file) => !UPLOAD_ALLOWED_EXTENSIONS.has(fileExtension(file.name)),
    );
    if (invalid.length > 0) {
      return (
        "Extensiones no permitidas: " +
        invalid.map((file) => file.name).join(", ") +
        ". Usá .tif, .tiff o .txt (MTL)."
      );
    }

    const hasGeotiff = form.files.some((file) => {
      const ext = fileExtension(file.name);
      return ext === ".tif" || ext === ".tiff";
    });
    if (!hasGeotiff) {
      return "Incluí al menos un GeoTIFF (.tif/.tiff) con las bandas SR_B*.";
    }
  } else if (!form.scenePath.trim()) {
    return "Indicá la ruta relativa de la carpeta (scene_path) bajo DATA_ROOT.";
  }

  if (!form.source) {
    return "Seleccioná un sensor / source.";
  }

  return null;
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
