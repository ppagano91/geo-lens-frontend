import type { SensorId } from "./sensor";

export interface IndexSceneCompatibilityResult {
  compatible: boolean;
  index_key: string;
  scene_id: string;
  sensor: SensorId;
  sensor_label: string;
  required_bands: string[];
  available_bands: string[];
  missing_bands: string[];
  matched_bands: string[];
}

export type CompatibilityStatus =
  | "missing_both"
  | "missing_scene"
  | "missing_index"
  | "compatible"
  | "incompatible";
