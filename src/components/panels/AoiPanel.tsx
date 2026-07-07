import type { AoiPolygonFeature } from "../../types/aoi";

interface AoiPanelProps {
  statusMessage: string;
  isDrawing: boolean;
  canFinish: boolean;
  hasAoi: boolean;
  completedAoi: AoiPolygonFeature | null;
  onStartDrawing: () => void;
  onFinishDrawing: () => void;
  onClearAoi: () => void;
}

export default function AoiPanel({
  statusMessage,
  isDrawing,
  canFinish,
  hasAoi,
  completedAoi,
  onStartDrawing,
  onFinishDrawing,
  onClearAoi,
}: AoiPanelProps) {
  return (
    <section className="aoi-panel" aria-label="Área de interés">
      <p className="sidebar-label">AOI</p>

      <p className="aoi-status" role="status">
        {statusMessage}
      </p>

      <div className="aoi-actions">
        <button
          type="button"
          className="aoi-button"
          onClick={onStartDrawing}
          disabled={isDrawing}
        >
          Iniciar dibujo
        </button>
        <button
          type="button"
          className="aoi-button"
          onClick={onFinishDrawing}
          disabled={!isDrawing}
        >
          Finalizar AOI
        </button>
        <button
          type="button"
          className="aoi-button aoi-button--secondary"
          onClick={onClearAoi}
          disabled={!hasAoi}
        >
          Limpiar AOI
        </button>
      </div>

      {isDrawing && !canFinish && (
        <p className="aoi-hint">
          Hacé click en el mapa para agregar vértices (mínimo 3).
        </p>
      )}

      {completedAoi && (
        <div className="aoi-geojson">
          <p className="aoi-geojson-label">GeoJSON</p>
          <pre className="aoi-geojson-pre">
            {JSON.stringify(completedAoi, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
