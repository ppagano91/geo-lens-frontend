import {
  CheckCircle2,
  Undo2,
  XCircle,
} from "lucide-react";
import type { AoiDrawingMode } from "../../types/aoi";
import { getAoiDrawingHelp } from "../../hooks/useAoiDrawing";
import HelpTooltip from "../ui/HelpTooltip";
import IconButton from "../ui/IconButton";

interface AoiDrawingToolbarProps {
  drawingMode: AoiDrawingMode;
  pointCount: number;
  canFinish: boolean;
  canUndo: boolean;
  onUndo: () => void;
  onCancel: () => void;
  onFinish: () => void;
}

export default function AoiDrawingToolbar({
  drawingMode,
  pointCount,
  canFinish,
  canUndo,
  onUndo,
  onCancel,
  onFinish,
}: AoiDrawingToolbarProps) {
  const isRectangle = drawingMode === "rectangle";

  return (
    <div className="aoi-drawing-toolbar" role="toolbar" aria-label="Dibujo de AOI">
      <div className="aoi-drawing-toolbar-main">
        <span className="aoi-drawing-toolbar-status">
          {isRectangle ? "Dibujando rectángulo" : "Dibujando AOI"}
        </span>
        <span className="aoi-drawing-toolbar-points">
          {isRectangle
            ? pointCount === 0
              ? "esperando esquina"
              : pointCount === 1
                ? "1 esquina"
                : "área en preview"
            : `${pointCount} punto${pointCount === 1 ? "" : "s"}`}
        </span>
        <HelpTooltip
          text={getAoiDrawingHelp(drawingMode)}
          label="Ayuda de dibujo AOI"
          placement="bottom"
        />
        <div className="aoi-drawing-toolbar-actions">
          <IconButton
            label={isRectangle ? "Reiniciar rectángulo" : "Deshacer último punto"}
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
          <IconButton label="Cancelar dibujo" onClick={onCancel}>
            <XCircle size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
          {isRectangle ? null : (
            <IconButton
              label="Finalizar AOI"
              tone="primary"
              onClick={onFinish}
              disabled={!canFinish}
            >
              <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}
