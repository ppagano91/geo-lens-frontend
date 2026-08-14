import { useState } from "react";
import { RefreshCw } from "lucide-react";
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
import IconButton from "../ui/IconButton";
import CoveragePanel from "./CoveragePanel";
import RadiometryBadge from "../ui/RadiometryBadge";
import CollapsibleSection from "../ui/CollapsibleSection";
import MetadataBlock from "../ui/MetadataBlock";
import SectionCard from "../ui/SectionCard";
import StatusBadge from "../ui/StatusBadge";
import {
  extractRadiometryFromMetadata,
  productLevelLabel,
} from "../../utils/radiometry";

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
        {band.resolution && <span>{band.resolution} m</span>}
        {band.dtype && <span>{band.dtype}</span>}
      </div>
      <p className="scene-band-path" title={band.asset_path}>
        {band.asset_path}
      </p>
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
  const [pendingDelete, setPendingDelete] = useState<SceneListItem | null>(
    null,
  );
  const sceneRadiometry = selectedScene
    ? extractRadiometryFromMetadata(selectedScene.metadata)
    : null;

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
    <section className="scene-panel panel-stack" aria-label="Escenas satelitales">
      <p className="sidebar-label">Escenas</p>

      {error && (
        <p className="aoi-error" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <p
          className="compatibility-status compatibility-status--ok"
          role="status"
        >
          {successMessage}
        </p>
      )}

      <SectionCard
        title="Lista de escenas"
        actions={
          <IconButton
            label={listLoading ? "Cargando escenas..." : "Refrescar escenas"}
            onClick={onRefreshList}
            disabled={listLoading || detailLoading}
          >
            <RefreshCw
              size={16}
              aria-hidden="true"
              className={listLoading ? "icon-spin" : undefined}
            />
          </IconButton>
        }
      >
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
                  <p className="compact-meta-line">
                    {scene.source}
                    {cloudCover ? ` · ${cloudCover}` : ""}
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
      </SectionCard>

      {selectedScene && (
        <SectionCard title="Detalle de escena">
          <div className="status-badge-row">
            <StatusBadge label={selectedScene.source} />
            {productLevelLabel(sceneRadiometry?.product_level) ? (
              <StatusBadge
                label={productLevelLabel(sceneRadiometry?.product_level) ?? ""}
                tone="muted"
              />
            ) : null}
          </div>
          {sceneRadiometry && (
            <RadiometryBadge radiometry={sceneRadiometry} />
          )}
          <dl className="scene-detail-fields">
            <div className="scene-detail-row">
              <dt>Nombre</dt>
              <dd title={selectedScene.name}>{selectedScene.name}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Fecha</dt>
              <dd>{formatDate(selectedScene.acquisition_date)}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Nubosidad</dt>
              <dd>{formatCloudCover(selectedScene.cloud_cover) ?? "—"}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Bandas</dt>
              <dd>{selectedScene.bands.length}</dd>
            </div>
          </dl>
        </SectionCard>
      )}

      {selectedScene && selectedScene.bands.length > 0 && (
        <CollapsibleSection
          title="Bandas registradas"
          defaultOpen={false}
          badge={
            <StatusBadge
              label={String(selectedScene.bands.length)}
              tone="neutral"
            />
          }
        >
          <ul className="scene-band-items">
            {selectedScene.bands.map((band) => (
              <BandItem key={band.id} band={band} />
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {selectedScene && (
        <MetadataBlock
          title="Metadata técnica"
          data={selectedScene.metadata}
          defaultOpen={false}
        />
      )}

      <CoveragePanel
        selectedAoiId={selectedAoiId}
        selectedAoiName={selectedAoiName}
        selectedSceneId={selectedSceneId}
        selectedSceneName={selectedScene?.name ?? null}
      />

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
