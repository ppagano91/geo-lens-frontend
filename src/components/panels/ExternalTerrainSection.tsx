import {
  EXTERNAL_TERRAIN_EXAGGERATIONS,
  EXTERNAL_TERRAIN_PROVIDERS,
  isExternalTerrainExaggeration,
  type ExternalTerrainExaggeration,
  type ExternalTerrainProviderId,
} from "../../types/externalTerrain";

interface ExternalTerrainSectionProps {
  enabled: boolean;
  provider: ExternalTerrainProviderId;
  exaggeration: ExternalTerrainExaggeration;
  canEnable: boolean;
  maptilerKeyPresent: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onProviderChange: (provider: ExternalTerrainProviderId) => void;
  onExaggerationChange: (exaggeration: ExternalTerrainExaggeration) => void;
}

function providerWarning(
  provider: ExternalTerrainProviderId,
  maptilerKeyPresent: boolean,
): { text: string; tone: "warn" | "neutral" } | null {
  if (provider === "maptiler" && !maptilerKeyPresent) {
    return {
      tone: "warn",
      text: "MapTiler requiere VITE_MAPTILER_KEY. Configurala en el entorno del frontend; no se pide ni se guarda una clave en la UI.",
    };
  }
  if (provider === "maplibre-demo") {
    return {
      tone: "warn",
      text: "Solo para pruebas, no usar como proveedor productivo.",
    };
  }
  if (provider === "aws-terrarium") {
    return {
      tone: "neutral",
      text: "Sin API key. Servicio público experimental.",
    };
  }
  return null;
}

export default function ExternalTerrainSection({
  enabled,
  provider,
  exaggeration,
  canEnable,
  maptilerKeyPresent,
  onEnabledChange,
  onProviderChange,
  onExaggerationChange,
}: ExternalTerrainSectionProps) {
  const warning = providerWarning(provider, maptilerKeyPresent);

  return (
    <div className="map-dem-subsection">
      <h4 className="map-dem-subsection-title">Relieve externo</h4>
      <p className="aoi-hint">
        El relieve externo usa tiles públicos/servicios externos. Puede
        requerir API key o tener límites.
      </p>

      <div className="aoi-field">
        <label className="aoi-field-label" htmlFor="map-external-terrain-provider">
          Proveedor
        </label>
        <select
          id="map-external-terrain-provider"
          className="aoi-input"
          value={provider}
          onChange={(event) =>
            onProviderChange(event.target.value as ExternalTerrainProviderId)
          }
        >
          {EXTERNAL_TERRAIN_PROVIDERS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {warning ? (
        <p
          className={
            warning.tone === "warn"
              ? "compatibility-status compatibility-status--warn"
              : "compatibility-status compatibility-status--neutral"
          }
          role={warning.tone === "warn" ? "alert" : "status"}
        >
          {warning.text}
        </p>
      ) : null}

      <div className="aoi-field ingest-checkbox-field">
        <label
          className="ingest-checkbox-label"
          htmlFor="map-external-terrain-enabled"
        >
          <input
            id="map-external-terrain-enabled"
            type="checkbox"
            checked={enabled}
            disabled={!canEnable}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          Activar relieve externo
        </label>
      </div>

      <div className="aoi-field">
        <label
          className="aoi-field-label"
          htmlFor="map-external-terrain-exaggeration"
        >
          Exageración
        </label>
        <select
          id="map-external-terrain-exaggeration"
          className="aoi-input"
          value={String(exaggeration)}
          disabled={!enabled}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (isExternalTerrainExaggeration(value)) {
              onExaggerationChange(value);
            }
          }}
        >
          {EXTERNAL_TERRAIN_EXAGGERATIONS.map((value) => (
            <option key={value} value={String(value)}>
              {value}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
