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
import AoiLayer from "./AoiLayer";
import SceneFootprintLayer from "./SceneFootprintLayer";

const INITIAL_CENTER: [number, number] = [-58.3816, -34.6037];
const INITIAL_ZOOM = 10;

type MapStatus = "loading" | "ready" | "error";

interface MapViewProps {
  basemapId: string;
  isDrawing: boolean;
  draftVertices: LngLat[];
  completedAoi: AoiPolygonFeature | null;
  fitBoundsTrigger: number;
  sceneFootprint: SceneFootprintGeometry | null;
  sceneName: string | null;
  sceneFitBoundsTrigger: number;
  onMapClick: (lng: number, lat: number) => void;
}

export default function MapView({
  basemapId,
  isDrawing,
  draftVertices,
  completedAoi,
  fitBoundsTrigger,
  sceneFootprint,
  sceneName,
  sceneFitBoundsTrigger,
  onMapClick,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const prevBasemapIdRef = useRef(basemapId);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setStatus("ready");
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

    mapInstance.getCanvas().style.cursor = "crosshair";

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      onMapClick(event.lngLat.lng, event.lngLat.lat);
    };

    mapInstance.on("click", handleClick);

    return () => {
      mapInstance.off("click", handleClick);
      mapInstance.getCanvas().style.cursor = "";
    };
  }, [isDrawing, onMapClick, status]);

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
      <AoiLayer
        map={mapInstance}
        mapReady={status === "ready"}
        isDrawing={isDrawing}
        draftVertices={draftVertices}
        completedAoi={completedAoi}
      />
      <SceneFootprintLayer
        map={mapInstance}
        mapReady={status === "ready"}
        footprint={sceneFootprint}
        sceneName={sceneName}
      />
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
