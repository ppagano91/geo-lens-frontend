/** Helpers for Fase 9F AOI crop UI (status-aware API errors). */

import { ApiError } from "../api/client";
import type { IndexAoiCropRequest } from "../types/indexCompute";

export function buildIndexAoiCropPayload(
  aoiId: string,
  options?: { overwrite?: boolean; generatePreview?: boolean },
): IndexAoiCropRequest {
  return {
    aoi_id: aoiId,
    overwrite: options?.overwrite ?? false,
    generate_preview: options?.generatePreview ?? true,
  };
}

export function formatIndexAoiCropApiError(
  err: unknown,
  fallback = "No se pudo recortar el índice por AOI.",
): string {
  if (err instanceof ApiError) {
    if (err.status === 404) {
      const lower = err.message.toLowerCase();
      if (lower.includes("geotiff") || lower.includes("compute-and-save")) {
        return `No encontrado (404): ${err.message}. Primero ejecutá Calcular y guardar.`;
      }
      return `No encontrado (404): ${err.message}`;
    }
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
