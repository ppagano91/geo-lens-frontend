/**
 * Smoke checks for Fase 9B/9D ingest UI helpers (no test runner).
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
  buildUploadSceneIngestPayload,
  compatibleIndicesLabel,
  formatIngestApiError,
  formatSelectedFilesLabel,
  getSentinelSwirBandBadge,
  hasSentinelSwirResampled,
  hasSentinelSwirResolutionWarning,
  summarizeIngestRaster,
  validateLocalSceneIngestForm,
} from "../src/utils/ingest";

const validLocalForm: LocalSceneIngestFormValues = {
  mode: "local",
  scenePath: "  sample/scenes/landsat8_lc08_225084  ",
  files: [],
  source: "landsat-8",
  name: "  Landsat demo  ",
  overwrite: true,
};

assert.equal(validateLocalSceneIngestForm(validLocalForm), null);

const emptyPath: LocalSceneIngestFormValues = {
  ...validLocalForm,
  scenePath: "   ",
};
assert.match(
  validateLocalSceneIngestForm(emptyPath) ?? "",
  /scene_path|ruta/i,
);

const payload = buildLocalSceneIngestPayload(validLocalForm);
assert.deepEqual(payload, {
  scene_path: "sample/scenes/landsat8_lc08_225084",
  source: "landsat-8",
  name: "Landsat demo",
  overwrite: true,
});

const payloadNoName = buildLocalSceneIngestPayload({
  ...validLocalForm,
  name: "  ",
  overwrite: false,
});
assert.equal(payloadNoName.name, null);
assert.equal(payloadNoName.overwrite, false);

const fakeTif = {
  name: "SR_B4.tif",
  size: 128,
  lastModified: 1,
} as File;
const fakeTxt = {
  name: "scene_MTL.txt",
  size: 32,
  lastModified: 2,
} as File;
const fakeBad = {
  name: "notes.md",
  size: 10,
  lastModified: 3,
} as File;

const validUploadForm: LocalSceneIngestFormValues = {
  mode: "upload",
  scenePath: "",
  files: [fakeTif, fakeTxt],
  source: "landsat-8",
  name: "Upload demo",
  overwrite: false,
};

assert.equal(validateLocalSceneIngestForm(validUploadForm), null);

const emptyUpload: LocalSceneIngestFormValues = {
  ...validUploadForm,
  files: [],
};
assert.match(validateLocalSceneIngestForm(emptyUpload) ?? "", /archivo/i);

const badExtUpload: LocalSceneIngestFormValues = {
  ...validUploadForm,
  files: [fakeTif, fakeBad],
};
assert.match(validateLocalSceneIngestForm(badExtUpload) ?? "", /extensi/i);

const uploadPayload = buildUploadSceneIngestPayload(validUploadForm);
assert.equal(uploadPayload.source, "landsat-8");
assert.equal(uploadPayload.name, "Upload demo");
assert.equal(uploadPayload.overwrite, false);
assert.equal(uploadPayload.files.length, 2);

assert.equal(formatSelectedFilesLabel([]), "Ningún archivo seleccionado");
assert.equal(formatSelectedFilesLabel([fakeTif]), "SR_B4.tif");
assert.match(formatSelectedFilesLabel([fakeTif, fakeTxt]), /2 archivos/);

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
  scene_path: "uploaded/scenes/2f707fd8-c4f5-40da-92aa-6b2e7c0202c4",
  bands: [
    {
      band_key: "SR_B4",
      band_name: "Red",
      asset_path:
        "uploaded/scenes/2f707fd8-c4f5-40da-92aa-6b2e7c0202c4/SR_B4.tif",
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

const sentinelForm: LocalSceneIngestFormValues = {
  mode: "upload",
  scenePath: "",
  files: [
    {
      name: "B04.tif",
      size: 64,
      lastModified: 1,
    } as File,
  ],
  source: "sentinel-2",
  name: "S2 demo",
  overwrite: false,
};
assert.equal(validateLocalSceneIngestForm(sentinelForm), null);
assert.match(
  validateLocalSceneIngestForm({ ...sentinelForm, files: [] }) ?? "",
  /B02\/B03\/B04\/B08/,
);

const sentinelResult: LocalSceneIngestResult = {
  ...mockResult,
  source: "sentinel-2",
  sensor: "sentinel-2",
  name: "S2 demo",
  bands: [
    {
      band_key: "B04",
      band_name: "Red",
      asset_path: "uploaded/scenes/x/B04.tif",
      width: 100,
      height: 100,
      crs: "EPSG:32721",
      dtype: "uint16",
      nodata: "0",
    },
    {
      band_key: "B11",
      band_name: "SWIR1",
      asset_path: "derived/scenes/x/aligned/B11_10m.tif",
      width: 100,
      height: 100,
      crs: "EPSG:32721",
      dtype: "uint16",
      nodata: "0",
      metadata: {
        aligned: true,
        resampled: true,
        resampling_method: "bilinear",
        reference_band: "B08",
      },
    },
    {
      band_key: "B12",
      band_name: "SWIR2",
      asset_path: "uploaded/scenes/x/B12.tif",
      width: 100,
      height: 100,
      crs: "EPSG:32721",
      dtype: "uint16",
      nodata: "0",
    },
  ],
  warnings: [
    {
      code: "sentinel_swir_20m_detected",
      title: "B11/B12 a 20 m detectadas",
      description: "Se detectaron bandas SWIR a 20 m.",
      items: ["B11.tif"],
      severity: "info",
    },
    {
      code: "sentinel_swir_resampled",
      title: "Resampling SWIR 20 m → 10 m aplicado",
      description: "B11/B12 alineadas a la grilla 10 m.",
      items: ["derived/scenes/x/aligned/B11_10m.tif"],
      severity: "info",
    },
  ],
  available_indices: [
    {
      index_key: "ndvi",
      display_name: "NDVI",
      compatible: true,
      missing_roles: [],
    },
    {
      index_key: "nbr",
      display_name: "NBR",
      compatible: true,
      missing_roles: [],
    },
  ],
  metadata: { platform: "Sentinel-2" },
};
assert.equal(hasSentinelSwirResolutionWarning(sentinelResult), true);
assert.equal(hasSentinelSwirResampled(sentinelResult), true);
assert.equal(compatibleIndicesLabel(sentinelResult), "NDVI, NBR");

const b11Badge = getSentinelSwirBandBadge(sentinelResult.bands[1]!);
assert.equal(b11Badge?.kind, "resampled");
if (b11Badge?.kind === "resampled") {
  assert.equal(b11Badge.label, "Resampleada 20 m → 10 m");
  assert.equal(b11Badge.method, "bilinear");
  assert.equal(b11Badge.reference, "B08");
}
const b12Badge = getSentinelSwirBandBadge(sentinelResult.bands[2]!);
assert.equal(b12Badge?.kind, "original");
assert.equal(b12Badge?.label, "Alineada originalmente");
assert.equal(getSentinelSwirBandBadge(sentinelResult.bands[0]!), null);

console.log("verify_local_scene_ingest: ok");
