/**
 * Smoke checks for Fase 8B.2 sensor compatibility (no test runner in package).
 * Run: npx --yes tsx scripts/verify_sensor_compatibility.ts
 */
import assert from "node:assert/strict";

import {
  evaluateIndexSceneCompatibility,
} from "../src/utils/indexCompatibility";
import {
  detectSensor,
  resolveRequiredBandsForSensor,
} from "../src/utils/sensors";
import type { SceneRead } from "../src/types/scene";
import type { SpectralIndexDefinition } from "../src/types/spectralIndex";

function fakeIndex(
  key: string,
  required_bands: Record<string, string>,
): SpectralIndexDefinition {
  return {
    id: key,
    key,
    name: key.toUpperCase(),
    description: "",
    formula: "",
    required_bands,
    category: "vegetation",
    output_range: { min: -1, max: 1 },
    interpretation: "",
    is_active: true,
    created_at: "",
    updated_at: "",
  };
}

function fakeScene(
  partial: Pick<SceneRead, "source" | "metadata" | "bands">,
): SceneRead {
  return {
    id: "scene-1",
    name: "Test",
    acquisition_date: "2026-05-10",
    cloud_cover: null,
    footprint: { type: "Polygon", coordinates: [] },
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

const ndvi = fakeIndex("ndvi", { nir: "B08", red: "B04" });
const ndwi = fakeIndex("ndwi", { green: "B03", nir: "B08" });
const nbr = fakeIndex("nbr", { nir: "B08", swir2: "B12" });
const ndmi = fakeIndex("ndmi", { nir: "B08", swir1: "B11" });

const landsatBands = ["SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7"].map(
  (band_key) => ({
    id: band_key,
    scene_id: "scene-1",
    band_key,
    band_name: band_key,
    description: null,
    resolution: "30",
    asset_path: `x/${band_key}.tif`,
    nodata: "0",
    dtype: "uint16",
    metadata: null,
    created_at: "",
  }),
);

const sentinelBands = ["B02", "B03", "B04", "B08", "B11", "B12"].map(
  (band_key) => ({
    id: band_key,
    scene_id: "scene-1",
    band_key,
    band_name: band_key,
    description: null,
    resolution: "10",
    asset_path: `x/${band_key}.tif`,
    nodata: "0",
    dtype: "uint16",
    metadata: null,
    created_at: "",
  }),
);

assert.equal(detectSensor("landsat-8", { platform: "Landsat-8" }), "landsat-8");
assert.equal(
  detectSensor("local", { type: "synthetic", platform: "Sentinel-2" }),
  "synthetic-sentinel-2",
);

const l8Required = resolveRequiredBandsForSensor(ndvi.required_bands, "landsat-8");
assert.deepEqual(l8Required, { nir: "SR_B5", red: "SR_B4" });

const l8Scene = fakeScene({
  source: "landsat-8",
  metadata: { platform: "Landsat-8" },
  bands: landsatBands,
});

for (const index of [ndvi, ndwi, nbr, ndmi]) {
  const result = evaluateIndexSceneCompatibility(index, l8Scene);
  assert.equal(result.compatible, true, `${index.key} should be compatible`);
  assert.equal(result.sensor, "landsat-8");
  assert.equal(result.missing_bands.length, 0);
}

assert.deepEqual(
  evaluateIndexSceneCompatibility(ndvi, l8Scene).required_bands.sort(),
  ["SR_B4", "SR_B5"].sort(),
);

const s2Scene = fakeScene({
  source: "local",
  metadata: { type: "synthetic", platform: "Sentinel-2" },
  bands: sentinelBands,
});

for (const index of [ndvi, ndwi, nbr, ndmi]) {
  const result = evaluateIndexSceneCompatibility(index, s2Scene);
  assert.equal(result.compatible, true, `${index.key} synthetic ok`);
  assert.equal(result.sensor, "synthetic-sentinel-2");
}

console.log("verify_sensor_compatibility: OK");
