import { API_BASE_URL } from "../config/env";
import { ApiError, apiRequest } from "./client";
import type {
  IndexAoiCropMapOverlayResult,
  IndexAoiCropRequest,
  IndexAoiCropResult,
  IndexComputeResult,
  IndexComputeSaveResult,
  IndexMapOverlayResult,
  IndexPreviewResult,
} from "../types/indexCompute";

export type IndexDownloadKind = "tif" | "png";

function indexPath(sceneId: string, indexKey: string, suffix: string): string {
  return `/api/v1/scenes/${sceneId}/indices/${encodeURIComponent(indexKey)}/${suffix}`;
}

function indexAoiPath(
  sceneId: string,
  indexKey: string,
  aoiId: string,
  suffix: string,
): string {
  return (
    `/api/v1/scenes/${sceneId}/indices/${encodeURIComponent(indexKey)}` +
    `/aois/${aoiId}/${suffix}`
  );
}

function formatErrorDetail(detail: unknown): string {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "object" && item !== null && "msg" in item) {
          return String((item as { msg: string }).msg);
        }
        return String(item);
      })
      .join("; ");
  }

  return "Error inesperado en la API";
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function computeIndex(
  sceneId: string,
  indexKey: string,
): Promise<IndexComputeResult> {
  return apiRequest<IndexComputeResult>(indexPath(sceneId, indexKey, "compute"), {
    method: "POST",
  });
}

export function computeAndSaveIndex(
  sceneId: string,
  indexKey: string,
): Promise<IndexComputeSaveResult> {
  return apiRequest<IndexComputeSaveResult>(
    indexPath(sceneId, indexKey, "compute-and-save"),
    { method: "POST" },
  );
}

export function createIndexPreview(
  sceneId: string,
  indexKey: string,
): Promise<IndexPreviewResult> {
  return apiRequest<IndexPreviewResult>(indexPath(sceneId, indexKey, "preview"), {
    method: "POST",
  });
}

/** Metadata to paint the preview PNG as a MapLibre image overlay. */
export function getIndexMapOverlay(
  sceneId: string,
  indexKey: string,
): Promise<IndexMapOverlayResult> {
  return apiRequest<IndexMapOverlayResult>(
    indexPath(sceneId, indexKey, "map-overlay"),
  );
}

/** Crop a derived index GeoTIFF by a saved AOI. */
export function cropIndexByAoi(
  sceneId: string,
  indexKey: string,
  body: IndexAoiCropRequest,
): Promise<IndexAoiCropResult> {
  return apiRequest<IndexAoiCropResult>(
    indexPath(sceneId, indexKey, "crop-by-aoi"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aoi_id: body.aoi_id,
        overwrite: body.overwrite ?? false,
        generate_preview: body.generate_preview ?? true,
      }),
    },
  );
}

/** Metadata to paint an AOI-cropped preview PNG as a MapLibre image overlay. */
export function getIndexAoiCropMapOverlay(
  sceneId: string,
  indexKey: string,
  aoiId: string,
): Promise<IndexAoiCropMapOverlayResult> {
  return apiRequest<IndexAoiCropMapOverlayResult>(
    indexAoiPath(sceneId, indexKey, aoiId, "map-overlay"),
  );
}

/** Absolute URL for an existing preview PNG (GET; does not generate). */
export function getIndexPreviewPngUrl(
  sceneId: string,
  indexKey: string,
  cacheBust?: number | string,
): string {
  const path = indexPath(sceneId, indexKey, "preview.png");
  const url = `${API_BASE_URL}${path}`;

  if (cacheBust === undefined || cacheBust === null || cacheBust === "") {
    return url;
  }

  return `${url}?t=${encodeURIComponent(String(cacheBust))}`;
}

/** Absolute URL for downloading a derived GeoTIFF (attachment). */
export function getIndexGeotiffDownloadUrl(
  sceneId: string,
  indexKey: string,
): string {
  return `${API_BASE_URL}${indexPath(sceneId, indexKey, "download.tif")}`;
}

/** Absolute URL for downloading a preview PNG (attachment). */
export function getIndexPngDownloadUrl(
  sceneId: string,
  indexKey: string,
): string {
  return `${API_BASE_URL}${indexPath(sceneId, indexKey, "download.png")}`;
}

/**
 * Fetch a derived index file and trigger a browser download.
 * Surfaces a clear ApiError when the file is missing (404).
 */
export async function downloadIndexFile(
  sceneId: string,
  indexKey: string,
  kind: IndexDownloadKind,
): Promise<void> {
  const suffix = kind === "tif" ? "download.tif" : "download.png";
  const filename = `${sceneId}_${indexKey}.${kind}`;
  const url = `${API_BASE_URL}${indexPath(sceneId, indexKey, suffix)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new TypeError("Failed to fetch");
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const body = (await response.json()) as { detail?: unknown };
      if (body.detail !== undefined) {
        message = formatErrorDetail(body.detail);
      }
    } catch {
      if (response.status === 404) {
        message =
          kind === "tif"
            ? "GeoTIFF no encontrado. Ejecutá «Calcular y guardar» primero."
            : "PNG no encontrado. Ejecutá «Generar preview» primero.";
      }
    }

    throw new ApiError(message, response.status);
  }

  const blob = await response.blob();
  triggerBrowserDownload(blob, filename);
}

/**
 * Fetch an AOI-cropped derived index file and trigger a browser download.
 */
export async function downloadIndexAoiCropFile(
  sceneId: string,
  indexKey: string,
  aoiId: string,
  kind: IndexDownloadKind,
): Promise<void> {
  const suffix = kind === "tif" ? "download.tif" : "download.png";
  const filename = `${sceneId}_${indexKey}_${aoiId}.${kind}`;
  const url = `${API_BASE_URL}${indexAoiPath(sceneId, indexKey, aoiId, suffix)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new TypeError("Failed to fetch");
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const body = (await response.json()) as { detail?: unknown };
      if (body.detail !== undefined) {
        message = formatErrorDetail(body.detail);
      }
    } catch {
      if (response.status === 404) {
        message =
          kind === "tif"
            ? "GeoTIFF recortado no encontrado. Ejecutá «Recortar por AOI» primero."
            : "PNG recortado no encontrado. Ejecutá «Recortar por AOI» con preview.";
      }
    }

    throw new ApiError(message, response.status);
  }

  const blob = await response.blob();
  triggerBrowserDownload(blob, filename);
}
