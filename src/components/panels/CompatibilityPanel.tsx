import type { SceneRead } from "../../types/scene";
import type { SpectralIndexDefinition } from "../../types/spectralIndex";
import {
  evaluateIndexSceneCompatibility,
  getCompatibilityMessage,
  resolveCompatibilityStatus,
} from "../../utils/indexCompatibility";
import { extractRadiometryFromMetadata } from "../../utils/radiometry";
import {
  detectSensorFromScene,
  getSensorLabel,
} from "../../utils/sensors";
import SectionCard from "../ui/SectionCard";
import StatusBadge from "../ui/StatusBadge";
import RadiometryBadge from "../ui/RadiometryBadge";

interface CompatibilityPanelProps {
  selectedIndex: SpectralIndexDefinition | null;
  selectedScene: SceneRead | null;
}

function formatBandList(bands: string[]): string {
  return bands.length > 0 ? bands.join(", ") : "—";
}

export default function CompatibilityPanel({
  selectedIndex,
  selectedScene,
}: CompatibilityPanelProps) {
  const status = resolveCompatibilityStatus(selectedIndex, selectedScene);
  const result =
    selectedIndex && selectedScene
      ? evaluateIndexSceneCompatibility(selectedIndex, selectedScene)
      : null;
  const message = getCompatibilityMessage(status, result);
  const sensorLabel = selectedScene
    ? getSensorLabel(detectSensorFromScene(selectedScene))
    : null;
  const radiometry = selectedScene
    ? extractRadiometryFromMetadata(selectedScene.metadata)
    : null;

  const statusTone =
    status === "compatible" ? "ok" : status === "incompatible" ? "warn" : "muted";

  return (
    <SectionCard title="Compatibilidad">
      <div className="status-badge-row">
        <StatusBadge
          label={
            status === "compatible"
              ? "Compatible"
              : status === "incompatible"
                ? "No compatible"
                : "Sin evaluar"
          }
          tone={statusTone}
          title={message}
        />
        {sensorLabel ? <StatusBadge label={sensorLabel} /> : null}
      </div>
      {radiometry ? <RadiometryBadge radiometry={radiometry} /> : null}
      <p className="aoi-hint" role="status">
        {message}
      </p>
      {result && (
        <dl className="scene-detail-fields">
          <div className="scene-detail-row">
            <dt>Requeridas</dt>
            <dd>{formatBandList(result.required_bands)}</dd>
          </div>
          <div className="scene-detail-row">
            <dt>Disponibles</dt>
            <dd>{formatBandList(result.available_bands)}</dd>
          </div>
          <div className="scene-detail-row">
            <dt>Faltantes</dt>
            <dd
              className={
                result.missing_bands.length > 0
                  ? "compatibility-missing"
                  : undefined
              }
            >
              {formatBandList(result.missing_bands)}
            </dd>
          </div>
        </dl>
      )}
    </SectionCard>
  );
}
