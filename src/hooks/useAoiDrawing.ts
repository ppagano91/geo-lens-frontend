import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AoiDrawingStatus, AoiPolygonFeature } from "../types/aoi";
import type { LngLat } from "../utils/geojson";
import { createAoiFeature } from "../utils/geojson";

export const MIN_AOI_VERTICES = 3;

export const AOI_DRAWING_HELP =
  "Click: agregar punto · Ctrl+Z: deshacer · Enter: finalizar · Esc: cancelar";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function useAoiDrawing() {
  const [status, setStatus] = useState<AoiDrawingStatus>("idle");
  const [draftVertices, setDraftVertices] = useState<LngLat[]>([]);
  const [completedAoi, setCompletedAoi] = useState<AoiPolygonFeature | null>(
    null,
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const statusRef = useRef(status);
  const draftVerticesRef = useRef(draftVertices);
  statusRef.current = status;

  const setDraft = useCallback((vertices: LngLat[]) => {
    draftVerticesRef.current = vertices;
    setDraftVertices(vertices);
  }, []);

  const isDrawing = status === "drawing";
  const pointCount = draftVertices.length;

  const statusMessage = useMemo(() => {
    if (validationMessage) {
      return validationMessage;
    }
    if (status === "drawing") {
      return `Dibujando AOI · ${pointCount} punto${pointCount === 1 ? "" : "s"}`;
    }
    if (status === "ready") {
      return "AOI listo";
    }
    return "Sin AOI dibujada";
  }, [status, validationMessage, pointCount]);

  const canFinish = isDrawing && draftVertices.length >= MIN_AOI_VERTICES;
  const canUndo = isDrawing && draftVertices.length > 0;
  const hasAoi =
    completedAoi !== null || isDrawing || draftVertices.length > 0;

  const startDrawing = useCallback(() => {
    setCompletedAoi(null);
    setDraft([]);
    setValidationMessage(null);
    setStatus("drawing");
  }, [setDraft]);

  const addVertex = useCallback(
    (lng: number, lat: number) => {
      if (statusRef.current !== "drawing") {
        return;
      }

      setDraft([...draftVerticesRef.current, [lng, lat]]);
      setValidationMessage(null);
    },
    [setDraft],
  );

  const undoLastVertex = useCallback(() => {
    if (statusRef.current !== "drawing") {
      return;
    }

    const current = draftVerticesRef.current;
    if (current.length === 0) {
      return;
    }

    setDraft(current.slice(0, -1));
    setValidationMessage(null);
  }, [setDraft]);

  const cancelDrawing = useCallback(() => {
    if (statusRef.current !== "drawing") {
      return;
    }

    setDraft([]);
    setValidationMessage(null);
    setStatus("idle");
  }, [setDraft]);

  const finishDrawing = useCallback(() => {
    if (statusRef.current !== "drawing") {
      return;
    }

    const vertices = draftVerticesRef.current;
    if (vertices.length < MIN_AOI_VERTICES) {
      setValidationMessage(
        `Se requieren al menos ${MIN_AOI_VERTICES} puntos para cerrar el polígono (tenés ${vertices.length}).`,
      );
      return;
    }

    setCompletedAoi(createAoiFeature(vertices));
    setDraft([]);
    setValidationMessage(null);
    setStatus("ready");
  }, [setDraft]);

  const clearAoi = useCallback(() => {
    setCompletedAoi(null);
    setDraft([]);
    setValidationMessage(null);
    setStatus("idle");
  }, [setDraft]);

  const loadAoi = useCallback(
    (feature: AoiPolygonFeature) => {
      setCompletedAoi(feature);
      setDraft([]);
      setValidationMessage(null);
      setStatus("ready");
    },
    [setDraft],
  );

  useEffect(() => {
    if (!isDrawing) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelDrawing();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        finishDrawing();
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        undoLastVertex();
        return;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key.toLowerCase() === "z"
      ) {
        event.preventDefault();
        undoLastVertex();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDrawing, cancelDrawing, finishDrawing, undoLastVertex]);

  return {
    status,
    isDrawing,
    draftVertices,
    pointCount,
    completedAoi,
    statusMessage,
    canFinish,
    canUndo,
    hasAoi,
    startDrawing,
    addVertex,
    undoLastVertex,
    cancelDrawing,
    finishDrawing,
    clearAoi,
    loadAoi,
  };
}
