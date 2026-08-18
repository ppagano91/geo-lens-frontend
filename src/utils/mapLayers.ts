import type { LayerSpecification } from "maplibre-gl";
import type maplibregl from "maplibre-gl";

/** Source / layer IDs for app overlays (shared across map components). */
export const DEM_OVERLAY_SOURCE_ID = "dem-hillshade-overlay";
export const DEM_OVERLAY_LAYER_ID = "dem-hillshade-overlay-raster";

export const INDEX_OVERLAY_SOURCE_ID = "index-overlay";
export const INDEX_OVERLAY_LAYER_ID = "index-overlay-raster";

export const SCENE_FOOTPRINT_SOURCE_ID = "scene-footprint";
export const SCENE_FOOTPRINT_FILL_LAYER_ID = "scene-footprint-fill";
export const SCENE_FOOTPRINT_LINE_LAYER_ID = "scene-footprint-line";

export const AOI_POLYGON_SOURCE_ID = "aoi-polygon";
export const AOI_VERTICES_SOURCE_ID = "aoi-vertices";
export const AOI_FILL_LAYER_ID = "aoi-fill";
export const AOI_LINE_LAYER_ID = "aoi-line";
export const AOI_VERTICES_LAYER_ID = "aoi-vertices";

/**
 * Bottom → top among app overlays.
 * Basemap stays below; labels (first symbol) stay above when present.
 * Hillshade sits under the index/RGB product overlay.
 */
export const APP_LAYER_ORDER = [
  DEM_OVERLAY_LAYER_ID,
  INDEX_OVERLAY_LAYER_ID,
  SCENE_FOOTPRINT_FILL_LAYER_ID,
  SCENE_FOOTPRINT_LINE_LAYER_ID,
  AOI_FILL_LAYER_ID,
  AOI_LINE_LAYER_ID,
  AOI_VERTICES_LAYER_ID,
] as const;

/** First symbol/label layer id in the current style, if any. */
export function getFirstSymbolLayerId(
  map: maplibregl.Map,
): string | undefined {
  const layers = map.getStyle()?.layers;
  if (!layers) {
    return undefined;
  }

  const symbol = layers.find((layer) => layer.type === "symbol");
  return symbol?.id;
}

/**
 * Insert or move app layers so that:
 * basemap → index raster → footprints → AOIs → vertices,
 * and all of them sit below the first symbol layer when the style has labels.
 */
export function ensureAppLayersOrder(map: maplibregl.Map): void {
  if (!map.isStyleLoaded()) {
    return;
  }

  const beforeId = getFirstSymbolLayerId(map);
  const beforeExists = Boolean(beforeId && map.getLayer(beforeId));

  for (const layerId of APP_LAYER_ORDER) {
    if (!map.getLayer(layerId)) {
      continue;
    }

    if (beforeExists && beforeId) {
      map.moveLayer(layerId, beforeId);
    } else {
      map.moveLayer(layerId);
    }
  }
}

/**
 * After `map.setStyle(...)`, MapLibre drops custom sources/layers.
 * React re-adds them when `styleEpoch` bumps; this restores z-order
 * for any app layers already present on the new style.
 */
export function reattachAppLayersAfterBasemapChange(
  map: maplibregl.Map,
): void {
  ensureAppLayersOrder(map);
}

/** Add a layer below labels (first symbol) when possible; avoid duplicates. */
export function addAppLayer(
  map: maplibregl.Map,
  layer: LayerSpecification | maplibregl.AddLayerObject,
): void {
  if (map.getLayer(layer.id)) {
    return;
  }

  const beforeId = getFirstSymbolLayerId(map);
  if (beforeId && map.getLayer(beforeId)) {
    map.addLayer(layer, beforeId);
  } else {
    map.addLayer(layer);
  }
}

export function removeLayerIfExists(
  map: maplibregl.Map,
  layerId: string,
): void {
  // During setStyle the style is unloaded; custom layers are already gone.
  if (!map.isStyleLoaded() || !map.getLayer(layerId)) {
    return;
  }
  map.removeLayer(layerId);
}

export function removeSourceIfExists(
  map: maplibregl.Map,
  sourceId: string,
): void {
  if (!map.isStyleLoaded() || !map.getSource(sourceId)) {
    return;
  }
  map.removeSource(sourceId);
}

/** WGS84 corners for MapLibre `image` sources: TL, TR, BR, BL. */
export type ImageOverlayCoordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
];

export interface ReplaceImageOverlayOptions {
  url: string;
  coordinates: ImageOverlayCoordinates;
  opacity?: number;
  sourceId?: string;
  layerId?: string;
}

/**
 * Idempotent single-slot raster overlay (indices / RGB / Resultados).
 *
 * Always removes the previous layer/source before adding the new one so a
 * product swap never keeps stale image metadata and never throws
 * ``Source "index-overlay" already exists``.
 */
export function replaceImageOverlay(
  map: maplibregl.Map,
  options: ReplaceImageOverlayOptions,
): void {
  if (!map.isStyleLoaded()) {
    return;
  }

  const sourceId = options.sourceId ?? INDEX_OVERLAY_SOURCE_ID;
  const layerId = options.layerId ?? INDEX_OVERLAY_LAYER_ID;
  const opacity = options.opacity ?? 0.75;

  removeLayerIfExists(map, layerId);
  removeSourceIfExists(map, sourceId);

  // If a concurrent path left the source, force another remove before add.
  if (map.getSource(sourceId)) {
    removeLayerIfExists(map, layerId);
    removeSourceIfExists(map, sourceId);
  }

  if (map.getSource(sourceId)) {
    // Last resort: never call addSource on an existing id.
    return;
  }

  map.addSource(sourceId, {
    type: "image",
    url: options.url,
    coordinates: options.coordinates,
  });

  addAppLayer(map, {
    id: layerId,
    type: "raster",
    source: sourceId,
    paint: {
      "raster-opacity": opacity,
      "raster-fade-duration": 0,
    },
  });

  ensureAppLayersOrder(map);
}

/** Remove the single-slot raster overlay layer + source if present. */
export function clearImageOverlay(
  map: maplibregl.Map,
  sourceId: string = INDEX_OVERLAY_SOURCE_ID,
  layerId: string = INDEX_OVERLAY_LAYER_ID,
): void {
  removeLayerIfExists(map, layerId);
  removeSourceIfExists(map, sourceId);
}
