import { AOI_DRAWING_HELP } from "../../hooks/useAoiDrawing";

interface AoiDrawingToolbarProps {
  pointCount: number;
  canFinish: boolean;
  canUndo: boolean;
  onUndo: () => void;
  onCancel: () => void;
  onFinish: () => void;
}

export default function AoiDrawingToolbar({
  pointCount,
  canFinish,
  canUndo,
  onUndo,
  onCancel,
  onFinish,
}: AoiDrawingToolbarProps) {
  return (
    <div className="aoi-drawing-toolbar" role="toolbar" aria-label="Dibujo de AOI">
      <div className="aoi-drawing-toolbar-main">
        <span className="aoi-drawing-toolbar-status">Dibujando AOI</span>
        <span className="aoi-drawing-toolbar-points">
          {pointCount} punto{pointCount === 1 ? "" : "s"}
        </span>
        <div className="aoi-drawing-toolbar-actions">
          <button
            type="button"
            className="aoi-button aoi-button--secondary aoi-button--small"
            onClick={onUndo}
            disabled={!canUndo}
          >
            Deshacer punto
          </button>
          <button
            type="button"
            className="aoi-button aoi-button--secondary aoi-button--small"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="aoi-button aoi-button--small"
            onClick={onFinish}
            disabled={!canFinish}
          >
            Finalizar
          </button>
        </div>
      </div>
      <p className="aoi-drawing-toolbar-help">{AOI_DRAWING_HELP}</p>
    </div>
  );
}
