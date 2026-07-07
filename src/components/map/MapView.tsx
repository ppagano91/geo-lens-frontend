import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = "https://demotiles.maplibre.org/style.json";
const INITIAL_CENTER: [number, number] = [-58.3816, -34.6037];
const INITIAL_ZOOM = 10;

type MapStatus = "loading" | "ready" | "error";

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
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

    return () => {
      isMounted = false;
      mapInstance.remove();
      map.current = null;
    };
  }, []);

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
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
