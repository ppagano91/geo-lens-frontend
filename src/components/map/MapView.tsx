import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AoiPolygonFeature } from "../../types/aoi";
import type { LngLat } from "../../utils/geojson";
import AoiLayer from "./AoiLayer";

const MAP_STYLE = "https://demotiles.maplibre.org/style.json";
const INITIAL_CENTER: [number, number] = [-58.3816, -34.6037];
const INITIAL_ZOOM = 10;

type MapStatus = "loading" | "ready" | "error";

interface MapViewProps {
  isDrawing: boolean;
  draftVertices: LngLat[];
  completedAoi: AoiPolygonFeature | null;
  onMapClick: (lng: number, lat: number) => void;
}

export default function MapView({
  isDrawing,
  draftVertices,
  completedAoi,
  onMapClick,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    let isMounted = true;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });

    mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");

    mapInstance.on("load", () => {
      if (isMounted) {
        setStatus("ready");
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
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
