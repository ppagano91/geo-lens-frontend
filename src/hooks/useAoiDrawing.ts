import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AoiDrawingMode, AoiDrawingStatus, AoiPolygonFeature } from "../types/aoi";
import type { LngLat } from "../utils/geojson";
import {
  createAoiFeature,
  isValidAoiRectangle,
  rectangleRingFromCorners,
} from "../utils/geojson";

export const MIN_AOI_VERTICES = 3;

export const AOI_POLYGON_DRAWING_HELP =
  "Click: agregar punto · Enter: finalizar · Esc: cancelar";

export const AOI_RECTANGLE_DRAWING_HELP =
  "Click y arrastrar para definir el área · Esc: cancelar";

/** @deprecated Use AOI_POLYGON_DRAWING_HELP or getAoiDrawingHelp */
export const AOI_DRAWING_HELP = AOI_POLYGON_DRAWING_HELP;

export function getAoiDrawingHelp(mode: AoiDrawingMode): string {
  return mode === "rectangle"
    ? AOI_RECTANGLE_DRAWING_HELP
    : AOI_POLYGON_DRAWING_HELP;
}

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
  const [drawingMode, setDrawingModeState] = useState<AoiDrawingMode>("polygon");
  const [draftVertices, setDraftVertices] = useState<LngLat[]>([]);
  const [completedAoi, setCompletedAoi] = useState<AoiPolygonFeature | null>(
    null,
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const statusRef = useRef(status);
  const drawingModeRef = useRef(drawingMode);
  const draftVerticesRef = useRef(draftVertices);
  const rectRafRef = useRef<number | null>(null);
  const pendingRectCornerRef = useRef<LngLat | null>(null);
  statusRef.current = status;
  drawingModeRef.current = drawingMode;

  const setDraft = useCallback((vertices: LngLat[]) => {
    draftVerticesRef.current = vertices;
    setDraftVertices(vertices);
  }, []);

  const cancelRectRaf = useCallback(() => {
    if (rectRafRef.current != null) {
      cancelAnimationFrame(rectRafRef.current);
      rectRafRef.current = null;
    }
    pendingRectCornerRef.current = null;
  }, []);

  const isDrawing = status === "drawing";
  const pointCount = draftVertices.length;

  const statusMessage = useMemo(() => {
    if (validationMessage) {
      return validationMessage;
    }
    if (status === "drawing" && drawingMode === "rectangle") {
      if (pointCount === 0) {
        return "Dibujando rectángulo · click para la primera esquina";
      }
      if (pointCount === 1) {
        return "Dibujando rectángulo · definí la esquina opuesta";
      }
      return "Dibujando rectángulo · soltá o hacé click para finalizar";
    }
    if (status === "drawing") {
      return `Dibujando AOI · ${pointCount} punto${pointCount === 1 ? "" : "s"}`;
    }
    if (status === "ready") {
      return "AOI listo";
    }
    return "Sin AOI dibujada";
  }, [status, validationMessage, pointCount, drawingMode]);

  const canFinish =
    isDrawing &&
    drawingMode === "polygon" &&
    draftVertices.length >= MIN_AOI_VERTICES;
  const canUndo = isDrawing && draftVertices.length > 0;
  const hasAoi =
    completedAoi !== null || isDrawing || draftVertices.length > 0;

  const setDrawingMode = useCallback((mode: AoiDrawingMode) => {
    if (statusRef.current === "drawing") {
      return;
    }
    setDrawingModeState(mode);
  }, []);

  const startDrawing = useCallback(() => {
    cancelRectRaf();
    setCompletedAoi(null);
    setDraft([]);
    setValidationMessage(null);
    setStatus("drawing");
  }, [cancelRectRaf, setDraft]);

  const addVertex = useCallback(
    (lng: number, lat: number) => {
      if (statusRef.current !== "drawing") {
        return;
      }
      if (drawingModeRef.current !== "polygon") {
        return;
      }

      setDraft([...draftVerticesRef.current, [lng, lat]]);
      setValidationMessage(null);
    },
    [setDraft],
  );

  const beginRectangle = useCallback(
    (lng: number, lat: number) => {
      if (statusRef.current !== "drawing") {
        return;
      }
      if (drawingModeRef.current !== "rectangle") {
        return;
      }
      if (draftVerticesRef.current.length > 0) {
        return;
      }

      cancelRectRaf();
      setDraft([[lng, lat]]);
      setValidationMessage(null);
    },
    [cancelRectRaf, setDraft],
  );

  const updateRectangle = useCallback(
    (lng: number, lat: number) => {
      if (statusRef.current !== "drawing") {
        return;
      }
      if (drawingModeRef.current !== "rectangle") {
        return;
      }
      if (draftVerticesRef.current.length === 0) {
        return;
      }

      pendingRectCornerRef.current = [lng, lat];
      if (rectRafRef.current != null) {
        return;
      }

      rectRafRef.current = requestAnimationFrame(() => {
        rectRafRef.current = null;
        const next = pendingRectCornerRef.current;
        pendingRectCornerRef.current = null;
        if (
          !next ||
          statusRef.current !== "drawing" ||
          drawingModeRef.current !== "rectangle"
        ) {
          return;
        }

        const current = draftVerticesRef.current;
        if (current.length === 0) {
          return;
        }

        const start = current[0];
        if (
          current.length === 2 &&
          current[1][0] === next[0] &&
          current[1][1] === next[1]
        ) {
          return;
        }

        setDraft([start, next]);
      });
    },
    [setDraft],
  );

  const finishRectangle = useCallback(() => {
    if (statusRef.current !== "drawing") {
      return;
    }
    if (drawingModeRef.current !== "rectangle") {
      return;
    }

    const pending = pendingRectCornerRef.current;
    cancelRectRaf();

    let vertices = draftVerticesRef.current;
    if (pending && vertices.length > 0) {
      vertices = [vertices[0], pending];
      setDraft(vertices);
    }

    if (vertices.length < 2) {
      setValidationMessage(
        "Definí la esquina opuesta arrastrando o haciendo click.",
      );
      return;
    }

    if (!isValidAoiRectangle(vertices[0], vertices[1])) {
      setValidationMessage(
        "El rectángulo es demasiado chico o inválido. Definí un área más grande.",
      );
      return;
    }

    const ring = rectangleRingFromCorners(vertices[0], vertices[1]);
    setCompletedAoi(createAoiFeature(ring));
    setDraft([]);
    setValidationMessage(null);
    setStatus("ready");
  }, [cancelRectRaf, setDraft]);

  const commitRectangleAt = useCallback(
    (lng: number, lat: number) => {
      if (statusRef.current !== "drawing") {
        return;
      }
      if (drawingModeRef.current !== "rectangle") {
        return;
      }

      const current = draftVerticesRef.current;
      if (current.length === 0) {
        beginRectangle(lng, lat);
        return;
      }

      cancelRectRaf();
      draftVerticesRef.current = [current[0], [lng, lat]];
      setDraft(draftVerticesRef.current);
      finishRectangle();
    },
    [beginRectangle, cancelRectRaf, finishRectangle, setDraft],
  );

  const undoLastVertex = useCallback(() => {
    if (statusRef.current !== "drawing") {
      return;
    }

    const current = draftVerticesRef.current;
    if (current.length === 0) {
      return;
    }

    cancelRectRaf();
    if (drawingModeRef.current === "rectangle") {
      setDraft([]);
      setValidationMessage(null);
      return;
    }

    setDraft(current.slice(0, -1));
    setValidationMessage(null);
  }, [cancelRectRaf, setDraft]);

  const cancelDrawing = useCallback(() => {
    if (statusRef.current !== "drawing") {
      return;
    }

    cancelRectRaf();
    setDraft([]);
    setValidationMessage(null);
    setStatus("idle");
  }, [cancelRectRaf, setDraft]);

  const finishDrawing = useCallback(() => {
    if (statusRef.current !== "drawing") {
      return;
    }
    if (drawingModeRef.current === "rectangle") {
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
    cancelRectRaf();
    setCompletedAoi(null);
    setDraft([]);
    setValidationMessage(null);
    setStatus("idle");
  }, [cancelRectRaf, setDraft]);

  const loadAoi = useCallback(
    (feature: AoiPolygonFeature) => {
      cancelRectRaf();
      setCompletedAoi(feature);
      setDraft([]);
      setValidationMessage(null);
      setStatus("ready");
    },
    [cancelRectRaf, setDraft],
  );

  useEffect(() => {
    return () => {
      if (rectRafRef.current != null) {
        cancelAnimationFrame(rectRafRef.current);
      }
    };
  }, []);

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
        if (drawingModeRef.current !== "polygon") {
          return;
        }
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
    drawingMode,
    isDrawing,
    draftVertices,
    pointCount,
    completedAoi,
    statusMessage,
    canFinish,
    canUndo,
    hasAoi,
    setDrawingMode,
    startDrawing,
    addVertex,
    beginRectangle,
    updateRectangle,
    finishRectangle,
    commitRectangleAt,
    undoLastVertex,
    cancelDrawing,
    finishDrawing,
    clearAoi,
    loadAoi,
  };
}
