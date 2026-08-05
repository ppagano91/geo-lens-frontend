import type { LocalSceneIngestFormValues, LocalSceneIngestResult } from "../../types/ingest";
import { LOCAL_SCENE_SOURCES } from "../../types/ingest";
import {
  compatibleIndicesLabel,
  formatAcquisitionDate,
  summarizeIngestRaster,
} from "../../utils/ingest";

interface IngestPanelProps {
  form: LocalSceneIngestFormValues;
  submitting: boolean;
  error: string | null;
  successMessage: string | null;
  result: LocalSceneIngestResult | null;
  onFormChange: <K extends keyof LocalSceneIngestFormValues>(
    key: K,
    value: LocalSceneIngestFormValues[K],
  ) => void;
  onSubmit: () => void;
  onUseInIndices: (sceneId: string) => void;
}

export default function IngestPanel({
  form,
  submitting,
  error,
  successMessage,
  result,
  onFormChange,
  onSubmit,
  onUseInIndices,
}: IngestPanelProps) {
  const raster = result ? summarizeIngestRaster(result.bands) : null;

  return (
    <section className="ingest-panel" aria-label="Ingesta local de escenas">
      <p className="sidebar-label">Ingesta / Band Set</p>
      <p className="aoi-hint">
        Registrá una carpeta de bandas GeoTIFF bajo DATA_ROOT (sin upload ni
        STAC). Por ahora solo Landsat 8.
      </p>

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

      <form
        className="ingest-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="aoi-field">
          <label className="aoi-field-label" htmlFor="ingest-scene-path">
            Ruta de carpeta (scene_path)
          </label>
          <input
            id="ingest-scene-path"
            className="aoi-input"
            type="text"
            value={form.scenePath}
            onChange={(event) => onFormChange("scenePath", event.target.value)}
            placeholder="sample/scenes/landsat8_lc08_225084"
            disabled={submitting}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="aoi-hint">
            Relativa a DATA_ROOT. Ejemplo: sample/scenes/landsat8_lc08_225084
          </p>
        </div>

        <div className="aoi-field">
          <label className="aoi-field-label" htmlFor="ingest-source">
            Sensor / source
          </label>
          <select
            id="ingest-source"
            className="aoi-input"
            value={form.source}
            onChange={(event) =>
              onFormChange(
                "source",
                event.target.value as LocalSceneIngestFormValues["source"],
              )
            }
            disabled={submitting}
          >
            {LOCAL_SCENE_SOURCES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="aoi-field">
          <label className="aoi-field-label" htmlFor="ingest-name">
            Nombre (opcional)
          </label>
          <input
            id="ingest-name"
            className="aoi-input"
            type="text"
            value={form.name}
            onChange={(event) => onFormChange("name", event.target.value)}
            placeholder="Ej: Landsat 8 LC08 225/084"
            maxLength={255}
            disabled={submitting}
          />
        </div>

        <div className="aoi-field ingest-checkbox-field">
          <label className="ingest-checkbox-label" htmlFor="ingest-overwrite">
            <input
              id="ingest-overwrite"
              type="checkbox"
              checked={form.overwrite}
              onChange={(event) =>
                onFormChange("overwrite", event.target.checked)
              }
              disabled={submitting}
            />
            <span>Overwrite — reemplazar si ya existe una escena del mismo path</span>
          </label>
        </div>

        <div className="aoi-actions">
          <button
            type="submit"
            className="aoi-button"
            disabled={submitting || !form.scenePath.trim()}
          >
            {submitting ? "Registrando..." : "Registrar escena"}
          </button>
        </div>
      </form>

      {result && (
        <div className="ingest-result" aria-live="polite">
          <p className="sidebar-label">Resultado</p>

          <dl className="scene-detail-fields">
            <div className="scene-detail-row">
              <dt>scene_id</dt>
              <dd>
                <code className="ingest-scene-id">{result.scene_id}</code>
              </dd>
            </div>
            <div className="scene-detail-row">
              <dt>Nombre</dt>
              <dd>{result.name}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Sensor</dt>
              <dd>{result.sensor}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Fecha</dt>
              <dd>{formatAcquisitionDate(result.acquisition_date)}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Path</dt>
              <dd>{result.scene_path}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>CRS</dt>
              <dd>{raster?.crs ?? "—"}</dd>
            </div>
            <div className="scene-detail-row">
              <dt>Tamaño</dt>
              <dd>
                {raster?.width != null && raster?.height != null
                  ? `${raster.width} × ${raster.height}`
                  : "—"}
              </dd>
            </div>
            <div className="scene-detail-row">
              <dt>Índices</dt>
              <dd>{compatibleIndicesLabel(result)}</dd>
            </div>
            {result.overwritten && (
              <div className="scene-detail-row">
                <dt>Overwrite</dt>
                <dd>Sí — escena previa reemplazada</dd>
              </div>
            )}
          </dl>

          {result.warnings.length > 0 && (
            <div className="ingest-warnings">
              <p className="aoi-field-label">Advertencias</p>
              <ul className="ingest-warning-list">
                {result.warnings.map((warning, index) => (
                  <li
                    key={`${warning.code}-${index}`}
                    className={`ingest-warning-item ingest-warning-item--${warning.severity ?? "warning"}`}
                  >
                    <strong className="ingest-warning-title">{warning.title}</strong>
                    {warning.description ? (
                      <p className="ingest-warning-description">
                        {warning.description}
                      </p>
                    ) : null}
                    {warning.items && warning.items.length > 0 ? (
                      <ul className="ingest-warning-files">
                        {warning.items.map((item) => (
                          <li
                            key={item}
                            className="ingest-warning-file"
                            title={item}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="ingest-bands">
            <p className="aoi-field-label">
              Bandas registradas ({result.bands.length})
            </p>
            <ul className="scene-band-items">
              {result.bands.map((band) => (
                <li key={band.band_key} className="scene-band-item">
                  <div className="scene-band-header">
                    <strong className="scene-band-key">{band.band_key}</strong>
                    <span className="scene-band-name">{band.band_name}</span>
                  </div>
                  <div className="scene-band-meta">
                    {band.crs && <span>CRS: {band.crs}</span>}
                    <span>
                      {band.width} × {band.height}
                    </span>
                    {band.dtype && <span>Tipo: {band.dtype}</span>}
                  </div>
                  <p className="scene-band-path">{band.asset_path}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="ingest-indices">
            <p className="aoi-field-label">Índices disponibles</p>
            <ul className="ingest-index-list">
              {result.available_indices.map((index) => (
                <li
                  key={index.index_key}
                  className={
                    index.compatible
                      ? "ingest-index-item ingest-index-item--ok"
                      : "ingest-index-item ingest-index-item--warn"
                  }
                >
                  <strong>{index.display_name}</strong>
                  <span>
                    {index.compatible
                      ? "compatible"
                      : `faltan: ${index.missing_roles.join(", ") || "roles"}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="aoi-actions">
            <button
              type="button"
              className="aoi-button"
              onClick={() => onUseInIndices(result.scene_id)}
            >
              Usar esta escena en Índices
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
