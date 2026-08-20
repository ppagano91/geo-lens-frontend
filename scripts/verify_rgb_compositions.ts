/**
 * Smoke checks for v0.1-P6 RGB composition presets.
 * Run: npx --yes tsx scripts/verify_rgb_compositions.ts
 */
import assert from "node:assert/strict";

import { derivedProductDisplayName } from "../src/types/derivedAsset";
import {
  RGB_PRESET_DESCRIPTIONS,
  RGB_PRESET_GROUPS,
  RGB_PRESET_KEYS,
  RGB_PRESET_LABELS,
  RGB_PRESET_ROLES,
  isRgbPresetKey,
  rgbPresetDisplayName,
} from "../src/types/rgbComposite";
import {
  getLayerLegendSpec,
  overlayProductName,
} from "../src/utils/mapInspector";
import {
  evaluateRgbPresetCompatibility,
  resolvePresetBands,
} from "../src/utils/rgbCompatibility";
import type { SceneRead } from "../src/types/scene";

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

function bandsFromKeys(keys: string[]) {
  return keys.map((band_key) => ({
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
  }));
}

const groupedKeys = RGB_PRESET_GROUPS.flatMap((group) => [...group.keys]);
assert.deepEqual(
  [...groupedKeys].sort(),
  [...RGB_PRESET_KEYS].sort(),
  "groups must include every preset exactly once in union",
);
assert.equal(
  new Set(groupedKeys).size,
  RGB_PRESET_KEYS.length,
  "groups must not duplicate presets",
);

for (const key of [
  "agriculture",
  "geology",
  "burn_scar",
  "water_land",
  "atmospheric_penetration",
] as const) {
  assert.equal(isRgbPresetKey(key), true);
  assert.ok(RGB_PRESET_LABELS[key].length > 0);
  assert.ok(RGB_PRESET_DESCRIPTIONS[key].length > 0);
}

assert.equal(RGB_PRESET_LABELS.agriculture, "Agricultura / vegetación");
assert.equal(RGB_PRESET_LABELS.geology, "Geología / SWIR");
assert.equal(RGB_PRESET_LABELS.burn_scar, "Área quemada / burn scar");
assert.equal(RGB_PRESET_LABELS.water_land, "Agua / tierra");
assert.equal(
  RGB_PRESET_LABELS.atmospheric_penetration,
  "SWIR / penetración atmosférica",
);

assert.deepEqual(RGB_PRESET_ROLES.agriculture, {
  red: "swir1",
  green: "nir",
  blue: "blue",
});
assert.deepEqual(RGB_PRESET_ROLES.geology, {
  red: "swir2",
  green: "swir1",
  blue: "blue",
});
assert.deepEqual(RGB_PRESET_ROLES.burn_scar, {
  red: "swir2",
  green: "nir",
  blue: "red",
});
assert.deepEqual(RGB_PRESET_ROLES.water_land, {
  red: "nir",
  green: "green",
  blue: "blue",
});
assert.deepEqual(RGB_PRESET_ROLES.atmospheric_penetration, {
  red: "swir2",
  green: "swir1",
  blue: "nir",
});

const s2Full = fakeScene({
  source: "sentinel-2",
  metadata: { platform: "Sentinel-2" },
  bands: bandsFromKeys(["B02", "B03", "B04", "B08", "B11", "B12"]),
});
const s2NoSwir = fakeScene({
  source: "sentinel-2",
  metadata: { platform: "Sentinel-2" },
  bands: bandsFromKeys(["B02", "B03", "B04", "B08"]),
});
const l8 = fakeScene({
  source: "landsat-8",
  metadata: { platform: "Landsat-8" },
  bands: bandsFromKeys(["SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7"]),
});

assert.deepEqual(resolvePresetBands("sentinel-2", "agriculture"), {
  red: "B11",
  green: "B08",
  blue: "B02",
});
assert.deepEqual(resolvePresetBands("landsat-8", "agriculture"), {
  red: "SR_B6",
  green: "SR_B5",
  blue: "SR_B2",
});
assert.deepEqual(resolvePresetBands("sentinel-2", "geology"), {
  red: "B12",
  green: "B11",
  blue: "B02",
});
assert.deepEqual(resolvePresetBands("landsat-8", "burn_scar"), {
  red: "SR_B7",
  green: "SR_B5",
  blue: "SR_B4",
});
assert.deepEqual(resolvePresetBands("sentinel-2", "water_land"), {
  red: "B08",
  green: "B03",
  blue: "B02",
});
assert.deepEqual(resolvePresetBands("landsat-8", "atmospheric_penetration"), {
  red: "SR_B7",
  green: "SR_B6",
  blue: "SR_B5",
});

for (const preset of RGB_PRESET_KEYS) {
  assert.equal(
    evaluateRgbPresetCompatibility(preset, s2Full).compatible,
    true,
    `${preset} should be compatible with full Sentinel-2`,
  );
  assert.equal(
    evaluateRgbPresetCompatibility(preset, l8).compatible,
    true,
    `${preset} should be compatible with Landsat 8`,
  );
}

assert.equal(
  evaluateRgbPresetCompatibility("agriculture", s2NoSwir).compatible,
  false,
);
assert.deepEqual(
  evaluateRgbPresetCompatibility("agriculture", s2NoSwir).missing_bands,
  ["B11"],
);
assert.equal(
  evaluateRgbPresetCompatibility("geology", s2NoSwir).compatible,
  false,
);
assert.equal(
  evaluateRgbPresetCompatibility("burn_scar", s2NoSwir).compatible,
  false,
);
assert.equal(
  evaluateRgbPresetCompatibility("atmospheric_penetration", s2NoSwir)
    .compatible,
  false,
);
assert.equal(
  evaluateRgbPresetCompatibility("water_land", s2NoSwir).compatible,
  true,
);
assert.equal(
  evaluateRgbPresetCompatibility("true_color", s2NoSwir).compatible,
  true,
);

assert.equal(
  overlayProductName("agriculture", "rgb_composite"),
  "Agricultura / vegetación",
);
assert.equal(
  derivedProductDisplayName("agriculture"),
  "Agricultura / vegetación",
);
assert.equal(derivedProductDisplayName("ndvi"), "ndvi");
assert.equal(rgbPresetDisplayName("burn_scar"), "Área quemada / burn scar");

const legend = getLayerLegendSpec(
  "agriculture",
  "rgb_composite",
  "R: B11 · G: B08 · B: B02",
);
assert.equal(legend.kind, "rgb");
if (legend.kind === "rgb") {
  assert.equal(legend.title, "Agricultura / vegetación");
  assert.equal(
    legend.description,
    "Resalta vegetación y cultivos combinando SWIR, NIR y azul.",
  );
  assert.equal(legend.bandsLabel, "R: B11 · G: B08 · B: B02");
}

const geologyLegend = getLayerLegendSpec("geology", "rgb_composite_aoi", null);
assert.equal(geologyLegend.kind, "rgb");
if (geologyLegend.kind === "rgb") {
  assert.equal(
    geologyLegend.description,
    "Resalta suelos expuestos, litologías y variaciones en SWIR.",
  );
}

const burnLegend = getLayerLegendSpec("burn_scar", "rgb_composite", "R: B12");
assert.equal(burnLegend.kind, "rgb");
if (burnLegend.kind === "rgb") {
  assert.equal(
    burnLegend.description,
    "Útil para visualizar áreas quemadas y vegetación afectada.",
  );
}

const waterLegend = getLayerLegendSpec("water_land", "rgb_composite", "R: B08");
assert.equal(waterLegend.kind, "rgb");
if (waterLegend.kind === "rgb") {
  assert.equal(
    waterLegend.description,
    "Contraste visual entre agua, vegetación y superficie terrestre.",
  );
}

const atmLegend = getLayerLegendSpec(
  "atmospheric_penetration",
  "rgb_composite",
  "R: B12",
);
assert.equal(atmLegend.kind, "rgb");
if (atmLegend.kind === "rgb") {
  assert.equal(
    atmLegend.description,
    "Combinación SWIR/NIR útil en zonas con neblina, humedad o suelos expuestos.",
  );
}

console.log("verify_rgb_compositions: OK");
