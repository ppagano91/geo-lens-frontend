import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { MAPTILER_KEY } from "../../config/env";
import type { ExternalTerrainProviderId } from "../../types/externalTerrain";
import {
  applyExternalTerrain,
  buildExternalTerrainSource,
  clearExternalTerrain,
} from "../../utils/externalTerrain";

interface ExternalTerrainLayerProps {
  map: maplibregl.Map | null;
  mapReady: boolean;
  styleEpoch: number;
  enabled: boolean;
  provider: ExternalTerrainProviderId;
  exaggeration: number;
}

export default function ExternalTerrainLayer({
  map,
  mapReady,
  styleEpoch,
  enabled,
  provider,
  exaggeration,
}: ExternalTerrainLayerProps) {
  const controlRef = useRef<maplibregl.IControl | null>(null);

  useEffect(() => {
    if (!map) {
      return;
    }

    const spec = buildExternalTerrainSource(provider, MAPTILER_KEY);
    const shouldApply = mapReady && enabled && spec != null;

    if (!shouldApply) {
      controlRef.current = clearExternalTerrain(map, controlRef.current);
      return;
    }

    controlRef.current = applyExternalTerrain(
      map,
      spec,
      exaggeration,
      controlRef.current,
      maplibregl,
    );

    return () => {
      controlRef.current = clearExternalTerrain(map, controlRef.current);
    };
  }, [map, mapReady, styleEpoch, enabled, provider, exaggeration]);

  return null;
}
