import { API_BASE_URL } from "../config/env";
import { ApiError, apiRequest } from "./client";
import type {
  RgbCompositeMapOverlayResult,
  RgbCompositePreviewRequest,
  RgbCompositePreviewResult,
} from "../types/rgbComposite";

function rgbPath(sceneId: string, suffix: string): string {
  return `/api/v1/scenes/${sceneId}/rgb-composites/${suffix}`;
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

/** Generate an RGB composite PNG from scene bands. */
export function createRgbCompositePreview(
  sceneId: string,
  body: RgbCompositePreviewRequest,
): Promise<RgbCompositePreviewResult> {
  return apiRequest<RgbCompositePreviewResult>(rgbPath(sceneId, "preview"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preset: body.preset,
      red_role: body.red_role,
      green_role: body.green_role,
      blue_role: body.blue_role,
      stretch: body.stretch ?? "percentile",
      p_min: body.p_min ?? 2,
      p_max: body.p_max ?? 98,
      overwrite: body.overwrite ?? true,
    }),
  });
}

/** Absolute URL for an existing RGB preview PNG (GET; does not generate). */
export function getRgbCompositePreviewPngUrl(
  sceneId: string,
  preset: string,
  cacheBust?: number | string,
): string {
  const path = rgbPath(sceneId, `${encodeURIComponent(preset)}/preview.png`);
  const url = `${API_BASE_URL}${path}`;

  if (cacheBust === undefined || cacheBust === null || cacheBust === "") {
    return url;
  }

  return `${url}?t=${encodeURIComponent(String(cacheBust))}`;
}

/** Metadata to paint the RGB PNG as a MapLibre image overlay. */
export function getRgbCompositeMapOverlay(
  sceneId: string,
  preset: string,
): Promise<RgbCompositeMapOverlayResult> {
  return apiRequest<RgbCompositeMapOverlayResult>(
    rgbPath(sceneId, `${encodeURIComponent(preset)}/map-overlay`),
  );
}

/**
 * Fetch an RGB composite PNG and trigger a browser download.
 */
export async function downloadRgbCompositePng(
  sceneId: string,
  preset: string,
): Promise<void> {
  const filename = `${sceneId}_${preset}.png`;
  const url = getRgbCompositePreviewPngUrl(sceneId, preset);

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
          "PNG no encontrado. Ejecutá «Generar composición» primero.";
      }
    }

    throw new ApiError(message, response.status);
  }

  const blob = await response.blob();
  triggerBrowserDownload(blob, filename);
}
