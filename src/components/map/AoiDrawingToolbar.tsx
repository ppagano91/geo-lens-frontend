import {
  CheckCircle2,
  Undo2,
  XCircle,
} from "lucide-react";
import { AOI_DRAWING_HELP } from "../../hooks/useAoiDrawing";
import HelpTooltip from "../ui/HelpTooltip";
import IconButton from "../ui/IconButton";

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
        <HelpTooltip
          text={AOI_DRAWING_HELP}
          label="Ayuda de dibujo AOI"
          placement="bottom"
        />
        <div className="aoi-drawing-toolbar-actions">
          <IconButton
            label="Deshacer último punto"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
          <IconButton label="Cancelar dibujo" onClick={onCancel}>
            <XCircle size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
          <IconButton
            label="Finalizar AOI"
            tone="primary"
            onClick={onFinish}
            disabled={!canFinish}
          >
            <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
