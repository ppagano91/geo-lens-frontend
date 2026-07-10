import type { BandRead } from "../types/band";
import type {
  CompatibilityStatus,
  IndexSceneCompatibilityResult,
} from "../types/indexCompatibility";
import type { SceneRead } from "../types/scene";
import type { SpectralIndexDefinition } from "../types/spectralIndex";

function normalizeBandKey(bandKey: string): string {
  return bandKey.trim().toUpperCase();
}

/** Unique band keys from required_bands values (role → band_key), order preserved. */
export function extractRequiredBandKeys(
  requiredBands: Record<string, string>,
): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];

  for (const bandKey of Object.values(requiredBands)) {
    const normalized = normalizeBandKey(bandKey);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    keys.push(normalized);
  }

  return keys;
}

/** Unique band_key values from scene bands, order preserved. */
export function extractAvailableBandKeys(bands: BandRead[]): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];

  for (const band of bands) {
    const normalized = normalizeBandKey(band.band_key);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    keys.push(normalized);
  }

  return keys;
}

/**
 * Compare index required_bands (values) against scene band_key metadata.
 * Does not read rasters or mutate inputs.
 */
export function evaluateIndexSceneCompatibility(
  indexDefinition: SpectralIndexDefinition,
  sceneDetail: SceneRead,
): IndexSceneCompatibilityResult {
  const required_bands = extractRequiredBandKeys(indexDefinition.required_bands);
  const available_bands = extractAvailableBandKeys(sceneDetail.bands);
  const availableSet = new Set(available_bands);

  const matched_bands = required_bands.filter((key) => availableSet.has(key));
  const missing_bands = required_bands.filter((key) => !availableSet.has(key));

  return {
    compatible: missing_bands.length === 0,
    index_key: indexDefinition.key,
    scene_id: sceneDetail.id,
    required_bands,
    available_bands,
    missing_bands,
    matched_bands,
  };
}

export function resolveCompatibilityStatus(
  indexDefinition: SpectralIndexDefinition | null,
  sceneDetail: SceneRead | null,
): CompatibilityStatus {
  if (!indexDefinition && !sceneDetail) {
    return "missing_both";
  }
  if (!sceneDetail) {
    return "missing_scene";
  }
  if (!indexDefinition) {
    return "missing_index";
  }

  const result = evaluateIndexSceneCompatibility(indexDefinition, sceneDetail);
  return result.compatible ? "compatible" : "incompatible";
}

export function getCompatibilityMessage(
  status: CompatibilityStatus,
  result: IndexSceneCompatibilityResult | null,
): string {
  switch (status) {
    case "missing_both":
      return "Seleccioná una escena y un índice para evaluar compatibilidad.";
    case "missing_scene":
      return "Seleccioná una escena para evaluar compatibilidad.";
    case "missing_index":
      return "Seleccioná un índice para evaluar compatibilidad.";
    case "compatible":
      return "Compatible: la escena contiene todas las bandas requeridas.";
    case "incompatible": {
      const missing = result?.missing_bands ?? [];
      if (missing.length === 0) {
        return "No compatible: faltan bandas requeridas.";
      }
      return `No compatible: faltan las bandas ${missing.join(", ")}.`;
    }
  }
}
