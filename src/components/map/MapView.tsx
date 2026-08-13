import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  DEFAULT_BASEMAP_ID,
  getBasemapById,
  getBasemapStyle,
  getDefaultBasemap,
} from "../../config/basemaps";
import type { AoiPolygonFeature } from "../../types/aoi";
import type { SceneFootprintGeometry } from "../../types/scene";
import type { LngLat } from "../../utils/geojson";
import { getFootprintBounds, getPolygonBounds } from "../../utils/geojson";
import { reattachAppLayersAfterBasemapChange } from "../../utils/mapLayers";
import AoiDrawingToolbar from "./AoiDrawingToolbar";
import AoiLayer from "./AoiLayer";
import IndexOverlayLayer from "./IndexOverlayLayer";
import SceneFootprintLayer from "./SceneFootprintLayer";
import type { IndexMapOverlayCoordinates } from "../../types/indexCompute";

const INITIAL_CENTER: [number, number] = [-58.3816, -34.6037];
const INITIAL_ZOOM = 10;
/** Pixels of movement before a pointer gesture is treated as a drag (pan), not a click. */
const CLICK_DRAG_THRESHOLD_PX = 6;

type MapStatus = "loading" | "ready" | "error";

interface MapViewProps {
  basemapId: string;
  isDrawing: boolean;
  draftVertices: LngLat[];
  pointCount: number;
  canFinish: boolean;
  canUndo: boolean;
  completedAoi: AoiPolygonFeature | null;
  fitBoundsTrigger: number;
  sceneFootprint: SceneFootprintGeometry | null;
  sceneName: string | null;
  sceneFitBoundsTrigger: number;
  indexOverlayAssetId: string | null;
  indexOverlayImageUrl: string | null;
  indexOverlayCoordinates: IndexMapOverlayCoordinates | null;
  indexOverlayOpacity: number;
  indexOverlayFitTrigger: number;
  onMapClick: (lng: number, lat: number) => void;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
  onUndoVertex: () => void;
}

export default function MapView({
  basemapId,
  isDrawing,
  draftVertices,
  pointCount,
  canFinish,
  canUndo,
  completedAoi,
  fitBoundsTrigger,
  sceneFootprint,
  sceneName,
  sceneFitBoundsTrigger,
  indexOverlayAssetId,
  indexOverlayImageUrl,
  indexOverlayCoordinates,
  indexOverlayOpacity,
  indexOverlayFitTrigger,
  onMapClick,
  onFinishDrawing,
  onCancelDrawing,
  onUndoVertex,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const prevBasemapIdRef = useRef(basemapId);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** Increments on every basemap `style.load` so React re-adds custom layers. */
  const [styleEpoch, setStyleEpoch] = useState(0);

  const onMapClickRef = useRef(onMapClick);
  const onFinishDrawingRef = useRef(onFinishDrawing);
  onMapClickRef.current = onMapClick;
  onFinishDrawingRef.current = onFinishDrawing;

  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    let isMounted = true;
    const initialBasemap =
      getBasemapById(basemapId) ?? getDefaultBasemap();

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: getBasemapStyle(initialBasemap),
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: false
    });

    mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");
    mapInstance.addControl(new maplibregl.AttributionControl({ compact: true }));

    mapInstance.on("load", () => {
      if (isMounted) {
        setStatus("ready");
        setErrorMessage(null);
      }
    });

    mapInstance.on("error", (event) => {
      if (!isMounted) {
        return;
      }

      setStatus("error");
      setErrorMessage(
        event.error?.message ?? "No se pudo cargar el mapa base.",
      );
    });

    map.current = mapInstance;
    setMapInstance(mapInstance);

    return () => {
      isMounted = false;
      mapInstance.remove();
      map.current = null;
      setMapInstance(null);
    };
  }, []);

  useEffect(() => {
    const mapInstance = map.current;
    const container = mapContainer.current;
    if (!mapInstance || !container) {
      return;
    }

    let timeoutId: number | undefined;

    const resizeMap = () => {
      mapInstance.resize();
    };

    const scheduleResize = () => {
      resizeMap();
      requestAnimationFrame(() => {
        resizeMap();
      });
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(resizeMap, 80);
    };

    const observer = new ResizeObserver(() => {
      scheduleResize();
    });
    observer.observe(container);
    window.addEventListener("resize", scheduleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.clearTimeout(timeoutId);
    };
  }, [mapInstance]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || prevBasemapIdRef.current === basemapId) {
      return;
    }

    prevBasemapIdRef.current = basemapId;

    const basemap =
      getBasemapById(basemapId) ??
      getBasemapById(DEFAULT_BASEMAP_ID) ??
      getDefaultBasemap();
    const center = mapInstance.getCenter();
    const zoom = mapInstance.getZoom();
    const bearing = mapInstance.getBearing();
    const pitch = mapInstance.getPitch();

    setStatus("loading");
    setErrorMessage(null);

    const handleStyleLoad = () => {
      mapInstance.jumpTo({ center, zoom, bearing, pitch });
      // Force layer effects to re-run even if React batches loading→ready.
      setStyleEpoch((epoch) => epoch + 1);
      setStatus("ready");
      reattachAppLayersAfterBasemapChange(mapInstance);
    };

    mapInstance.once("style.load", handleStyleLoad);
    mapInstance.setStyle(getBasemapStyle(basemap));

    return () => {
      mapInstance.off("style.load", handleStyleLoad);
    };
  }, [basemapId]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || status !== "ready") {
      return;
    }

    if (!isDrawing) {
      mapInstance.getCanvas().style.cursor = "";
      return;
    }

    const canvas = mapInstance.getCanvas();
    canvas.style.cursor = "crosshair";
    mapInstance.doubleClickZoom.disable();

    let spaceHeld = false;
    let pointerDown: { x: number; y: number } | null = null;
    let movedBeyondThreshold = false;
    let suppressNextClick = false;
    let altPanActive = false;
    let lastAltPanPoint: { x: number; y: number } | null = null;

    const setCursor = (value: string) => {
      canvas.style.cursor = value;
    };

    const isAltPanButton = (button: number) =>
      button === 1 || button === 2 || (button === 0 && spaceHeld);

    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      spaceHeld = true;
      setCursor("grab");
    };

    const onWindowKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }
      spaceHeld = false;
      if (!altPanActive) {
        setCursor("crosshair");
      }
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const onMouseDown = (event: maplibregl.MapMouseEvent) => {
      const button = event.originalEvent.button;
      pointerDown = { x: event.point.x, y: event.point.y };
      movedBeyondThreshold = false;

      if (isAltPanButton(button)) {
        altPanActive = true;
        lastAltPanPoint = {
          x: event.originalEvent.clientX,
          y: event.originalEvent.clientY,
        };
        suppressNextClick = true;
        setCursor("grabbing");
        if (button === 0 && spaceHeld) {
          // Left+Space: MapLibre dragPan already pans; just block vertex add.
          return;
        }
        // Middle / right: custom pan (dragPan is left-button only).
        mapInstance.dragPan.disable();
        event.originalEvent.preventDefault();
      }
    };

    const onMouseMove = (event: maplibregl.MapMouseEvent) => {
      if (pointerDown) {
        const dx = event.point.x - pointerDown.x;
        const dy = event.point.y - pointerDown.y;
        if (Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD_PX) {
          movedBeyondThreshold = true;
          suppressNextClick = true;
        }
      }

      if (!altPanActive || !lastAltPanPoint) {
        return;
      }

      const buttons = event.originalEvent.buttons;
      // Custom pan only for middle (4) or right (2). Left+Space uses MapLibre dragPan.
      if ((buttons & 2) === 0 && (buttons & 4) === 0) {
        return;
      }

      const clientX = event.originalEvent.clientX;
      const clientY = event.originalEvent.clientY;
      const dx = clientX - lastAltPanPoint.x;
      const dy = clientY - lastAltPanPoint.y;
      lastAltPanPoint = { x: clientX, y: clientY };
      mapInstance.panBy([-dx, -dy], { animate: false });
    };

    const endAltPan = () => {
      if (!altPanActive) {
        return;
      }
      altPanActive = false;
      lastAltPanPoint = null;
      if (!mapInstance.dragPan.isEnabled()) {
        mapInstance.dragPan.enable();
      }
      setCursor(spaceHeld ? "grab" : "crosshair");
    };

    const onMouseUp = () => {
      endAltPan();
      pointerDown = null;
    };

    const onClick = (event: maplibregl.MapMouseEvent) => {
      if (event.originalEvent.button !== 0) {
        return;
      }
      // Second click of a double-click (detail === 2) must not add a vertex.
      if (event.originalEvent.detail > 1) {
        return;
      }
      if (spaceHeld || suppressNextClick || movedBeyondThreshold) {
        suppressNextClick = false;
        movedBeyondThreshold = false;
        return;
      }
      onMapClickRef.current(event.lngLat.lng, event.lngLat.lat);
    };

    const onDblClick = (event: maplibregl.MapMouseEvent) => {
      event.preventDefault();
      onFinishDrawingRef.current();
    };

    window.addEventListener("keydown", onWindowKeyDown);
    window.addEventListener("keyup", onWindowKeyUp);
    canvas.addEventListener("contextmenu", onContextMenu);
    mapInstance.on("mousedown", onMouseDown);
    mapInstance.on("mousemove", onMouseMove);
    mapInstance.on("mouseup", onMouseUp);
    mapInstance.on("click", onClick);
    mapInstance.on("dblclick", onDblClick);

    return () => {
      window.removeEventListener("keydown", onWindowKeyDown);
      window.removeEventListener("keyup", onWindowKeyUp);
      canvas.removeEventListener("contextmenu", onContextMenu);
      mapInstance.off("mousedown", onMouseDown);
      mapInstance.off("mousemove", onMouseMove);
      mapInstance.off("mouseup", onMouseUp);
      mapInstance.off("click", onClick);
      mapInstance.off("dblclick", onDblClick);
      if (!mapInstance.dragPan.isEnabled()) {
        mapInstance.dragPan.enable();
      }
      mapInstance.doubleClickZoom.enable();
      canvas.style.cursor = "";
    };
  }, [isDrawing, status]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || status !== "ready" || !completedAoi || fitBoundsTrigger === 0) {
      return;
    }

    mapInstance.fitBounds(getPolygonBounds(completedAoi), {
      padding: 48,
      maxZoom: 14,
      duration: 500,
    });
  }, [completedAoi, fitBoundsTrigger, status]);

  useEffect(() => {
    const mapInstance = map.current;
    if (
      !mapInstance ||
      status !== "ready" ||
      !sceneFootprint ||
      sceneFitBoundsTrigger === 0
    ) {
      return;
    }

    mapInstance.fitBounds(getFootprintBounds(sceneFootprint), {
      padding: 48,
      maxZoom: 14,
      duration: 500,
    });
  }, [sceneFootprint, sceneFitBoundsTrigger, status]);

  return (
    <div className="map-wrapper">
      {status === "loading" && (
        <div className="map-status" role="status">
          Cargando mapa...
        </div>
      )}
      {status === "error" && (
        <div className="map-status map-status--error" role="alert">
          {errorMessage}
        </div>
      )}
      {isDrawing && (
        <AoiDrawingToolbar
          pointCount={pointCount}
          canFinish={canFinish}
          canUndo={canUndo}
          onUndo={onUndoVertex}
          onCancel={onCancelDrawing}
          onFinish={onFinishDrawing}
        />
      )}
      <AoiLayer
        map={mapInstance}
        mapReady={status === "ready"}
        styleEpoch={styleEpoch}
        isDrawing={isDrawing}
        draftVertices={draftVertices}
        completedAoi={completedAoi}
      />
      <SceneFootprintLayer
        map={mapInstance}
        mapReady={status === "ready"}
        styleEpoch={styleEpoch}
        footprint={sceneFootprint}
        sceneName={sceneName}
      />
      <IndexOverlayLayer
        map={mapInstance}
        mapReady={status === "ready"}
        styleEpoch={styleEpoch}
        overlayAssetId={indexOverlayAssetId}
        imageUrl={indexOverlayImageUrl}
        coordinates={indexOverlayCoordinates}
        opacity={indexOverlayOpacity}
        fitTrigger={indexOverlayFitTrigger}
      />
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
