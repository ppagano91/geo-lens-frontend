import { apiRequest } from "./client";
import type { SpectralIndexDefinition } from "../types/spectralIndex";

export interface ListIndicesOptions {
  category?: string;
  is_active?: boolean;
}

export function listIndices(
  options: ListIndicesOptions = {},
): Promise<SpectralIndexDefinition[]> {
  const params = new URLSearchParams();

  if (options.category) {
    params.set("category", options.category);
  }

  if (options.is_active !== undefined) {
    params.set("is_active", String(options.is_active));
  }

  const query = params.toString();
  const path = query ? `/api/v1/indices?${query}` : "/api/v1/indices";

  return apiRequest<SpectralIndexDefinition[]>(path);
}

export function getIndexByKey(indexKey: string): Promise<SpectralIndexDefinition> {
  return apiRequest<SpectralIndexDefinition>(
    `/api/v1/indices/${encodeURIComponent(indexKey)}`,
  );
}
