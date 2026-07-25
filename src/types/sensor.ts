/** Canonical sensor ids aligned with backend Fase 8B (`app/raster/sensors.py`). */
export type SensorId =
  | "sentinel-2"
  | "landsat-8"
  | "synthetic-sentinel-2";

export const SENSOR_SENTINEL_2: SensorId = "sentinel-2";
export const SENSOR_LANDSAT_8: SensorId = "landsat-8";
export const SENSOR_SYNTHETIC_SENTINEL_2: SensorId = "synthetic-sentinel-2";
export const DEFAULT_SENSOR: SensorId = SENSOR_SENTINEL_2;

export const SENSOR_LABELS: Record<SensorId, string> = {
  "sentinel-2": "Sentinel-2",
  "landsat-8": "Landsat 8",
  "synthetic-sentinel-2": "Synthetic Sentinel-2",
};
