import type { StyleSpecification } from "maplibre-gl";

export interface BasemapConfig {
  id: string;
  label: string;
  type: "style" | "raster";
  styleUrl?: string;
  tiles?: string[];
  attribution: string;
  maxZoom?: number;
  tileSize?: number;
}

export const DEFAULT_BASEMAP_ID = "osm";

export const BASEMAPS: BasemapConfig[] = [
  {
    id: "osm",
    label: "Calles",
    type: "raster",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    tileSize: 256,
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  },
  {
    id: "opentopomap",
    label: "Topográfico",
    type: "raster",
    tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
    tileSize: 256,
    maxZoom: 17,
    attribution: "© OpenStreetMap contributors, SRTM | © OpenTopoMap",
  },
  {
    id: "esri-imagery",
    label: "Satélite",
    type: "raster",
    tiles: [
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    maxZoom: 19,
    attribution: "Tiles © Esri",
  },
  {
    id: "maplibre-demo",
    label: "Demo MapLibre",
    type: "style",
    styleUrl: "https://demotiles.maplibre.org/style.json",
    attribution: "© MapLibre",
  },
];

export function getBasemapById(id: string): BasemapConfig | undefined {
  return BASEMAPS.find((basemap) => basemap.id === id);
}

export function getDefaultBasemap(): BasemapConfig {
  return getBasemapById(DEFAULT_BASEMAP_ID) ?? BASEMAPS[0];
}

export function getBasemapStyle(
  basemap: BasemapConfig,
): string | StyleSpecification {
  if (basemap.type === "style" && basemap.styleUrl) {
    return basemap.styleUrl;
  }

  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: basemap.tiles ?? [],
        tileSize: basemap.tileSize ?? 256,
        maxzoom: basemap.maxZoom,
        attribution: basemap.attribution,
      },
    },
    layers: [
      {
        id: "basemap-raster",
        type: "raster",
        source: "basemap",
      },
    ],
  };
}
