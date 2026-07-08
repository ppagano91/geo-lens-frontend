import type { AoiPolygonFeature, AoiRecord } from "../../types/aoi";

interface AoiPanelProps {
  statusMessage: string;
  isDrawing: boolean;
  canFinish: boolean;
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
  onStartDrawing: () => void;
  onFinishDrawing: () => void;
  onClearAoi: () => void;
  onSaveAoi: () => void;
  onRefreshList: () => void;
  onSelectSavedAoi: (aoiId: string) => void;
  onDeleteSavedAoi: (aoiId: string) => void;
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
  canFinish,
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
  onStartDrawing,
  onFinishDrawing,
  onClearAoi,
  onSaveAoi,
  onRefreshList,
  onSelectSavedAoi,
  onDeleteSavedAoi,
}: AoiPanelProps) {
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
        />
      </div>

      <div className="aoi-actions">
        <button
          type="button"
          className="aoi-button"
          onClick={onStartDrawing}
          disabled={isDrawing || saving}
        >
          Iniciar dibujo
        </button>
        <button
          type="button"
          className="aoi-button"
          onClick={onFinishDrawing}
          disabled={!isDrawing || saving}
        >
          Finalizar AOI
        </button>
        <button
          type="button"
          className="aoi-button aoi-button--secondary"
          onClick={onClearAoi}
          disabled={!hasAoi || saving}
        >
          Limpiar AOI
        </button>
        <button
          type="button"
          className="aoi-button"
          onClick={onSaveAoi}
          disabled={!canSave}
        >
          {saving ? "Guardando..." : "Guardar AOI"}
        </button>
        <button
          type="button"
          className="aoi-button aoi-button--secondary"
          onClick={onRefreshList}
          disabled={listLoading || saving}
        >
          {listLoading ? "Actualizando..." : "Refrescar lista"}
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
                    <strong className="aoi-saved-item-name">{aoi.name}</strong>
                    <span className="aoi-saved-item-date">
                      {formatDate(aoi.created_at)}
                    </span>
                  </div>
                  {aoi.description && (
                    <p className="aoi-saved-item-description">
                      {aoi.description}
                    </p>
                  )}
                  <div className="aoi-saved-item-actions">
                    <button
                      type="button"
                      className="aoi-button aoi-button--small"
                      onClick={() => onSelectSavedAoi(aoi.id)}
                      disabled={isDeleting || saving}
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      className="aoi-button aoi-button--small aoi-button--danger"
                      onClick={() => void onDeleteSavedAoi(aoi.id)}
                      disabled={isDeleting || saving}
                    >
                      {isDeleting ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
