import type { CompatibilityStatus } from "../types/indexCompatibility";
import type { RgbPresetKey } from "../types/rgbComposite";
import { RGB_PRESET_LABELS, RGB_PRESET_ROLES } from "../types/rgbComposite";
import type { SceneRead } from "../types/scene";
import type { SensorId } from "../types/sensor";
import {
  extractAvailableBandKeys,
  extractRequiredBandKeys,
} from "./indexCompatibility";
import {
  detectSensorFromScene,
  getBandMap,
  getSensorLabel,
} from "./sensors";

export interface RgbPresetCompatibilityResult {
  compatible: boolean;
  preset: RgbPresetKey;
  scene_id: string;
  sensor: SensorId;
  sensor_label: string;
  required_bands: string[];
  available_bands: string[];
  missing_bands: string[];
  matched_bands: string[];
  bands_used: { red: string; green: string; blue: string };
}

export function resolvePresetBands(
  sensor: SensorId,
  preset: RgbPresetKey,
): { red: string; green: string; blue: string } {
  const roles = RGB_PRESET_ROLES[preset];
  const bandMap = getBandMap(sensor);
  return {
    red: bandMap[roles.red] ?? roles.red,
    green: bandMap[roles.green] ?? roles.green,
    blue: bandMap[roles.blue] ?? roles.blue,
  };
}

export function evaluateRgbPresetCompatibility(
  preset: RgbPresetKey,
  sceneDetail: SceneRead,
): RgbPresetCompatibilityResult {
  const sensor = detectSensorFromScene(sceneDetail);
  const bands_used = resolvePresetBands(sensor, preset);
  const required_bands = extractRequiredBandKeys(bands_used);
  const available_bands = extractAvailableBandKeys(sceneDetail.bands);
  const availableSet = new Set(available_bands);
  const matched_bands = required_bands.filter((key) => availableSet.has(key));
  const missing_bands = required_bands.filter((key) => !availableSet.has(key));

  return {
    compatible: missing_bands.length === 0,
    preset,
    scene_id: sceneDetail.id,
    sensor,
    sensor_label: getSensorLabel(sensor),
    required_bands,
    available_bands,
    missing_bands,
    matched_bands,
    bands_used,
  };
}

export function resolveRgbCompatibilityStatus(
  preset: RgbPresetKey | null,
  sceneDetail: SceneRead | null,
): CompatibilityStatus {
  if (!preset && !sceneDetail) {
    return "missing_both";
  }
  if (!sceneDetail) {
    return "missing_scene";
  }
  if (!preset) {
    return "missing_index";
  }
  const result = evaluateRgbPresetCompatibility(preset, sceneDetail);
  return result.compatible ? "compatible" : "incompatible";
}

export function getRgbCompatibilityMessage(
  status: CompatibilityStatus,
  result: RgbPresetCompatibilityResult | null,
): string {
  switch (status) {
    case "missing_both":
    case "missing_scene":
      return "Seleccioná una escena para evaluar compatibilidad.";
    case "missing_index":
      return "Seleccioná un preset RGB para evaluar compatibilidad.";
    case "compatible":
      return result
        ? `Compatible (${result.sensor_label}): la escena contiene todas las bandas requeridas.`
        : "Compatible: la escena contiene todas las bandas requeridas.";
    case "incompatible": {
      const missing = result?.missing_bands ?? [];
      const sensorHint = result ? ` (${result.sensor_label})` : "";
      const label = result ? RGB_PRESET_LABELS[result.preset] : "este preset";
      if (missing.length === 0) {
        return `No compatible${sensorHint}: faltan bandas requeridas para ${label}.`;
      }
      return `No compatible${sensorHint}: faltan las bandas ${missing.join(", ")}.`;
    }
  }
}
