/** RGB composite presets and API result types (Fase 9H). */

export const RGB_PRESET_KEYS = [
  "true_color",
  "false_color_vegetation",
  "swir_urban",
  "moisture_vegetation",
] as const;

export type RgbPresetKey = (typeof RGB_PRESET_KEYS)[number];

/** Display channel → spectral role for each preset. */
export const RGB_PRESET_ROLES: Record<
  RgbPresetKey,
  { red: string; green: string; blue: string }
> = {
  true_color: { red: "red", green: "green", blue: "blue" },
  false_color_vegetation: { red: "nir", green: "red", blue: "green" },
  swir_urban: { red: "swir2", green: "swir1", blue: "red" },
  moisture_vegetation: { red: "swir1", green: "nir", blue: "red" },
};

export const RGB_PRESET_LABELS: Record<RgbPresetKey, string> = {
  true_color: "Color verdadero",
  false_color_vegetation: "Falso color vegetación",
  swir_urban: "SWIR urbano",
  moisture_vegetation: "Humedad / vegetación",
};

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

export function isRgbPresetKey(value: string): value is RgbPresetKey {
  return (RGB_PRESET_KEYS as readonly string[]).includes(
    value.trim().toLowerCase(),
  );
}
