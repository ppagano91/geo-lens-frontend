import type { SceneRead } from "../../types/scene";
import type { SpectralIndexDefinition } from "../../types/spectralIndex";
import {
  evaluateIndexSceneCompatibility,
  getCompatibilityMessage,
  resolveCompatibilityStatus,
} from "../../utils/indexCompatibility";

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

  const statusClass =
    status === "compatible"
      ? "compatibility-status--ok"
      : status === "incompatible"
        ? "compatibility-status--warn"
        : "compatibility-status--neutral";

  return (
    <section
      className="compatibility-panel"
      aria-label="Compatibilidad índice / escena"
    >
      <p className="aoi-geojson-label">Compatibilidad índice / escena</p>

      <p className={`compatibility-status ${statusClass}`} role="status">
        {message}
      </p>

      <dl className="scene-detail-fields">
        <div className="scene-detail-row">
          <dt>Escena</dt>
          <dd>{selectedScene?.name ?? "Ninguna"}</dd>
        </div>
        <div className="scene-detail-row">
          <dt>Índice</dt>
          <dd>
            {selectedIndex
              ? `${selectedIndex.key.toUpperCase()} — ${selectedIndex.name}`
              : "Ninguno"}
          </dd>
        </div>
        {result && (
          <>
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
            <div className="scene-detail-row">
              <dt>Estado</dt>
              <dd>
                <span className={`compatibility-badge ${statusClass}`}>
                  {result.compatible ? "Compatible" : "No compatible"}
                </span>
              </dd>
            </div>
          </>
        )}
      </dl>
    </section>
  );
}
