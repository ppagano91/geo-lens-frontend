/** RGB composite presets and API result types (Fase 9H / 9M / v0.1-P6). */

import type { RadiometryInfo } from "../utils/radiometry";

export const RGB_PRESET_KEYS = [
  "true_color",
  "false_color_vegetation",
  "swir_urban",
  "moisture_vegetation",
  "agriculture",
  "geology",
  "burn_scar",
  "water_land",
  "atmospheric_penetration",
] as const;

export type RgbPresetKey = (typeof RGB_PRESET_KEYS)[number];

export interface RgbPresetRoles {
  red: string;
  green: string;
  blue: string;
}

/** Display channel → spectral role for each preset. */
export const RGB_PRESET_ROLES: Record<RgbPresetKey, RgbPresetRoles> = {
  true_color: { red: "red", green: "green", blue: "blue" },
  false_color_vegetation: { red: "nir", green: "red", blue: "green" },
  swir_urban: { red: "swir2", green: "swir1", blue: "red" },
  moisture_vegetation: { red: "swir1", green: "nir", blue: "red" },
  agriculture: { red: "swir1", green: "nir", blue: "blue" },
  geology: { red: "swir2", green: "swir1", blue: "blue" },
  burn_scar: { red: "swir2", green: "nir", blue: "red" },
  water_land: { red: "nir", green: "green", blue: "blue" },
  atmospheric_penetration: { red: "swir2", green: "swir1", blue: "nir" },
};

export const RGB_PRESET_LABELS: Record<RgbPresetKey, string> = {
  true_color: "Color verdadero",
  false_color_vegetation: "Falso color vegetación",
  swir_urban: "SWIR urbano",
  moisture_vegetation: "Humedad / vegetación",
  agriculture: "Agricultura / vegetación",
  geology: "Geología / SWIR",
  burn_scar: "Área quemada / burn scar",
  water_land: "Agua / tierra",
  atmospheric_penetration: "SWIR / penetración atmosférica",
};

/** Brief description for the selector and map legend. */
export const RGB_PRESET_DESCRIPTIONS: Record<RgbPresetKey, string> = {
  true_color: "Combinación visual en color natural (rojo, verde, azul).",
  false_color_vegetation: "Resalta vegetación sana con NIR en el canal rojo.",
  swir_urban: "Contraste urbano y suelos con SWIR.",
  moisture_vegetation: "Contraste de humedad y vegetación con SWIR y NIR.",
  agriculture:
    "Resalta vegetación y cultivos combinando SWIR, NIR y azul.",
  geology: "Resalta suelos expuestos, litologías y variaciones en SWIR.",
  burn_scar: "Útil para visualizar áreas quemadas y vegetación afectada.",
  water_land: "Contraste visual entre agua, vegetación y superficie terrestre.",
  atmospheric_penetration:
    "Combinación SWIR/NIR útil en zonas con neblina, humedad o suelos expuestos.",
};

export interface RgbPresetGroup {
  id: string;
  label: string;
  keys: readonly RgbPresetKey[];
}

export const RGB_PRESET_GROUPS: readonly RgbPresetGroup[] = [
  { id: "natural", label: "Color natural", keys: ["true_color"] },
  {
    id: "vegetation",
    label: "Vegetación",
    keys: ["false_color_vegetation", "moisture_vegetation", "agriculture"],
  },
  {
    id: "swir",
    label: "SWIR / Geología",
    keys: ["swir_urban", "geology", "atmospheric_penetration"],
  },
  { id: "water", label: "Agua", keys: ["water_land"] },
  { id: "fire", label: "Fuego / quemado", keys: ["burn_scar"] },
];

export interface RgbCompositePreviewRequest {
  preset: RgbPresetKey;
  red_role?: string;
  green_role?: string;
  blue_role?: string;
  stretch?: "percentile";
  p_min?: number;
  p_max?: number;
  overwrite?: boolean;
}

export interface RgbCompositeAoiPreviewRequest extends RgbCompositePreviewRequest {
  aoi_id: string;
}

export interface RgbCompositeOutputInfo {
  asset_path: string;
}

export interface RgbCompositePreviewResult {
  scene_id: string;
  preset: string;
  status: string;
  sensor: string;
  bands_used: Record<string, string>;
  width: number;
  height: number;
  crs: string | null;
  output: RgbCompositeOutputInfo;
  radiometry?: RadiometryInfo | null;
}

export interface RgbCompositeAoiPreviewResult extends RgbCompositePreviewResult {
  aoi_id: string;
}

export interface RgbCompositeMapOverlayBounds {
  left: number;
  bottom: number;
  right: number;
  top: number;
}

/** Four [lng, lat] corners: TL, TR, BR, BL. */
export type RgbMapOverlayCoordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
];

export interface RgbCompositeMapOverlayResult {
  scene_id: string;
  preset: string;
  image_url: string;
  width: number;
  height: number;
  crs_original: string;
  bounds_original: RgbCompositeMapOverlayBounds;
  coordinates_wgs84: RgbMapOverlayCoordinates;
}

export interface RgbCompositeAoiMapOverlayResult extends RgbCompositeMapOverlayResult {
  aoi_id: string;
}

export function isRgbPresetKey(value: string): value is RgbPresetKey {
  return (RGB_PRESET_KEYS as readonly string[]).includes(
    value.trim().toLowerCase(),
  );
}

export function rgbPresetDisplayName(value: string): string {
  const key = value.trim().toLowerCase();
  if (isRgbPresetKey(key)) {
    return RGB_PRESET_LABELS[key];
  }
  return value;
}

export function rgbPresetDescription(value: string): string | null {
  const key = value.trim().toLowerCase();
  if (isRgbPresetKey(key)) {
    return RGB_PRESET_DESCRIPTIONS[key];
  }
  return null;
}
