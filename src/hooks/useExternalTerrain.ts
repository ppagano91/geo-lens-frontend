import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { getMapProvidersConfig } from "../api/mapProvidersApi";
import {
  DEFAULT_EXTERNAL_TERRAIN_EXAGGERATION,
  DEFAULT_EXTERNAL_TERRAIN_PROVIDER,
  type ExternalTerrainExaggeration,
  type ExternalTerrainProviderId,
} from "../types/externalTerrain";
import type { MapProvidersConfig } from "../types/mapProviders";

export function canEnableExternalTerrain(
  provider: ExternalTerrainProviderId,
  maptilerEnabled: boolean,
): boolean {
  if (provider === "maptiler") {
    return maptilerEnabled;
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
  const [config, setConfig] = useState<MapProvidersConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setConfigLoading(true);

    getMapProvidersConfig()
      .then((data) => {
        if (cancelled) {
          return;
        }
        setConfig(data);
        setConfigError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setConfig(null);
        if (err instanceof ApiError) {
          setConfigError(err.message);
        } else if (err instanceof TypeError) {
          setConfigError(
            "No se pudo conectar a la API. Verificá que el backend esté levantado.",
          );
        } else {
          setConfigError("No se pudo cargar la configuración de proveedores.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setConfigLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const maptilerEnabled = config?.maptiler.enabled === true;
  const maptilerTilesJsonUrl =
    config?.maptiler.terrain_rgb_tiles_json_url ?? null;
  const canEnable = canEnableExternalTerrain(provider, maptilerEnabled);

  useEffect(() => {
    if (!canEnable) {
      setEnabledState(false);
    }
  }, [canEnable]);

  const setEnabled = useCallback(
    (next: boolean) => {
      if (next && !canEnableExternalTerrain(provider, maptilerEnabled)) {
        return;
      }
      setEnabledState(next);
    },
    [provider, maptilerEnabled],
  );

  const setProvider = useCallback(
    (next: ExternalTerrainProviderId) => {
      setProviderState(next);
      if (!canEnableExternalTerrain(next, maptilerEnabled)) {
        setEnabledState(false);
      }
    },
    [maptilerEnabled],
  );

  return {
    enabled,
    provider,
    exaggeration,
    canEnable,
    maptilerConfigured: maptilerEnabled,
    maptilerTilesJsonUrl,
    configLoading,
    configError,
    setEnabled,
    setProvider,
    setExaggeration,
  };
}
