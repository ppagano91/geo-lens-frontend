export const EXTERNAL_TERRAIN_PROVIDER_IDS = [
  "aws-terrarium",
  "maptiler",
  "maplibre-demo",
] as const;

export type ExternalTerrainProviderId =
  (typeof EXTERNAL_TERRAIN_PROVIDER_IDS)[number];

export const EXTERNAL_TERRAIN_EXAGGERATIONS = [0.5, 1, 1.5, 2] as const;

export type ExternalTerrainExaggeration =
  (typeof EXTERNAL_TERRAIN_EXAGGERATIONS)[number];

export const DEFAULT_EXTERNAL_TERRAIN_PROVIDER: ExternalTerrainProviderId =
  "aws-terrarium";

export const DEFAULT_EXTERNAL_TERRAIN_EXAGGERATION: ExternalTerrainExaggeration = 1;

export interface ExternalTerrainProviderOption {
  id: ExternalTerrainProviderId;
  label: string;
}

export const EXTERNAL_TERRAIN_PROVIDERS: ExternalTerrainProviderOption[] = [
  { id: "aws-terrarium", label: "AWS / Mapzen Terrarium" },
  { id: "maptiler", label: "MapTiler Terrain RGB" },
  { id: "maplibre-demo", label: "MapLibre demo tiles" },
];

export function isExternalTerrainExaggeration(
  value: number,
): value is ExternalTerrainExaggeration {
  return (EXTERNAL_TERRAIN_EXAGGERATIONS as readonly number[]).includes(value);
}
