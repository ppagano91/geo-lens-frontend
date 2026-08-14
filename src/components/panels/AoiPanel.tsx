import { useState } from "react";
import {
  CheckCircle2,
  Eraser,
  Loader2,
  PenLine,
  RefreshCw,
  Save,
  Undo2,
  XCircle,
} from "lucide-react";
import type { AoiDrawingMode, AoiPolygonFeature, AoiRecord } from "../../types/aoi";
import { getAoiDrawingHelp } from "../../hooks/useAoiDrawing";
import {
  IconCheck,
  IconEye,
  IconTrash,
  IconX,
} from "../ui/ActionIcons";
import ConfirmModal from "../ui/ConfirmModal";
import HelpTooltip from "../ui/HelpTooltip";
import IconActionButton from "../ui/IconActionButton";
import IconButton from "../ui/IconButton";

interface AoiPanelProps {
  statusMessage: string;
  isDrawing: boolean;
  drawingMode: AoiDrawingMode;
  canFinish: boolean;
  canUndo: boolean;
  pointCount: number;
  hasAoi: boolean;
  completedAoi: AoiPolygonFeature | null;
  aoiName: string;
  aoiDescription: string;
  canSave: boolean;
  saving: boolean;
  listLoading: boolean;
  deletingId: string | null;
  error: string | null;
  selectedSavedId: string | null;
  savedAois: AoiRecord[];
  onAoiNameChange: (value: string) => void;
  onAoiDescriptionChange: (value: string) => void;
  onDrawingModeChange: (mode: AoiDrawingMode) => void;
  onStartDrawing: () => void;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
  onUndoVertex: () => void;
  onClearAoi: () => void;
  onSaveAoi: () => void;
  onRefreshList: () => void;
  onSelectSavedAoi: (aoiId: string) => void;
  onDeselectSavedAoi: () => void;
  onDeleteSavedAoi: (aoiId: string) => Promise<void> | void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function AoiPanel({
  statusMessage,
  isDrawing,
  drawingMode,
  canFinish,
  canUndo,
  pointCount,
  hasAoi,
  completedAoi,
  aoiName,
  aoiDescription,
  canSave,
  saving,
  listLoading,
  deletingId,
  error,
  selectedSavedId,
  savedAois,
  onAoiNameChange,
  onAoiDescriptionChange,
  onDrawingModeChange,
  onStartDrawing,
  onFinishDrawing,
  onCancelDrawing,
  onUndoVertex,
  onClearAoi,
  onSaveAoi,
  onRefreshList,
  onSelectSavedAoi,
  onDeselectSavedAoi,
  onDeleteSavedAoi,
}: AoiPanelProps) {
  const [pendingDelete, setPendingDelete] = useState<AoiRecord | null>(null);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      await onDeleteSavedAoi(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // Error feedback is handled by the parent hook.
    }
  };

  return (
    <section className="aoi-panel" aria-label="Área de interés">
      <p className="sidebar-label">AOI</p>

      <p className="aoi-status" role="status">
        {statusMessage}
      </p>

      {error && (
        <p className="aoi-error" role="alert">
          {error}
        </p>
      )}

      <div className="aoi-field">
        <label className="aoi-field-label" htmlFor="aoi-name">
          Nombre del AOI
        </label>
        <input
          id="aoi-name"
          className="aoi-input"
          type="text"
          value={aoiName}
          onChange={(event) => onAoiNameChange(event.target.value)}
          placeholder="Ej: Parque local"
          maxLength={255}
          disabled={isDrawing}
        />
      </div>

      <div className="aoi-field">
        <label className="aoi-field-label" htmlFor="aoi-description">
          Descripción (opcional)
        </label>
        <textarea
          id="aoi-description"
          className="aoi-textarea"
          value={aoiDescription}
          onChange={(event) => onAoiDescriptionChange(event.target.value)}
          placeholder="Notas sobre el área"
          rows={2}
          maxLength={1024}
          disabled={isDrawing}
        />
      </div>

      <div className="aoi-field">
        <label className="aoi-field-label" htmlFor="aoi-drawing-mode">
          Modo de dibujo
        </label>
        <select
          id="aoi-drawing-mode"
          className="aoi-input"
          value={drawingMode}
          onChange={(event) =>
            onDrawingModeChange(event.target.value as AoiDrawingMode)
          }
          disabled={isDrawing || saving}
        >
          <option value="polygon">Polígono libre</option>
          <option value="rectangle">Rectángulo</option>
        </select>
        <div className="aoi-drawing-hints-row aoi-mode-help">
          <p className="aoi-hint">
            {drawingMode === "rectangle"
              ? "Click y arrastrar para definir el área. Esc cancela."
              : "Click para agregar puntos. Enter finaliza. Esc cancela."}
          </p>
          <HelpTooltip
            text={getAoiDrawingHelp(drawingMode)}
            label="Ayuda de modo de dibujo AOI"
            placement="bottom"
          />
        </div>
      </div>

      <div className="aoi-icon-toolbar" aria-label="Acciones de AOI">
        <div className="aoi-icon-actions" role="group" aria-label="Dibujo">
          <IconButton
            label="Iniciar dibujo"
            // text="Dibujar"
            tone="primary"
            onClick={onStartDrawing}
            disabled={isDrawing || saving}
          >
            <PenLine size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
          <IconButton
            label={
              drawingMode === "rectangle"
                ? "Reiniciar rectángulo"
                : "Deshacer último punto"
            }
            onClick={onUndoVertex}
            disabled={!canUndo || saving}
          >
            <Undo2 size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
          {drawingMode === "rectangle" ? null : (
            <IconButton
              label="Finalizar AOI"
              onClick={onFinishDrawing}
              disabled={!canFinish || saving}
            >
              <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
            </IconButton>
          )}
          <IconButton
            label="Cancelar dibujo"
            onClick={onCancelDrawing}
            disabled={!isDrawing || saving}
          >
            <XCircle size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </div>

        <div className="aoi-icon-actions" role="group" aria-label="Persistencia">
          <IconButton
            label="Limpiar AOI"
            onClick={onClearAoi}
            disabled={!hasAoi || saving || isDrawing}
          >
            <Eraser size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
          <IconButton
            label={saving ? "Guardando AOI..." : "Guardar AOI"}
            tone="primary"
            onClick={onSaveAoi}
            disabled={!canSave}
          >
            {saving ? (
              <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
            ) : (
              <Save size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
          <IconButton
            label={listLoading ? "Actualizando lista..." : "Refrescar lista"}
            onClick={onRefreshList}
            disabled={listLoading || saving}
          >
            {listLoading ? (
              <Loader2 size={16} strokeWidth={2} className="icon-spin" aria-hidden="true" />
            ) : (
              <RefreshCw size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
        </div>
      </div>

      {isDrawing && (
        <div className="aoi-drawing-hints">
          <div className="aoi-drawing-hints-row">
            <p className="aoi-hint">
              {drawingMode === "rectangle"
                ? pointCount === 0
                  ? "Click para la primera esquina."
                  : "Mové el mouse para ver el preview. Soltá o hacé click para finalizar."
                : (
                  <>
                    Puntos actuales: <strong>{pointCount}</strong>
                  </>
                )}
            </p>
            <HelpTooltip
              text={getAoiDrawingHelp(drawingMode)}
              label="Ayuda de dibujo AOI"
              placement="bottom"
            />
          </div>
          {drawingMode === "polygon" && !canFinish && (
            <p className="aoi-hint">
              Se necesitan al menos 3 puntos para finalizar.
            </p>
          )}
        </div>
      )}

      {completedAoi && (
        <div className="aoi-geojson">
          <p className="aoi-geojson-label">GeoJSON</p>
          <pre className="aoi-geojson-pre">
            {JSON.stringify(completedAoi, null, 2)}
          </pre>
        </div>
      )}

      <div className="aoi-saved-list">
        <p className="aoi-geojson-label">AOIs guardadas</p>

        {listLoading && savedAois.length === 0 && (
          <p className="aoi-hint">Cargando AOIs...</p>
        )}

        {!listLoading && savedAois.length === 0 && (
          <p className="aoi-hint">No hay AOIs guardadas todavía.</p>
        )}

        {savedAois.length > 0 && (
          <ul className="aoi-saved-items">
            {savedAois.map((aoi) => {
              const isSelected = selectedSavedId === aoi.id;
              const isDeleting = deletingId === aoi.id;

              return (
                <li
                  key={aoi.id}
                  className={`aoi-saved-item${isSelected ? " aoi-saved-item--selected" : ""}`}
                >
                  <div className="aoi-saved-item-header">
                    <strong className="aoi-saved-item-name" title={aoi.name}>
                      {aoi.name}
                    </strong>
                    <span className="aoi-saved-item-date">
                      {formatDate(aoi.created_at)}
                    </span>
                  </div>
                  {aoi.description && (
                    <p className="aoi-saved-item-description" title={aoi.description}>
                      {aoi.description}
                    </p>
                  )}
                  <div className="aoi-saved-item-actions">
                    <IconActionButton
                      label={`Ver AOI ${aoi.name}`}
                      onClick={() => onSelectSavedAoi(aoi.id)}
                      disabled={isDeleting || saving || isDrawing}
                    >
                      <IconEye />
                    </IconActionButton>
                    {isSelected ? (
                      <IconActionButton
                        label={`Deseleccionar AOI ${aoi.name}`}
                        tone="active"
                        onClick={onDeselectSavedAoi}
                        disabled={isDeleting || saving || isDrawing}
                      >
                        <IconX />
                      </IconActionButton>
                    ) : (
                      <IconActionButton
                        label={`Seleccionar AOI ${aoi.name}`}
                        onClick={() => onSelectSavedAoi(aoi.id)}
                        disabled={isDeleting || saving || isDrawing}
                      >
                        <IconCheck />
                      </IconActionButton>
                    )}
                    <IconActionButton
                      label={`Dar de baja AOI ${aoi.name}`}
                      tone="danger"
                      onClick={() => setPendingDelete(aoi)}
                      disabled={isDeleting || saving || isDrawing}
                    >
                      <IconTrash />
                    </IconActionButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        title="Dar de baja AOI"
        message="¿Seguro que querés dar de baja esta AOI? Esta acción la ocultará de los listados principales."
        confirming={pendingDelete !== null && deletingId === pendingDelete.id}
        onCancel={() => {
          if (deletingId === null) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </section>
  );
}
