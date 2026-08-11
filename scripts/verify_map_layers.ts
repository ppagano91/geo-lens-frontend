/**
 * Smoke checks for map overlay helpers (Fase 9K.1 / 9K.2).
 * Run: npx --yes tsx scripts/verify_map_layers.ts
 */
import assert from "node:assert/strict";

import type maplibregl from "maplibre-gl";
import {
  INDEX_OVERLAY_LAYER_ID,
  INDEX_OVERLAY_SOURCE_ID,
  clearImageOverlay,
  replaceImageOverlay,
} from "../src/utils/mapLayers";

type MockSource = {
  type: string;
  url?: string;
};

function createMockMap() {
  const layers = new Map<string, unknown>();
  const sources = new Map<string, MockSource>();
  let styleLoaded = true;
  const addSourceCalls: Array<{ id: string; url: string }> = [];

  const map = {
    isStyleLoaded: () => styleLoaded,
    getStyle: () => ({ layers: [] }),
    getLayer: (id: string) => (layers.has(id) ? { id } : undefined),
    getSource: (id: string) => sources.get(id),
    addSource: (
      id: string,
      spec: { type: string; url: string; coordinates: unknown },
    ) => {
      if (sources.has(id)) {
        throw new Error(`Source "${id}" already exists.`);
      }
      addSourceCalls.push({ id, url: spec.url });
      sources.set(id, { type: spec.type, url: spec.url });
    },
    removeSource: (id: string) => {
      sources.delete(id);
    },
    addLayer: (layer: { id: string }) => {
      if (layers.has(layer.id)) {
        throw new Error(`Layer "${layer.id}" already exists.`);
      }
      layers.set(layer.id, layer);
    },
    removeLayer: (id: string) => {
      layers.delete(id);
    },
    setPaintProperty: () => undefined,
    moveLayer: () => undefined,
    setStyleLoaded: (value: boolean) => {
      styleLoaded = value;
    },
  };

  return {
    map: map as unknown as maplibregl.Map,
    layers,
    sources,
    addSourceCalls,
  };
}

const coords: [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
] = [
  [-58.5, -34.5],
  [-58.4, -34.5],
  [-58.4, -34.6],
  [-58.5, -34.6],
];

const mock = createMockMap();

replaceImageOverlay(mock.map, {
  url: "http://localhost/true_color.png?t=1",
  coordinates: coords,
  opacity: 0.8,
});
assert.equal(mock.addSourceCalls.length, 1);
assert.equal(mock.sources.has(INDEX_OVERLAY_SOURCE_ID), true);
assert.equal(mock.layers.has(INDEX_OVERLAY_LAYER_ID), true);

// Second product: remove + add (no "already exists")
replaceImageOverlay(mock.map, {
  url: "http://localhost/false_color.png?t=2",
  coordinates: coords,
  opacity: 0.8,
});
assert.equal(mock.addSourceCalls.length, 2);
assert.equal(
  mock.sources.get(INDEX_OVERLAY_SOURCE_ID)?.url,
  "http://localhost/false_color.png?t=2",
);

replaceImageOverlay(mock.map, {
  url: "http://localhost/ndvi.png?t=3",
  coordinates: coords,
});
assert.equal(mock.addSourceCalls.length, 3);

clearImageOverlay(mock.map);
assert.equal(mock.sources.has(INDEX_OVERLAY_SOURCE_ID), false);
assert.equal(mock.layers.has(INDEX_OVERLAY_LAYER_ID), false);

// clear then add is safe
replaceImageOverlay(mock.map, {
  url: "http://localhost/rgb_aoi.png?t=4",
  coordinates: coords,
});
assert.equal(mock.addSourceCalls.length, 4);

console.log("verify_map_layers: ok");
