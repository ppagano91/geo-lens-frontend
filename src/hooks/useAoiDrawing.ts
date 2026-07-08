import { useCallback, useMemo, useState } from "react";
import type { AoiDrawingStatus, AoiPolygonFeature } from "../types/aoi";
import type { LngLat } from "../utils/geojson";
import { createAoiFeature } from "../utils/geojson";

const MIN_VERTICES = 3;

export function useAoiDrawing() {
  const [status, setStatus] = useState<AoiDrawingStatus>("idle");
  const [draftVertices, setDraftVertices] = useState<LngLat[]>([]);
  const [completedAoi, setCompletedAoi] = useState<AoiPolygonFeature | null>(
    null,
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const isDrawing = status === "drawing";

  const statusMessage = useMemo(() => {
    if (validationMessage) {
      return validationMessage;
    }
    if (status === "drawing") {
      return "Dibujando AOI";
    }
    if (status === "ready") {
      return "AOI listo";
    }
    return "Sin AOI dibujada";
  }, [status, validationMessage]);

  const canFinish = isDrawing && draftVertices.length >= MIN_VERTICES;
  const hasAoi =
    completedAoi !== null || isDrawing || draftVertices.length > 0;

  const startDrawing = useCallback(() => {
    setCompletedAoi(null);
    setDraftVertices([]);
    setValidationMessage(null);
    setStatus("drawing");
  }, []);

  const addVertex = useCallback(
    (lng: number, lat: number) => {
      if (status !== "drawing") {
        return;
      }

      setDraftVertices((prev) => [...prev, [lng, lat]]);
      setValidationMessage(null);
    },
    [status],
  );

  const finishDrawing = useCallback(() => {
    if (status !== "drawing") {
      return;
    }

    if (draftVertices.length < MIN_VERTICES) {
      setValidationMessage(
        "Se requieren al menos 3 puntos para cerrar el polígono",
      );
      return;
    }

    setCompletedAoi(createAoiFeature(draftVertices));
    setDraftVertices([]);
    setValidationMessage(null);
    setStatus("ready");
  }, [status, draftVertices]);

  const clearAoi = useCallback(() => {
    setCompletedAoi(null);
    setDraftVertices([]);
    setValidationMessage(null);
    setStatus("idle");
  }, []);

  const loadAoi = useCallback((feature: AoiPolygonFeature) => {
    setCompletedAoi(feature);
    setDraftVertices([]);
    setValidationMessage(null);
    setStatus("ready");
  }, []);

  return {
    status,
    isDrawing,
    draftVertices,
    completedAoi,
    statusMessage,
    canFinish,
    hasAoi,
    startDrawing,
    addVertex,
    finishDrawing,
    clearAoi,
    loadAoi,
  };
}
