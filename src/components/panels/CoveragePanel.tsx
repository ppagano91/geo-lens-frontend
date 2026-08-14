import { useSpatialCoverage } from "../../hooks/useSpatialCoverage";
import type { SpatialCoverageUiStatus } from "../../types/spatialCoverage";
import CollapsibleSection from "../ui/CollapsibleSection";
import StatusBadge from "../ui/StatusBadge";

interface CoveragePanelProps {
  selectedAoiId: string | null;
  selectedAoiName: string | null;
  selectedSceneId: string | null;
  selectedSceneName: string | null;
}

function resolveMessage(
  status: SpatialCoverageUiStatus,
  hasAoi: boolean,
  hasScene: boolean,
  apiMessage: string | null,
  error: string | null,
): string {
  if (status === "error" && error) {
    return error;
  }

  if (!hasAoi || !hasScene) {
    return "Seleccioná un AOI y una escena para evaluar cobertura.";
  }

  if (status === "loading") {
    return "Evaluando cobertura espacial...";
  }

  if (status === "full") {
    return "El AOI está completamente cubierto por la escena.";
  }

  if (status === "partial") {
    return "El AOI está parcialmente cubierto por la escena.";
  }

  if (status === "none") {
    return "El AOI está fuera del footprint de la escena.";
  }

  return apiMessage ?? "Seleccioná un AOI y una escena para evaluar cobertura.";
}

function statusTone(
  status: SpatialCoverageUiStatus,
): "ok" | "warn" | "muted" | "neutral" {
  if (status === "full") {
    return "ok";
  }
  if (status === "partial" || status === "error" || status === "none") {
    return "warn";
  }
  return "muted";
}

function formatStatusLabel(status: SpatialCoverageUiStatus): string {
  switch (status) {
    case "full":
      return "Full";
    case "partial":
      return "Partial";
    case "none":
      return "None";
    case "loading":
      return "…";
    case "error":
      return "Error";
    default:
      return "—";
  }
}

export default function CoveragePanel({
  selectedAoiId,
  selectedAoiName,
  selectedSceneId,
  selectedSceneName,
}: CoveragePanelProps) {
  const { result, status, error } = useSpatialCoverage(
    selectedAoiId,
    selectedSceneId,
  );

  const message = resolveMessage(
    status,
    Boolean(selectedAoiId),
    Boolean(selectedSceneId),
    result?.message ?? null,
    error,
  );

  return (
    <CollapsibleSection
      title="Footprint / acciones"
      defaultOpen={false}
      badge={
        selectedAoiId && selectedSceneId ? (
          <StatusBadge label={formatStatusLabel(status)} tone={statusTone(status)} />
        ) : null
      }
    >
      <p className="aoi-hint" role="status">
        {message}
      </p>
      <dl className="scene-detail-fields">
        <div className="scene-detail-row">
          <dt>AOI</dt>
          <dd>{selectedAoiName ?? "Ninguno"}</dd>
        </div>
        <div className="scene-detail-row">
          <dt>Escena</dt>
          <dd>{selectedSceneName ?? "Ninguna"}</dd>
        </div>
        {result && (
          <>
            <div className="scene-detail-row">
              <dt>Intersecta</dt>
              <dd>{result.intersects ? "Sí" : "No"}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Cubierto</dt>
              <dd>{result.covered ? "Sí" : "No"}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Cobertura</dt>
              <dd>{result.coverage_percent.toFixed(1)}%</dd>
            </div>
          </>
        )}
      </dl>
    </CollapsibleSection>
  );
}
