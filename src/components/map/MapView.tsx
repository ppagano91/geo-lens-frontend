import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  DEFAULT_BASEMAP_ID,
  getBasemapById,
  getBasemapStyle,
  getDefaultBasemap,
} from "../../config/basemaps";
import type { AoiDrawingMode, AoiPolygonFeature } from "../../types/aoi";
import type { SceneFootprintGeometry } from "../../types/scene";
import type { LngLat } from "../../utils/geojson";
import { getFootprintBounds, getPolygonBounds } from "../../utils/geojson";
import {
  DEM_OVERLAY_LAYER_ID,
  DEM_OVERLAY_SOURCE_ID,
  reattachAppLayersAfterBasemapChange,
} from "../../utils/mapLayers";
import type { MapCursorPosition } from "../../utils/mapInspector";
import AoiDrawingToolbar from "./AoiDrawingToolbar";
import AoiLayer from "./AoiLayer";
import IndexOverlayLayer from "./IndexOverlayLayer";
import ExternalTerrainLayer from "./ExternalTerrainLayer";
import SceneFootprintLayer from "./SceneFootprintLayer";
import type { IndexMapOverlayCoordinates } from "../../types/indexCompute";
import type { ExternalTerrainProviderId } from "../../types/externalTerrain";

const INITIAL_CENTER: [number, number] = [-58.3816, -34.6037];
const INITIAL_ZOOM = 10;
/** Pixels of movement before a pointer gesture is treated as a drag (pan), not a click. */
const CLICK_DRAG_THRESHOLD_PX = 6;

type MapStatus = "loading" | "ready" | "error";

interface MapViewProps {
  basemapId: string;
  isDrawing: boolean;
  drawingMode: AoiDrawingMode;
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
  demOverlayAssetId: string | null;
  demOverlayImageUrl: string | null;
  demOverlayCoordinates: IndexMapOverlayCoordinates | null;
  demOverlayOpacity: number;
  demOverlayFitTrigger: number;
  externalTerrainEnabled: boolean;
  externalTerrainProvider: ExternalTerrainProviderId;
  externalTerrainExaggeration: number;
  onMapClick: (lng: number, lat: number) => void;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
  onUndoVertex: () => void;
  onRectangleStart: (lng: number, lat: number) => void;
  onRectangleUpdate: (lng: number, lat: number) => void;
  onRectangleFinish: () => void;
  onRectangleCommitAt: (lng: number, lat: number) => void;
  onCursorChange?: (cursor: MapCursorPosition | null) => void;
  onZoomChange?: (zoom: number) => void;
}

export default function MapView({
  basemapId,
  isDrawing,
  drawingMode,
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
  demOverlayAssetId,
  demOverlayImageUrl,
  demOverlayCoordinates,
  demOverlayOpacity,
  demOverlayFitTrigger,
  externalTerrainEnabled,
  externalTerrainProvider,
  externalTerrainExaggeration,
  onMapClick,
  onFinishDrawing,
  onCancelDrawing,
  onUndoVertex,
  onRectangleStart,
  onRectangleUpdate,
  onRectangleFinish,
  onRectangleCommitAt,
  onCursorChange,
  onZoomChange,
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
  const onRectangleStartRef = useRef(onRectangleStart);
  const onRectangleUpdateRef = useRef(onRectangleUpdate);
  const onRectangleFinishRef = useRef(onRectangleFinish);
  const onRectangleCommitAtRef = useRef(onRectangleCommitAt);
  const onCursorChangeRef = useRef(onCursorChange);
  const onZoomChangeRef = useRef(onZoomChange);
  onMapClickRef.current = onMapClick;
  onFinishDrawingRef.current = onFinishDrawing;
  onRectangleStartRef.current = onRectangleStart;
  onRectangleUpdateRef.current = onRectangleUpdate;
  onRectangleFinishRef.current = onRectangleFinish;
  onRectangleCommitAtRef.current = onRectangleCommitAt;
  onCursorChangeRef.current = onCursorChange;
  onZoomChangeRef.current = onZoomChange;
  const draftCountRef = useRef(draftVertices.length);
  draftCountRef.current = draftVertices.length;

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
      minZoom: 3.5,
      maxZoom: 20,
      attributionControl: false
    });

    mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");
    mapInstance.addControl(new maplibregl.AttributionControl({ compact: true }));

    mapInstance.on("load", () => {
      if (isMounted) {
        setStatus("ready");
        setErrorMessage(null);
        onZoomChangeRef.current?.(mapInstance.getZoom());
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
    const isRectangle = drawingMode === "rectangle";
    canvas.style.cursor = "crosshair";
    mapInstance.doubleClickZoom.disable();
    if (isRectangle) {
      mapInstance.dragPan.disable();
      mapInstance.boxZoom.disable();
    }

    let spaceHeld = false;
    let pointerDown: { x: number; y: number } | null = null;
    let movedBeyondThreshold = false;
    let suppressNextClick = false;
    let altPanActive = false;
    let lastAltPanPoint: { x: number; y: number } | null = null;
    let rectangleDragging = false;

    const setCursor = (value: string) => {
      canvas.style.cursor = value;
    };

    const isAltPanButton = (button: number) =>
      button === 1 || button === 2 || (button === 0 && spaceHeld);

    const lngLatFromClient = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return mapInstance.unproject([clientX - rect.left, clientY - rect.top]);
    };

    const restoreDragPan = () => {
      if (isRectangle) {
        return;
      }
      if (!mapInstance.dragPan.isEnabled()) {
        mapInstance.dragPan.enable();
      }
    };

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
        rectangleDragging = false;
        setCursor("grabbing");
        if (button === 0 && spaceHeld && !isRectangle) {
          // Left+Space: MapLibre dragPan already pans; just block vertex add.
          return;
        }
        // Middle / right, or Left+Space in rectangle mode (dragPan is off).
        mapInstance.dragPan.disable();
        event.originalEvent.preventDefault();
        return;
      }

      if (isRectangle && button === 0) {
        rectangleDragging = true;
        event.originalEvent.preventDefault();
        if (draftCountRef.current === 0) {
          suppressNextClick = true;
          onRectangleStartRef.current(event.lngLat.lng, event.lngLat.lat);
        }
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

      if (isRectangle && !altPanActive) {
        onRectangleUpdateRef.current(event.lngLat.lng, event.lngLat.lat);
      }

      if (!altPanActive || !lastAltPanPoint) {
        return;
      }

      const buttons = event.originalEvent.buttons;
      const leftHeld = (buttons & 1) !== 0;
      const rightHeld = (buttons & 2) !== 0;
      const middleHeld = (buttons & 4) !== 0;
      // Custom pan for middle/right. Left+Space uses MapLibre dragPan unless
      // rectangle mode disabled it.
      if (
        !middleHeld &&
        !rightHeld &&
        !(leftHeld && spaceHeld && isRectangle)
      ) {
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
      restoreDragPan();
      setCursor(spaceHeld ? "grab" : "crosshair");
    };

    const finishRectangleDragIfNeeded = () => {
      if (!isRectangle || !rectangleDragging) {
        return;
      }
      rectangleDragging = false;
      if (movedBeyondThreshold) {
        onRectangleFinishRef.current();
        suppressNextClick = true;
      }
    };

    const onMouseUp = () => {
      endAltPan();
      finishRectangleDragIfNeeded();
      pointerDown = null;
    };

    const onWindowMouseMove = (event: MouseEvent) => {
      if (!isRectangle || !rectangleDragging || altPanActive) {
        return;
      }
      const lngLat = lngLatFromClient(event.clientX, event.clientY);
      onRectangleUpdateRef.current(lngLat.lng, lngLat.lat);
    };

    const onWindowMouseUp = () => {
      endAltPan();
      finishRectangleDragIfNeeded();
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
      if (isRectangle) {
        onRectangleCommitAtRef.current(event.lngLat.lng, event.lngLat.lat);
        return;
      }
      onMapClickRef.current(event.lngLat.lng, event.lngLat.lat);
    };

    const onDblClick = (event: maplibregl.MapMouseEvent) => {
      event.preventDefault();
      if (!isRectangle) {
        onFinishDrawingRef.current();
      }
    };

    window.addEventListener("keydown", onWindowKeyDown);
    window.addEventListener("keyup", onWindowKeyUp);
    if (isRectangle) {
      window.addEventListener("mousemove", onWindowMouseMove);
      window.addEventListener("mouseup", onWindowMouseUp);
    }
    canvas.addEventListener("contextmenu", onContextMenu);
    mapInstance.on("mousedown", onMouseDown);
    mapInstance.on("mousemove", onMouseMove);
    mapInstance.on("mouseup", onMouseUp);
    mapInstance.on("click", onClick);
    mapInstance.on("dblclick", onDblClick);

    return () => {
      window.removeEventListener("keydown", onWindowKeyDown);
      window.removeEventListener("keyup", onWindowKeyUp);
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
      canvas.removeEventListener("contextmenu", onContextMenu);
      mapInstance.off("mousedown", onMouseDown);
      mapInstance.off("mousemove", onMouseMove);
      mapInstance.off("mouseup", onMouseUp);
      mapInstance.off("click", onClick);
      mapInstance.off("dblclick", onDblClick);
      if (!mapInstance.dragPan.isEnabled()) {
        mapInstance.dragPan.enable();
      }
      if (!mapInstance.boxZoom.isEnabled()) {
        mapInstance.boxZoom.enable();
      }
      mapInstance.doubleClickZoom.enable();
      canvas.style.cursor = "";
    };
  }, [isDrawing, drawingMode, status]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || status !== "ready") {
      return;
    }

    const reportZoom = () => {
      onZoomChangeRef.current?.(mapInstance.getZoom());
    };

    const lastCursorEmitRef = { current: 0 };

    const onMouseMove = (event: maplibregl.MapMouseEvent) => {
      const now = performance.now();
      if (now - lastCursorEmitRef.current < 80) {
        return;
      }
      lastCursorEmitRef.current = now;
      onCursorChangeRef.current?.({
        lon: event.lngLat.lng,
        lat: event.lngLat.lat,
      });
    };

    reportZoom();
    mapInstance.on("mousemove", onMouseMove);
    mapInstance.on("zoom", reportZoom);
    mapInstance.on("zoomend", reportZoom);
    mapInstance.on("moveend", reportZoom);
    // TODO(v0.1 backlog): secondary-click contextual menu.
    // Planned: right-click on the map → menu → "Copiar coordenadas".
    // Do not preventDefault on contextmenu until that menu is implemented
    // (keep the native browser menu for now).

    return () => {
      mapInstance.off("mousemove", onMouseMove);
      mapInstance.off("zoom", reportZoom);
      mapInstance.off("zoomend", reportZoom);
      mapInstance.off("moveend", reportZoom);
    };
  }, [status]);

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
          drawingMode={drawingMode}
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
        drawingMode={drawingMode}
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
        overlayAssetId={demOverlayAssetId}
        imageUrl={demOverlayImageUrl}
        coordinates={demOverlayCoordinates}
        opacity={demOverlayOpacity}
        fitTrigger={demOverlayFitTrigger}
        sourceId={DEM_OVERLAY_SOURCE_ID}
        layerId={DEM_OVERLAY_LAYER_ID}
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
      <ExternalTerrainLayer
        map={mapInstance}
        mapReady={status === "ready"}
        styleEpoch={styleEpoch}
        enabled={externalTerrainEnabled}
        provider={externalTerrainProvider}
        exaggeration={externalTerrainExaggeration}
      />
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
