export interface MaptilerProviderConfig {
  enabled: boolean;
  terrain_rgb_tiles_json_url: string | null;
}

export interface MapProviderInfo {
  id: string;
  name: string;
  type: "terrain";
  requires_key: boolean;
  available: boolean;
}

export interface MapProvidersConfig {
  maptiler: MaptilerProviderConfig;
  providers: MapProviderInfo[];
}
