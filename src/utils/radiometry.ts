/** Radiometry metadata helpers (Fase 9M). */

export type ProductLevel =
  | "landsat_l1"
  | "landsat_l2"
  | "sentinel_l1c"
  | "sentinel_l2a"
  | "synthetic"
  | "unknown";

export type RadiometryType =
  | "dn"
  | "toa_reflectance"
  | "surface_reflectance"
  | "synthetic"
  | "unknown";

export interface RadiometryInfo {
  product_level: ProductLevel | string;
  radiometry_type: RadiometryType | string;
  scale_factor?: number | null;
  offset?: number | null;
  scale_applied?: boolean;
  source_product_id?: string | null;
  radiometry_source?: string | null;
  warning?: string | null;
}

const PRODUCT_LEVEL_LABELS: Record<string, string> = {
  landsat_l1: "Landsat L1",
  landsat_l2: "Landsat L2",
  sentinel_l1c: "Sentinel-2 L1C",
  sentinel_l2a: "Sentinel-2 L2A",
  synthetic: "Synthetic",
  unknown: "Unknown",
};

const RADIOMETRY_TYPE_LABELS: Record<string, string> = {
  dn: "DN",
  toa_reflectance: "TOA Reflectance",
  surface_reflectance: "Surface Reflectance",
  synthetic: "Synthetic",
  unknown: "DN / Unknown",
};

export function radiometryTypeLabel(type: string | null | undefined): string {
  if (!type) {
    return RADIOMETRY_TYPE_LABELS.unknown;
  }
  return RADIOMETRY_TYPE_LABELS[type] ?? type;
}

export function productLevelLabel(level: string | null | undefined): string {
  if (!level) {
    return PRODUCT_LEVEL_LABELS.unknown;
  }
  return PRODUCT_LEVEL_LABELS[level] ?? level;
}

export function extractRadiometryFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): RadiometryInfo | null {
  if (!metadata) {
    return null;
  }
  const nested = metadata.radiometry;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const block = nested as Record<string, unknown>;
    if (typeof block.product_level === "string") {
      return normalizeRadiometry(block);
    }
  }
  if (typeof metadata.product_level === "string") {
    return normalizeRadiometry(metadata);
  }
  return null;
}

export function normalizeRadiometry(
  value: Record<string, unknown> | RadiometryInfo,
): RadiometryInfo {
  const warning =
    (value as RadiometryInfo).warning ??
    (typeof (value as Record<string, unknown>).radiometry_warning === "string"
      ? ((value as Record<string, unknown>).radiometry_warning as string)
      : null);
  return {
    product_level: String(
      (value as RadiometryInfo).product_level ?? "unknown",
    ),
    radiometry_type: String(
      (value as RadiometryInfo).radiometry_type ?? "unknown",
    ),
    scale_factor:
      typeof (value as RadiometryInfo).scale_factor === "number"
        ? (value as RadiometryInfo).scale_factor
        : null,
    offset:
      typeof (value as RadiometryInfo).offset === "number"
        ? (value as RadiometryInfo).offset
        : null,
    scale_applied: Boolean((value as RadiometryInfo).scale_applied),
    source_product_id:
      typeof (value as RadiometryInfo).source_product_id === "string"
        ? (value as RadiometryInfo).source_product_id
        : null,
    radiometry_source:
      typeof (value as RadiometryInfo).radiometry_source === "string"
        ? (value as RadiometryInfo).radiometry_source
        : null,
    warning: warning ?? null,
  };
}

export function isUnknownRadiometry(info: RadiometryInfo | null): boolean {
  if (!info) {
    return true;
  }
  return info.radiometry_type === "unknown" || info.product_level === "unknown";
}

export const UNKNOWN_RADIOMETRY_UI_WARNING =
  "Radiometría no determinada automáticamente. Indique MSIL1C/MSIL2A manualmente o cargue metadata SAFE.";
