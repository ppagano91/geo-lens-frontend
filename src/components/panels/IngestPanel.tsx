import type {
  IngestMode,
  LocalSceneIngestFormValues,
  LocalSceneIngestResult,
} from "../../types/ingest";
import {
  INGEST_MODES,
  INGEST_SOURCE_BAND_HINTS,
  LOCAL_SCENE_SOURCES,
} from "../../types/ingest";
import {
  compatibleIndicesLabel,
  formatAcquisitionDate,
  formatSelectedFilesLabel,
  getSentinelSwirBandBadge,
  hasSentinelSwirResampled,
  hasSentinelSwirResolutionWarning,
  summarizeIngestRaster,
} from "../../utils/ingest";
import {
  extractRadiometryFromMetadata,
  normalizeRadiometry,
} from "../../utils/radiometry";
import RadiometryBadge from "../ui/RadiometryBadge";

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
  const isUpload = form.mode === "upload";
  const bandHint = INGEST_SOURCE_BAND_HINTS[form.source];
  const swirWarning =
    result != null && hasSentinelSwirResolutionWarning(result);
  const swirResampled = result != null && hasSentinelSwirResampled(result);
  const radiometry =
    result?.radiometry != null
      ? normalizeRadiometry(result.radiometry)
      : result
        ? extractRadiometryFromMetadata(result.metadata)
        : null;

  const handleModeChange = (mode: IngestMode) => {
    onFormChange("mode", mode);
  };

  const canSubmit = isUpload
    ? form.files.length > 0
    : form.scenePath.trim().length > 0;

  return (
    <section className="ingest-panel" aria-label="Ingesta de escenas">
      <p className="sidebar-label">Ingesta / Band Set</p>
      <p className="aoi-hint">
        {isUpload
          ? "Subí bandas Landsat 8 o Sentinel-2 desde tu máquina. La app las guarda en storage interno y registra la escena (sin conocer DATA_ROOT)."
          : "Registrá una carpeta de bandas GeoTIFF ya presente bajo DATA_ROOT (modo admin/dev)."}
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

      <div
        className="ingest-mode-toggle"
        role="tablist"
        aria-label="Modo de ingesta"
      >
        {INGEST_MODES.map((option) => {
          const selected = form.mode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={selected}
              className={
                selected
                  ? "ingest-mode-button ingest-mode-button--active"
                  : "ingest-mode-button"
              }
              onClick={() => handleModeChange(option.value)}
              disabled={submitting}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <form
        className="ingest-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {isUpload ? (
          <div className="aoi-field">
            <label className="aoi-field-label" htmlFor="ingest-files">
              Archivos de bandas
            </label>
            <input
              id="ingest-files"
              className="aoi-input ingest-file-input"
              type="file"
              multiple
              accept=".tif,.tiff,.TIF,.TIFF,.txt"
              onChange={(event) => {
                const list = event.target.files;
                onFormChange(
                  "files",
                  list ? Array.from(list) : [],
                );
              }}
              disabled={submitting}
            />
            <p className="aoi-hint">
              Esperados: {bandHint} {formatSelectedFilesLabel(form.files)}
            </p>
            {form.files.length > 0 && (
              <ul className="ingest-file-list">
                {form.files.map((file) => (
                  <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                    {file.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
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
              placeholder={
                form.source === "sentinel-2"
                  ? "sample/scenes/sentinel2_10m"
                  : "sample/scenes/landsat8_lc08_225084"
              }
              disabled={submitting}
              autoComplete="off"
              spellCheck={false}
            />
            <p className="aoi-hint">
              Relativa a DATA_ROOT. Bandas esperadas: {bandHint}
            </p>
          </div>
        )}

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
            placeholder={
              form.source === "sentinel-2"
                ? "Ej: Sentinel-2 L2A tile"
                : "Ej: Landsat 8 LC08 225/084"
            }
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
            <span>
              {isUpload
                ? "Overwrite — reemplazar si ya existe una escena del mismo path interno"
                : "Overwrite — reemplazar si ya existe una escena del mismo path"}
            </span>
          </label>
        </div>

        <div className="aoi-actions">
          <button
            type="submit"
            className="aoi-button"
            disabled={submitting || !canSubmit}
          >
            {submitting
              ? isUpload
                ? "Subiendo..."
                : "Registrando..."
              : isUpload
                ? "Subir e ingerir escena"
                : "Registrar escena"}
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

          {radiometry && (
            <div className="ingest-radiometry">
              <p className="aoi-field-label">Radiometría</p>
              <RadiometryBadge radiometry={radiometry} detailed />
            </div>
          )}

          {(swirWarning || swirResampled) && (
            <div
              className={`ingest-swir-banner${swirResampled ? " ingest-swir-banner--ok" : ""}`}
              role="status"
            >
              <p className="aoi-field-label">Resampling Sentinel-2</p>
              <p className="ingest-swir-banner-text">
                {swirResampled
                  ? "B11/B12 a 20 m detectadas. Remuestreo bilinear aplicado a la grilla 10 m (referencia B08). Bandas alineadas registradas; NBR/NDMI y composiciones SWIR quedan habilitados cuando correspondan."
                  : "B11/B12 a 20 m detectadas; si no se pudieron alinear, NBR/NDMI pueden quedar incompatibles."}
              </p>
            </div>
          )}

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
              {result.bands.map((band) => {
                const swirBadge = getSentinelSwirBandBadge(band);
                return (
                  <li key={band.band_key} className="scene-band-item">
                    <div className="scene-band-header">
                      <strong className="scene-band-key">{band.band_key}</strong>
                      <span className="scene-band-name">{band.band_name}</span>
                    </div>
                    {swirBadge ? (
                      <div
                        className={`ingest-band-badge ingest-band-badge--${swirBadge.kind}`}
                      >
                        <span className="ingest-band-badge-label">
                          {swirBadge.label}
                        </span>
                        {swirBadge.kind === "resampled" ? (
                          <span className="ingest-band-badge-details">
                            Método: {swirBadge.method} · Referencia:{" "}
                            {swirBadge.reference}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="scene-band-meta">
                      {band.crs && <span>CRS: {band.crs}</span>}
                      <span>
                        {band.width} × {band.height}
                      </span>
                      {band.dtype && <span>Tipo: {band.dtype}</span>}
                    </div>
                    <p className="scene-band-path" title={band.asset_path}>
                      {band.asset_path}
                    </p>
                  </li>
                );
              })}
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
