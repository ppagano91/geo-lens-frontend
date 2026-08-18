/**
 * Smoke checks for experimental external raster-dem terrain (v0.1-P5.1).
 * Run: npx --yes tsx scripts/verify_external_terrain.ts
 */
import assert from "node:assert/strict";

import type maplibregl from "maplibre-gl";
import { canEnableExternalTerrain } from "../src/hooks/useExternalTerrain";
import {
  applyExternalTerrain,
  buildExternalTerrainSource,
  clearExternalTerrain,
  EXTERNAL_TERRAIN_SOURCE_ID,
  hasTerrainControl,
} from "../src/utils/externalTerrain";

type MockSource = { type: string };

function createMockMap() {
  const sources = new Map<string, MockSource>();
  const controls: unknown[] = [];
  let styleLoaded = true;
  let terrain: { source: string; exaggeration?: number } | null = null;
  const addSourceCalls: string[] = [];

  const map = {
    isStyleLoaded: () => styleLoaded,
    getSource: (id: string) => sources.get(id),
    addSource: (id: string, spec: { type: string }) => {
      if (sources.has(id)) {
        throw new Error(`Source "${id}" already exists.`);
      }
      addSourceCalls.push(id);
      sources.set(id, { type: spec.type });
    },
    removeSource: (id: string) => {
      sources.delete(id);
    },
    getLayer: () => undefined,
    getTerrain: () => terrain,
    setTerrain: (value: { source: string; exaggeration?: number } | null) => {
      terrain = value;
    },
    addControl: (control: unknown) => {
      controls.push(control);
    },
    removeControl: (control: unknown) => {
      const index = controls.indexOf(control);
      if (index >= 0) {
        controls.splice(index, 1);
      }
    },
    setStyleLoaded: (value: boolean) => {
      styleLoaded = value;
    },
  };

  return {
    map: map as unknown as maplibregl.Map,
    sources,
    controls,
    addSourceCalls,
    getTerrain: () => terrain,
  };
}

const aws = buildExternalTerrainSource("aws-terrarium");
assert.ok(aws);
assert.equal(aws.type, "raster-dem");
assert.deepEqual(aws.tiles, [
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
]);
assert.equal(aws.tileSize, 256);
assert.equal(aws.encoding, "terrarium");

assert.equal(buildExternalTerrainSource("maptiler", null), null);
assert.equal(buildExternalTerrainSource("maptiler", ""), null);
assert.equal(buildExternalTerrainSource("maptiler", "   "), null);
const maptilerUrl =
  "https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=unit-test-key";
const maptiler = buildExternalTerrainSource("maptiler", maptilerUrl);
assert.ok(maptiler);
assert.equal(maptiler.type, "raster-dem");
assert.equal(maptiler.url, maptilerUrl);
assert.equal(maptiler.encoding, "mapbox");

const demo = buildExternalTerrainSource("maplibre-demo");
assert.ok(demo);
assert.equal(
  demo.url,
  "https://demotiles.maplibre.org/terrain-tiles/tiles.json",
);

assert.equal(canEnableExternalTerrain("maptiler", false), false);
assert.equal(canEnableExternalTerrain("maptiler", true), true);
assert.equal(canEnableExternalTerrain("aws-terrarium", false), true);

const mockLibre = {
  TerrainControl: class {
    options: { source: string; exaggeration?: number };
    constructor(options: { source: string; exaggeration?: number }) {
      this.options = options;
    }
  },
} as unknown as typeof maplibregl;

assert.equal(hasTerrainControl(mockLibre), true);
assert.equal(hasTerrainControl({} as typeof maplibregl), false);

const mock = createMockMap();
let control = applyExternalTerrain(
  mock.map,
  aws,
  1.5,
  null,
  mockLibre,
);
assert.equal(mock.addSourceCalls.length, 1);
assert.equal(mock.sources.get(EXTERNAL_TERRAIN_SOURCE_ID)?.type, "raster-dem");
assert.deepEqual(mock.getTerrain(), {
  source: EXTERNAL_TERRAIN_SOURCE_ID,
  exaggeration: 1.5,
});
assert.equal(mock.controls.length, 1);
assert.ok(control);

// Idempotent replace must not throw "already exists".
control = applyExternalTerrain(mock.map, aws, 2, control, mockLibre);
assert.equal(mock.addSourceCalls.length, 2);
assert.deepEqual(mock.getTerrain(), {
  source: EXTERNAL_TERRAIN_SOURCE_ID,
  exaggeration: 2,
});
assert.equal(mock.controls.length, 1);

control = clearExternalTerrain(mock.map, control);
assert.equal(mock.getTerrain(), null);
assert.equal(mock.sources.has(EXTERNAL_TERRAIN_SOURCE_ID), false);
assert.equal(mock.controls.length, 0);
assert.equal(control, null);

console.log("verify_external_terrain: ok");
