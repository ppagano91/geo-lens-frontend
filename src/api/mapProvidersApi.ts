import { apiRequest } from "./client";
import type { MapProvidersConfig } from "../types/mapProviders";

export function getMapProvidersConfig(): Promise<MapProvidersConfig> {
  return apiRequest<MapProvidersConfig>("/api/v1/map-providers/config");
}
