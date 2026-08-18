import type { RasterDEMSourceSpecification } from "maplibre-gl";
import type maplibregl from "maplibre-gl";
import { MAPTILER_KEY } from "../config/env";
import type { ExternalTerrainProviderId } from "../types/externalTerrain";
import { removeSourceIfExists } from "./mapLayers";

export const EXTERNAL_TERRAIN_SOURCE_ID = "external-raster-dem";

const AWS_TERRARIUM_TILES = [
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
];

const MAPTILER_TERRAIN_TILEJSON =
  "https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json";

const MAPLIBRE_DEMO_TERRAIN_TILEJSON =
  "https://demotiles.maplibre.org/terrain-tiles/tiles.json";

export function buildExternalTerrainSource(
  provider: ExternalTerrainProviderId,
  maptilerKey: string = MAPTILER_KEY,
): RasterDEMSourceSpecification | null {
  switch (provider) {
    case "aws-terrarium":
      return {
        type: "raster-dem",
        tiles: AWS_TERRARIUM_TILES,
        tileSize: 256,
        encoding: "terrarium",
        maxzoom: 15,
        attribution: "AWS Terrain Tiles / Mapzen Terrarium",
      };
    case "maptiler": {
      const key = maptilerKey.trim();
      if (!key) {
        return null;
      }
      return {
        type: "raster-dem",
        url: `${MAPTILER_TERRAIN_TILEJSON}?key=${encodeURIComponent(key)}`,
        encoding: "mapbox",
      };
    }
    case "maplibre-demo":
      return {
        type: "raster-dem",
        url: MAPLIBRE_DEMO_TERRAIN_TILEJSON,
      };
    default:
      return null;
  }
}

export function hasTerrainControl(
  maplibre: typeof maplibregl,
): boolean {
  return typeof maplibre.TerrainControl === "function";
}

export function clearExternalTerrain(
  map: maplibregl.Map,
  control: maplibregl.IControl | null,
): maplibregl.IControl | null {
  try {
    if (typeof map.getTerrain === "function" && map.getTerrain()) {
      map.setTerrain(null);
    }
  } catch {
    // Style may already be unloading during a basemap change.
  }

  let remaining: maplibregl.IControl | null = control;
  if (control) {
    try {
      map.removeControl(control);
      remaining = null;
    } catch {
      remaining = null;
    }
  }

  try {
    removeSourceIfExists(map, EXTERNAL_TERRAIN_SOURCE_ID);
  } catch {
    // Source already dropped with the previous style.
  }

  return remaining;
}

export function applyExternalTerrain(
  map: maplibregl.Map,
  spec: RasterDEMSourceSpecification,
  exaggeration: number,
  control: maplibregl.IControl | null,
  maplibre: typeof maplibregl,
): maplibregl.IControl | null {
  if (!map.isStyleLoaded()) {
    return control;
  }

  try {
    if (typeof map.getTerrain === "function" && map.getTerrain()) {
      map.setTerrain(null);
    }
  } catch {
    // Ignore; we still try to replace the source.
  }

  removeSourceIfExists(map, EXTERNAL_TERRAIN_SOURCE_ID);

  if (map.getSource(EXTERNAL_TERRAIN_SOURCE_ID)) {
    return control;
  }

  map.addSource(EXTERNAL_TERRAIN_SOURCE_ID, spec);
  map.setTerrain({
    source: EXTERNAL_TERRAIN_SOURCE_ID,
    exaggeration,
  });

  if (control) {
    if ("options" in control) {
      (control as maplibregl.TerrainControl).options = {
        source: EXTERNAL_TERRAIN_SOURCE_ID,
        exaggeration,
      };
    }
    return control;
  }

  if (!hasTerrainControl(maplibre)) {
    return null;
  }

  const next = new maplibre.TerrainControl({
    source: EXTERNAL_TERRAIN_SOURCE_ID,
    exaggeration,
  });
  map.addControl(next, "top-right");
  return next;
}
