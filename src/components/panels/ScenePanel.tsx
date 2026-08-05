import { useState } from "react";
import type { BandRead } from "../../types/band";
import type { SceneListItem, SceneRead } from "../../types/scene";
import {
  IconCheck,
  IconEye,
  IconTrash,
  IconX,
} from "../ui/ActionIcons";
import ConfirmModal from "../ui/ConfirmModal";
import IconActionButton from "../ui/IconActionButton";
import CoveragePanel from "./CoveragePanel";

interface ScenePanelProps {
  scenes: SceneListItem[];
  selectedScene: SceneRead | null;
  selectedSceneId: string | null;
  selectedAoiId: string | null;
  selectedAoiName: string | null;
  listLoading: boolean;
  detailLoading: boolean;
  deletingId: string | null;
  error: string | null;
  successMessage?: string | null;
  onRefreshList: () => void;
  onSelectScene: (sceneId: string) => void;
  onDeselectScene: () => void;
  onDeleteScene: (sceneId: string) => Promise<void> | void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatCloudCover(value: string | null): string | null {
  if (value === null || value === "") {
    return null;
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }

  return `${numeric}%`;
}

function BandItem({ band }: { band: BandRead }) {
  return (
    <li className="scene-band-item">
      <div className="scene-band-header">
        <strong className="scene-band-key">{band.band_key}</strong>
        <span className="scene-band-name">{band.band_name}</span>
      </div>
      <div className="scene-band-meta">
        {band.resolution && <span>Resolución: {band.resolution} m</span>}
        {band.dtype && <span>Tipo: {band.dtype}</span>}
      </div>
      <p className="scene-band-path">{band.asset_path}</p>
    </li>
  );
}

export default function ScenePanel({
  scenes,
  selectedScene,
  selectedSceneId,
  selectedAoiId,
  selectedAoiName,
  listLoading,
  detailLoading,
  deletingId,
  error,
  successMessage = null,
  onRefreshList,
  onSelectScene,
  onDeselectScene,
  onDeleteScene,
}: ScenePanelProps) {
  const [pendingDelete, setPendingDelete] = useState<SceneListItem | null>(null);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      await onDeleteScene(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // Error feedback is handled by the parent hook.
    }
  };

  return (
    <section className="scene-panel" aria-label="Escenas satelitales">
      <p className="sidebar-label">Escenas</p>

      <CoveragePanel
        selectedAoiId={selectedAoiId}
        selectedAoiName={selectedAoiName}
        selectedSceneId={selectedSceneId}
        selectedSceneName={selectedScene?.name ?? null}
      />

      {error && (
        <p className="aoi-error" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="compatibility-status compatibility-status--ok" role="status">
          {successMessage}
        </p>
      )}

      <div className="aoi-actions">
        <button
          type="button"
          className="aoi-button aoi-button--secondary"
          onClick={onRefreshList}
          disabled={listLoading || detailLoading}
        >
          {listLoading ? "Cargando escenas..." : "Refrescar escenas"}
        </button>
      </div>

      <div className="scene-list">
        {listLoading && scenes.length === 0 && (
          <p className="aoi-hint" role="status">
            Cargando escenas...
          </p>
        )}

        {!listLoading && scenes.length === 0 && (
          <p className="aoi-hint" role="status">
            Sin escenas registradas.
          </p>
        )}

        {scenes.length > 0 && (
          <ul className="aoi-saved-items">
            {scenes.map((scene) => {
              const isSelected = selectedSceneId === scene.id;
              const isDeleting = deletingId === scene.id;
              const cloudCover = formatCloudCover(scene.cloud_cover);

              return (
                <li
                  key={scene.id}
                  className={`aoi-saved-item${isSelected ? " aoi-saved-item--selected" : ""}`}
                >
                  <div className="aoi-saved-item-header">
                    <strong className="aoi-saved-item-name" title={scene.name}>
                      {scene.name}
                    </strong>
                    <span className="aoi-saved-item-date">
                      {formatDate(scene.acquisition_date)}
                    </span>
                  </div>
                  <p className="scene-item-meta">
                    Fuente: {scene.source}
                    {cloudCover && ` · Nubosidad: ${cloudCover}`}
                  </p>
                  <div className="aoi-saved-item-actions">
                    <IconActionButton
                      label={`Ver escena ${scene.name}`}
                      onClick={() => void onSelectScene(scene.id)}
                      disabled={isDeleting || detailLoading}
                    >
                      <IconEye />
                    </IconActionButton>
                    {isSelected ? (
                      <IconActionButton
                        label={`Deseleccionar escena ${scene.name}`}
                        tone="active"
                        onClick={onDeselectScene}
                        disabled={isDeleting || detailLoading}
                      >
                        <IconX />
                      </IconActionButton>
                    ) : (
                      <IconActionButton
                        label={`Seleccionar escena ${scene.name}`}
                        onClick={() => void onSelectScene(scene.id)}
                        disabled={isDeleting || detailLoading}
                      >
                        <IconCheck />
                      </IconActionButton>
                    )}
                    <IconActionButton
                      label={`Dar de baja escena ${scene.name}`}
                      tone="danger"
                      onClick={() => setPendingDelete(scene)}
                      disabled={isDeleting || detailLoading}
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

      {selectedScene && (
        <div className="scene-detail">
          <p className="aoi-geojson-label">Detalle de escena</p>

          <dl className="scene-detail-fields">
            <div className="scene-detail-row">
              <dt>Nombre</dt>
              <dd title={selectedScene.name}>{selectedScene.name}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Fuente</dt>
              <dd>{selectedScene.source}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Fecha</dt>
              <dd>{formatDate(selectedScene.acquisition_date)}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Nubosidad</dt>
              <dd>
                {formatCloudCover(selectedScene.cloud_cover) ?? "—"}
              </dd>
            </div>
            <div className="scene-detail-row">
              <dt>Bandas</dt>
              <dd>{selectedScene.bands.length}</dd>
            </div>
          </dl>

          {selectedScene.bands.length > 0 && (
            <div className="scene-bands">
              <p className="aoi-geojson-label">Bandas</p>
              <ul className="scene-band-items">
                {selectedScene.bands.map((band) => (
                  <BandItem key={band.id} band={band} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={pendingDelete !== null}
        title="Dar de baja escena"
        message="¿Seguro que querés dar de baja esta escena? Esta acción la ocultará de los listados principales, pero no eliminará los archivos del disco."
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
