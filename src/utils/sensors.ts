/**
 * Sensor detection and role → band_key maps (Fase 8B.2).
 * Mirrors backend `app/raster/sensors.py` for UI compatibility checks.
 */

import type { JsonMetadata, SceneRead } from "../types/scene";
import type { SensorId } from "../types/sensor";
import {
  DEFAULT_SENSOR,
  SENSOR_LABELS,
  SENSOR_LANDSAT_8,
  SENSOR_SENTINEL_2,
  SENSOR_SYNTHETIC_SENTINEL_2,
} from "../types/sensor";

export const SENTINEL_2_BAND_MAP: Record<string, string> = {
  blue: "B02",
  green: "B03",
  red: "B04",
  nir: "B08",
  swir1: "B11",
  swir2: "B12",
};

export const LANDSAT_8_BAND_MAP: Record<string, string> = {
  blue: "SR_B2",
  green: "SR_B3",
  red: "SR_B4",
  nir: "SR_B5",
  swir1: "SR_B6",
  swir2: "SR_B7",
};

export const SYNTHETIC_SENTINEL_2_BAND_MAP: Record<string, string> = {
  ...SENTINEL_2_BAND_MAP,
};

export const SENSOR_BAND_MAPS: Record<SensorId, Record<string, string>> = {
  "sentinel-2": SENTINEL_2_BAND_MAP,
  "landsat-8": LANDSAT_8_BAND_MAP,
  "synthetic-sentinel-2": SYNTHETIC_SENTINEL_2_BAND_MAP,
};

const SENSOR_ALIASES: Record<string, SensorId> = {
  "sentinel-2": SENSOR_SENTINEL_2,
  sentinel2: SENSOR_SENTINEL_2,
  s2: SENSOR_SENTINEL_2,
  msi: SENSOR_SENTINEL_2,
  "landsat-8": SENSOR_LANDSAT_8,
  landsat8: SENSOR_LANDSAT_8,
  l8: SENSOR_LANDSAT_8,
  lc08: SENSOR_LANDSAT_8,
  oli: SENSOR_LANDSAT_8,
  "synthetic-sentinel-2": SENSOR_SYNTHETIC_SENTINEL_2,
  "synthetic-sentinel2": SENSOR_SYNTHETIC_SENTINEL_2,
  synthetic: SENSOR_SYNTHETIC_SENTINEL_2,
};

export function normalizeSensorToken(value: string): SensorId | null {
  let token = value.trim().toLowerCase().replace(/_/g, "-").replace(/ /g, "-");
  while (token.includes("--")) {
    token = token.replace(/--/g, "-");
  }
  token = token.replace(/^-+|-+$/g, "");
  if (!token) {
    return null;
  }
  return SENSOR_ALIASES[token] ?? null;
}

function isSyntheticMetadata(
  metadata: JsonMetadata | undefined,
  source: string | null | undefined,
): boolean {
  if (metadata && typeof metadata.type === "string") {
    if (metadata.type.trim().toLowerCase() === "synthetic") {
      return true;
    }
  }
  if (source && source.toLowerCase().includes("synthetic")) {
    return true;
  }
  return false;
}

function metadataString(
  metadata: JsonMetadata | undefined,
  key: string,
): string | null {
  if (!metadata) {
    return null;
  }
  const raw = metadata[key];
  return typeof raw === "string" && raw.trim() ? raw : null;
}

/**
 * Detect sensor from metadata.sensor / metadata.platform, then source.
 * Same priority as backend Fase 8B.
 */
export function detectSensor(
  source?: string | null,
  metadata?: JsonMetadata,
): SensorId {
  const meta = metadata ?? null;

  for (const key of ["sensor", "platform"] as const) {
    const raw = metadataString(meta, key);
    if (!raw) {
      continue;
    }
    const detected = normalizeSensorToken(raw);
    if (!detected) {
      continue;
    }
    if (
      detected === SENSOR_SENTINEL_2 &&
      isSyntheticMetadata(meta, source)
    ) {
      return SENSOR_SYNTHETIC_SENTINEL_2;
    }
    return detected;
  }

  if (source?.trim()) {
    const detected = normalizeSensorToken(source);
    if (detected) {
      return detected;
    }
  }

  if (isSyntheticMetadata(meta, source)) {
    return SENSOR_SYNTHETIC_SENTINEL_2;
  }

  return DEFAULT_SENSOR;
}

export function detectSensorFromScene(scene: SceneRead): SensorId {
  return detectSensor(scene.source, scene.metadata);
}

export function getSensorLabel(sensor: SensorId): string {
  return SENSOR_LABELS[sensor];
}

export function getBandMap(sensor: SensorId): Record<string, string> {
  return SENSOR_BAND_MAPS[sensor];
}

/** Map catalog role → band_key through the scene sensor (fallback: catalog value). */
export function resolveRequiredBandsForSensor(
  catalogRequiredBands: Record<string, string>,
  sensor: SensorId,
): Record<string, string> {
  const bandMap = getBandMap(sensor);
  const resolved: Record<string, string> = {};

  for (const [role, catalogKey] of Object.entries(catalogRequiredBands)) {
    const mapped = bandMap[role.trim().toLowerCase()];
    resolved[role] = mapped ?? catalogKey;
  }

  return resolved;
}
