/** Display helpers for the map inspector (v0.1-P3). No overlay generation. */

import type { RasterOverlayKind } from "../hooks/useIndexMapOverlay";
import type { AoiRecord } from "../types/aoi";
import type { DerivedAssetRead } from "../types/derivedAsset";
import {
  isRgbPresetKey,
  RGB_PRESET_LABELS,
  RGB_PRESET_ROLES,
} from "../types/rgbComposite";
import type { SceneListItem } from "../types/scene";
import {
  extractRadiometryFromMetadata,
  type RadiometryInfo,
} from "./radiometry";

export interface MapCursorPosition {
  lon: number;
  lat: number;
}

export const OVERLAY_KIND_LABELS: Record<RasterOverlayKind, string> = {
  index: "Índice",
  index_aoi_crop: "Índice por AOI",
  rgb_composite: "RGB",
  rgb_composite_aoi: "RGB por AOI",
};

export function isRgbOverlayKind(kind: RasterOverlayKind): boolean {
  return kind === "rgb_composite" || kind === "rgb_composite_aoi";
}

export function overlayKindLabel(kind: RasterOverlayKind): string {
  return OVERLAY_KIND_LABELS[kind];
}

/** Product key as shown in the inspector (NDVI, true_color, …). */
export function overlayProductKeyLabel(productKey: string): string {
  const key = productKey.trim();
  if (!key) {
    return "—";
  }
  if (isRgbPresetKey(key)) {
    return key;
  }
  return key.toUpperCase();
}

export function overlayProductName(
  productKey: string,
  kind: RasterOverlayKind,
): string {
  const key = productKey.trim().toLowerCase();
  if (isRgbOverlayKind(kind) && isRgbPresetKey(key)) {
    return RGB_PRESET_LABELS[key];
  }
  return overlayProductKeyLabel(productKey);
}

export interface OverlayInspectorContext {
  sceneName: string | null;
  aoiName: string | null;
  radiometry: RadiometryInfo | null;
  rgbBandsLabel: string | null;
}

export function findOverlayDerivedAsset(
  overlay: {
    assetId: string;
    kind: RasterOverlayKind;
    sceneId: string;
    aoiId: string | null;
    productKey: string;
  },
  assets: DerivedAssetRead[],
): DerivedAssetRead | null {
  const byId = assets.find((asset) => asset.id === overlay.assetId);
  if (byId) {
    return byId;
  }

  const key = overlay.productKey.trim().toLowerCase();
  return (
    assets.find(
      (asset) =>
        asset.is_active &&
        asset.asset_type === overlay.kind &&
        asset.product_key === key &&
        asset.scene_id === overlay.sceneId &&
        (overlay.aoiId == null
          ? asset.aoi_id == null
          : asset.aoi_id === overlay.aoiId),
    ) ?? null
  );
}

function pickBandKey(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const bandKey = (value as Record<string, unknown>).band_key;
    if (typeof bandKey === "string" && bandKey.trim()) {
      return bandKey.trim();
    }
  }
  return null;
}

/** R/G/B band keys from derived metadata, or preset roles as fallback. */
export function formatRgbBandsLabel(
  productKey: string,
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const used = metadata?.bands_used;
  const fromMeta: Partial<Record<"red" | "green" | "blue", string>> = {};
  if (used && typeof used === "object" && !Array.isArray(used)) {
    const rec = used as Record<string, unknown>;
    const red = pickBandKey(rec.red);
    const green = pickBandKey(rec.green);
    const blue = pickBandKey(rec.blue);
    if (red) {
      fromMeta.red = red;
    }
    if (green) {
      fromMeta.green = green;
    }
    if (blue) {
      fromMeta.blue = blue;
    }
  }

  const key = productKey.trim().toLowerCase();
  const roles = isRgbPresetKey(key) ? RGB_PRESET_ROLES[key] : null;
  const red = fromMeta.red ?? roles?.red ?? null;
  const green = fromMeta.green ?? roles?.green ?? null;
  const blue = fromMeta.blue ?? roles?.blue ?? null;

  if (!red && !green && !blue) {
    return null;
  }

  return [
    red ? `R: ${red}` : null,
    green ? `G: ${green}` : null,
    blue ? `B: ${blue}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function resolveOverlayInspectorContext(
  overlay: {
    assetId: string;
    kind: RasterOverlayKind;
    sceneId: string;
    aoiId: string | null;
    productKey: string;
  },
  scenes: SceneListItem[],
  aois: AoiRecord[],
  derivedAssets: DerivedAssetRead[],
): OverlayInspectorContext {
  const scene = scenes.find((item) => item.id === overlay.sceneId) ?? null;
  const aoi = overlay.aoiId
    ? (aois.find((item) => item.id === overlay.aoiId) ?? null)
    : null;
  const derived = findOverlayDerivedAsset(overlay, derivedAssets);
  const radiometry =
    extractRadiometryFromMetadata(derived?.metadata) ??
    extractRadiometryFromMetadata(scene?.metadata);

  return {
    sceneName: scene?.name ?? null,
    aoiName: overlay.aoiId ? (aoi?.name ?? overlay.aoiId.slice(0, 8)) : null,
    radiometry,
    rgbBandsLabel: isRgbOverlayKind(overlay.kind)
      ? formatRgbBandsLabel(overlay.productKey, derived?.metadata)
      : null,
  };
}

export interface IndexLegendStop {
  color: string;
  label: string;
}

export interface IndexLegendSpec {
  kind: "index";
  gradient: string;
  stops: IndexLegendStop[];
}

export interface RgbLegendSpec {
  kind: "rgb";
  title: string;
  bandsLabel: string | null;
}

export interface GenericLegendSpec {
  kind: "generic";
  gradient: string;
  stops: IndexLegendStop[];
}

export type LayerLegendSpec =
  | IndexLegendSpec
  | RgbLegendSpec
  | GenericLegendSpec;

/** Palette stops aligned with backend `app/raster/preview.py`. */
const INDEX_LEGENDS: Record<
  string,
  { gradient: string; stops: IndexLegendStop[] }
> = {
  ndvi: {
    gradient:
      "linear-gradient(to right, rgb(140, 81, 10), rgb(246, 232, 195), rgb(1, 102, 94))",
    stops: [
      { color: "rgb(140, 81, 10)", label: "Seco" },
      { color: "rgb(246, 232, 195)", label: "Medio" },
      { color: "rgb(1, 102, 94)", label: "Vegetación" },
    ],
  },
  ndwi: {
    gradient:
      "linear-gradient(to right, rgb(255, 255, 255), rgb(127, 205, 187), rgb(44, 127, 184))",
    stops: [
      { color: "rgb(255, 255, 255)", label: "Seco" },
      { color: "rgb(44, 127, 184)", label: "Agua" },
    ],
  },
  nbr: {
    gradient:
      "linear-gradient(to right, rgb(165, 0, 38), rgb(254, 224, 139), rgb(26, 152, 80))",
    stops: [
      { color: "rgb(165, 0, 38)", label: "Quemado" },
      { color: "rgb(26, 152, 80)", label: "No quemado" },
    ],
  },
  ndmi: {
    gradient:
      "linear-gradient(to right, rgb(140, 81, 10), rgb(245, 245, 245), rgb(5, 48, 97))",
    stops: [
      { color: "rgb(140, 81, 10)", label: "Seco" },
      { color: "rgb(5, 48, 97)", label: "Húmedo" },
    ],
  },
};

const GENERIC_LEGEND: GenericLegendSpec = {
  kind: "generic",
  gradient:
    "linear-gradient(to right, rgb(80, 80, 80), rgb(180, 180, 180), rgb(245, 245, 245))",
  stops: [
    { color: "rgb(80, 80, 80)", label: "Bajo" },
    { color: "rgb(245, 245, 245)", label: "Alto" },
  ],
};

export function getLayerLegendSpec(
  productKey: string,
  overlayKind: RasterOverlayKind,
  rgbBandsLabel: string | null,
): LayerLegendSpec {
  if (isRgbOverlayKind(overlayKind)) {
    return {
      kind: "rgb",
      title: "Composición RGB",
      bandsLabel: rgbBandsLabel,
    };
  }

  const key = productKey.trim().toLowerCase();
  const known = INDEX_LEGENDS[key];
  if (known) {
    return {
      kind: "index",
      gradient: known.gradient,
      stops: known.stops,
    };
  }

  return GENERIC_LEGEND;
}

export const CURSOR_COORD_DECIMALS = 6;

export function formatCoord(
  value: number,
  decimals = CURSOR_COORD_DECIMALS,
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(decimals);
}

export function formatMapZoom(zoom: number | null): string {
  if (zoom == null || !Number.isFinite(zoom)) {
    return "—";
  }
  return zoom.toFixed(1);
}

export function formatCursorLine(
  cursor: MapCursorPosition | null,
): { lat: string; lon: string } {
  if (!cursor) {
    return { lat: "—", lon: "—" };
  }
  return {
    lat: formatCoord(cursor.lat),
    lon: formatCoord(cursor.lon),
  };
}

/** Compact ``lon, lat`` pair for the map panel and clipboard. */
export function formatCompactLonLat(
  cursor: MapCursorPosition | null,
): string | null {
  if (!cursor) {
    return null;
  }
  return `${formatCoord(cursor.lon)}, ${formatCoord(cursor.lat)}`;
}
