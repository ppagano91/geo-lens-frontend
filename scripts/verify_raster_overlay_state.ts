/**
 * Smoke checks for raster overlay selection state (Fase 9K.2).
 * Run: npx --yes tsx scripts/verify_raster_overlay_state.ts
 */
import assert from "node:assert/strict";

import { panelRasterOverlayId } from "../src/hooks/useIndexMapOverlay";

/** Minimal mirror of the request-id race guard used by useIndexMapOverlay. */
function createOverlayController() {
  let overlay: { assetId: string } | null = null;
  let loadingAssetId: string | null = null;
  let requestId = 0;

  const clear = () => {
    requestId += 1;
    loadingAssetId = null;
    overlay = null;
  };

  const begin = (assetId: string) => {
    requestId += 1;
    loadingAssetId = assetId;
    overlay = null;
    return requestId;
  };

  const apply = (id: number, assetId: string) => {
    if (id !== requestId) {
      return false;
    }
    overlay = { assetId };
    loadingAssetId = null;
    return true;
  };

  const toggle = async (
    assetId: string,
    fetchFn: () => Promise<string>,
  ) => {
    if (overlay?.assetId === assetId || loadingAssetId === assetId) {
      clear();
      return;
    }
    const id = begin(assetId);
    const resultId = await fetchFn();
    apply(id, resultId);
  };

  return {
    get overlay() {
      return overlay;
    },
    get loadingAssetId() {
      return loadingAssetId;
    },
    clear,
    toggle,
    begin,
    apply,
  };
}

const ctrl = createOverlayController();

// Select A → active A
await ctrl.toggle("asset-A", async () => "asset-A");
assert.equal(ctrl.overlay?.assetId, "asset-A");
assert.equal(ctrl.loadingAssetId, null);

// Toggle A again → clear
await ctrl.toggle("asset-A", async () => "asset-A");
assert.equal(ctrl.overlay, null);

// Select B after clear → B, never restores A
await ctrl.toggle("asset-B", async () => "asset-B");
assert.equal(ctrl.overlay?.assetId, "asset-B");

// Stale async response discarded
const staleId = ctrl.begin("asset-A");
ctrl.clear(); // user cleared / selected something else
assert.equal(ctrl.apply(staleId, "asset-A"), false);
assert.equal(ctrl.overlay, null);

// Active null means no overlay id for MapLibre
assert.equal(ctrl.overlay, null);

// panel ids are distinct for full vs AOI even with same product_key
const full = panelRasterOverlayId("index", "scene-1", "ndvi", null);
const crop = panelRasterOverlayId("index_aoi_crop", "scene-1", "ndvi", "aoi-1");
assert.notEqual(full, crop);
assert.match(full, /^panel:index:/);
assert.match(crop, /^panel:index_aoi_crop:/);

console.log("verify_raster_overlay_state: ok");
