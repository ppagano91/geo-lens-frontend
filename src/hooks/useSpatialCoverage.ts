import { useEffect, useState } from "react";
import { getSpatialCoverage } from "../api/coverageApi";
import { ApiError } from "../api/client";
import type {
  SpatialCoverageResult,
  SpatialCoverageUiStatus,
} from "../types/spatialCoverage";

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }

  if (err instanceof TypeError) {
    return "No se pudo conectar a la API. Verificá que el backend esté levantado.";
  }

  return fallback;
}

function statusFromResult(
  result: SpatialCoverageResult,
): SpatialCoverageUiStatus {
  return result.coverage_status;
}

export function useSpatialCoverage(
  aoiId: string | null,
  sceneId: string | null,
) {
  const [result, setResult] = useState<SpatialCoverageResult | null>(null);
  const [status, setStatus] = useState<SpatialCoverageUiStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!aoiId || !sceneId) {
      setResult(null);
      setError(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError(null);

      try {
        const data = await getSpatialCoverage(aoiId!, sceneId!);
        if (cancelled) {
          return;
        }
        setResult(data);
        setStatus(statusFromResult(data));
      } catch (err) {
        if (cancelled) {
          return;
        }
        setResult(null);
        setError(formatApiError(err, "No se pudo evaluar la cobertura espacial"));
        setStatus("error");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [aoiId, sceneId]);

  return { result, status, error };
}
