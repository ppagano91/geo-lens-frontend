import { useCallback, useState } from "react";
import { MAPTILER_KEY } from "../config/env";
import {
  DEFAULT_EXTERNAL_TERRAIN_EXAGGERATION,
  DEFAULT_EXTERNAL_TERRAIN_PROVIDER,
  type ExternalTerrainExaggeration,
  type ExternalTerrainProviderId,
} from "../types/externalTerrain";

export function providerNeedsMaptilerKey(
  provider: ExternalTerrainProviderId,
): boolean {
  return provider === "maptiler";
}

export function canEnableExternalTerrain(
  provider: ExternalTerrainProviderId,
  maptilerKey: string = MAPTILER_KEY,
): boolean {
  if (providerNeedsMaptilerKey(provider)) {
    return maptilerKey.trim().length > 0;
  }
  return true;
}

export function useExternalTerrain() {
  const [enabled, setEnabledState] = useState(false);
  const [provider, setProviderState] = useState<ExternalTerrainProviderId>(
    DEFAULT_EXTERNAL_TERRAIN_PROVIDER,
  );
  const [exaggeration, setExaggeration] =
    useState<ExternalTerrainExaggeration>(
      DEFAULT_EXTERNAL_TERRAIN_EXAGGERATION,
    );

  const canEnable = canEnableExternalTerrain(provider);

  const setEnabled = useCallback(
    (next: boolean) => {
      if (next && !canEnableExternalTerrain(provider)) {
        return;
      }
      setEnabledState(next);
    },
    [provider],
  );

  const setProvider = useCallback((next: ExternalTerrainProviderId) => {
    setProviderState(next);
    if (!canEnableExternalTerrain(next)) {
      setEnabledState(false);
    }
  }, []);

  return {
    enabled,
    provider,
    exaggeration,
    canEnable,
    maptilerKeyPresent: MAPTILER_KEY.trim().length > 0,
    setEnabled,
    setProvider,
    setExaggeration,
  };
}
