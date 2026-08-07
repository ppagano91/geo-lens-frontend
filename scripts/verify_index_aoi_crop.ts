/**
 * Smoke checks for Fase 9F AOI crop helpers (no test runner).
 * Run: npx --yes tsx scripts/verify_index_aoi_crop.ts
 */
import assert from "node:assert/strict";

import { ApiError } from "../src/api/client";
import {
  buildIndexAoiCropPayload,
  formatIndexAoiCropApiError,
} from "../src/utils/indexAoiCrop";

const aoiId = "11111111-1111-1111-1111-111111111111";

const payload = buildIndexAoiCropPayload(aoiId);
assert.deepEqual(payload, {
  aoi_id: aoiId,
  overwrite: false,
  generate_preview: true,
});

const payloadOverwrite = buildIndexAoiCropPayload(aoiId, {
  overwrite: true,
  generatePreview: false,
});
assert.equal(payloadOverwrite.overwrite, true);
assert.equal(payloadOverwrite.generate_preview, false);

const err404 = formatIndexAoiCropApiError(
  new ApiError(
    "Derived GeoTIFF not found. Generate it first with compute-and-save",
    404,
  ),
);
assert.match(err404, /404/);
assert.match(err404, /Calcular y guardar/i);

const err409 = formatIndexAoiCropApiError(
  new ApiError("Cropped GeoTIFF already exists", 409),
);
assert.match(err409, /409/);
assert.match(err409, /Conflicto/);

const err422 = formatIndexAoiCropApiError(
  new ApiError("AOI does not intersect derived index", 422),
);
assert.match(err422, /422/);
assert.match(err422, /Validación/);

const cropPath = `/api/v1/scenes/scene-1/indices/ndvi/crop-by-aoi`;
assert.equal(cropPath.endsWith("crop-by-aoi"), true);

const overlayPath =
  `/api/v1/scenes/scene-1/indices/ndvi/aois/${aoiId}/map-overlay`;
assert.match(overlayPath, /\/aois\/.+\/map-overlay$/);

console.log("verify_index_aoi_crop: OK");
