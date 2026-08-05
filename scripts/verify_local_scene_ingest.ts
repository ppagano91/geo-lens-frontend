/**
 * Smoke checks for Fase 9B local scene ingest UI helpers (no test runner).
 * Run: npx --yes tsx scripts/verify_local_scene_ingest.ts
 */
import assert from "node:assert/strict";

import { ApiError } from "../src/api/client";
import type {
  LocalSceneIngestFormValues,
  LocalSceneIngestResult,
} from "../src/types/ingest";
import {
  buildLocalSceneIngestPayload,
  compatibleIndicesLabel,
  formatIngestApiError,
  summarizeIngestRaster,
  validateLocalSceneIngestForm,
} from "../src/utils/ingest";

const validForm: LocalSceneIngestFormValues = {
  scenePath: "  sample/scenes/landsat8_lc08_225084  ",
  source: "landsat-8",
  name: "  Landsat demo  ",
  overwrite: true,
};

assert.equal(validateLocalSceneIngestForm(validForm), null);

const emptyPath: LocalSceneIngestFormValues = {
  ...validForm,
  scenePath: "   ",
};
assert.match(
  validateLocalSceneIngestForm(emptyPath) ?? "",
  /scene_path|ruta/i,
);

const payload = buildLocalSceneIngestPayload(validForm);
assert.deepEqual(payload, {
  scene_path: "sample/scenes/landsat8_lc08_225084",
  source: "landsat-8",
  name: "Landsat demo",
  overwrite: true,
});

const payloadNoName = buildLocalSceneIngestPayload({
  ...validForm,
  name: "  ",
  overwrite: false,
});
assert.equal(payloadNoName.name, null);
assert.equal(payloadNoName.overwrite, false);

const conflict = formatIngestApiError(
  new ApiError(
    "Scene already ingested from 'sample/scenes/landsat8_lc08_225084' (scene_id=abc). Pass overwrite=true to replace it.",
    409,
  ),
);
assert.match(conflict, /^Conflicto \(409\):/);
assert.match(conflict, /overwrite=true/i);

const validation = formatIngestApiError(
  new ApiError("Missing required Landsat 8 band SR_B5", 422),
);
assert.match(validation, /^Validación \(422\):/);
assert.match(validation, /SR_B5/);

const network = formatIngestApiError(new TypeError("Failed to fetch"));
assert.match(network, /backend/i);

const mockResult: LocalSceneIngestResult = {
  scene_id: "2f707fd8-c4f5-40da-92aa-6b2e7c0202c4",
  name: "Landsat demo",
  source: "landsat-8",
  sensor: "landsat-8",
  acquisition_date: "2026-05-10",
  scene_path: "sample/scenes/landsat8_lc08_225084",
  bands: [
    {
      band_key: "SR_B4",
      band_name: "Red",
      asset_path: "sample/scenes/landsat8_lc08_225084/SR_B4.tif",
      width: 148,
      height: 179,
      crs: "EPSG:32621",
      dtype: "uint16",
      nodata: "0",
    },
  ],
  warnings: [],
  available_indices: [
    {
      index_key: "ndvi",
      display_name: "NDVI",
      compatible: true,
      missing_roles: [],
    },
    {
      index_key: "ndwi",
      display_name: "NDWI",
      compatible: true,
      missing_roles: [],
    },
    {
      index_key: "nbr",
      display_name: "NBR",
      compatible: false,
      missing_roles: ["swir2"],
    },
  ],
  metadata: { platform: "Landsat-8" },
  overwritten: false,
};

const raster = summarizeIngestRaster(mockResult.bands);
assert.equal(raster.crs, "EPSG:32621");
assert.equal(raster.width, 148);
assert.equal(raster.height, 179);
assert.equal(compatibleIndicesLabel(mockResult), "NDVI, NDWI");

console.log("verify_local_scene_ingest: ok");
