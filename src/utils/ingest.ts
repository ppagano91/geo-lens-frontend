import { ApiError } from "../api/client";
import type {
  IngestedBandInfo,
  LocalSceneIngestFormValues,
  LocalSceneIngestRequest,
  LocalSceneIngestResult,
} from "../types/ingest";

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

export function validateLocalSceneIngestForm(
  form: LocalSceneIngestFormValues,
): string | null {
  if (!form.scenePath.trim()) {
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
