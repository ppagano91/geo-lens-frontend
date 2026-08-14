import type {
  IngestMode,
  LocalSceneIngestFormValues,
  LocalSceneIngestResult,
  SentinelProductLevelChoice,
} from "../../types/ingest";
import {
  INGEST_MODES,
  INGEST_SOURCE_BAND_HINTS,
  LOCAL_SCENE_SOURCES,
  SENTINEL_PRODUCT_LEVEL_OPTIONS,
} from "../../types/ingest";
import {
  compatibleIndicesLabel,
  formatAcquisitionDate,
  formatSelectedFilesLabel,
  getSentinelSwirBandBadge,
  hasSentinelSwirResampled,
  hasSentinelSwirResolutionWarning,
  isAuxiliaryMetadataFile,
  summarizeIngestRaster,
} from "../../utils/ingest";
import {
  extractRadiometryFromMetadata,
  normalizeRadiometry,
} from "../../utils/radiometry";
import CollapsibleSection from "../ui/CollapsibleSection";
import SectionCard from "../ui/SectionCard";
import StatusBadge from "../ui/StatusBadge";
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

  const sourceHelp = isUpload
    ? "Subí bandas Landsat 8 o Sentinel-2. La app las guarda en storage interno y registra la escena."
    : "Registrá una carpeta de bandas GeoTIFF ya presente bajo DATA_ROOT (modo admin/dev).";

  return (
    <section className="ingest-panel panel-stack" aria-label="Ingesta de escenas">
      <p className="sidebar-label">Ingesta</p>

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
        className="ingest-form panel-stack"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <SectionCard title="Fuente de datos" help={sourceHelp}>
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
        </SectionCard>

        <SectionCard
          title="Archivos / carpeta"
          help={`Bandas esperadas: ${bandHint}`}
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
                accept={
                  form.source === "sentinel-2"
                    ? ".tif,.tiff,.TIF,.TIFF,.xml,.safe,.XML,.SAFE"
                    : ".tif,.tiff,.TIF,.TIFF,.txt"
                }
                onChange={(event) => {
                  const list = event.target.files;
                  onFormChange("files", list ? Array.from(list) : []);
                }}
                disabled={submitting}
              />
              <p className="aoi-hint">
                {formatSelectedFilesLabel(form.files)}
              </p>
              {form.files.length > 0 && (
                <ul className="ingest-file-list">
                  {form.files.map((file) => (
                    <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                      {file.name}
                      {isAuxiliaryMetadataFile(file.name) ? (
                        <span className="ingest-file-meta-tag"> metadata</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {form.source === "sentinel-2" && (
                <p className="aoi-hint">
                  XML / manifest.safe se guardan como metadata auxiliar.
                </p>
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
                onChange={(event) =>
                  onFormChange("scenePath", event.target.value)
                }
                placeholder={
                  form.source === "sentinel-2"
                    ? "sample/scenes/sentinel2_10m"
                    : "sample/scenes/landsat8_lc08_225084"
                }
                disabled={submitting}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          )}
        </SectionCard>

        <CollapsibleSection
          title="Metadata opcional"
          defaultOpen
          help="Nombre, Product ID y nivel Sentinel-2. Si las bandas vienen de JP2→GeoTIFF, indique nivel o Product ID original."
        >
          <div className="aoi-field">
            <label className="aoi-field-label" htmlFor="ingest-name">
              Nombre de escena
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

          {form.source === "sentinel-2" && (
            <>
              <div className="aoi-field">
                <label
                  className="aoi-field-label"
                  htmlFor="ingest-source-product-id"
                >
                  Product ID original
                </label>
                <input
                  id="ingest-source-product-id"
                  className="aoi-input"
                  type="text"
                  value={form.sourceProductId}
                  onChange={(event) =>
                    onFormChange("sourceProductId", event.target.value)
                  }
                  placeholder="S2B_MSIL1C_20181226T141039_N0207_R110_T20JLL_20181226T172720"
                  maxLength={255}
                  disabled={submitting}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="aoi-field">
                <label
                  className="aoi-field-label"
                  htmlFor="ingest-sentinel-level"
                >
                  Nivel de producto Sentinel-2
                </label>
                <select
                  id="ingest-sentinel-level"
                  className="aoi-input"
                  value={form.sentinelProductLevel}
                  onChange={(event) =>
                    onFormChange(
                      "sentinelProductLevel",
                      event.target.value as SentinelProductLevelChoice,
                    )
                  }
                  disabled={submitting}
                >
                  {SENTINEL_PRODUCT_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value || "auto"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="aoi-field ingest-checkbox-field">
            <label className="ingest-checkbox-label" htmlFor="ingest-overwrite" title={isUpload ? "Reemplazar si ya existe una escena del mismo path interno" : "Reemplazar si ya existe una escena del mismo path"}>
              <input
                id="ingest-overwrite"
                type="checkbox"
                checked={form.overwrite}
                onChange={(event) =>
                  onFormChange("overwrite", event.target.checked)
                }
                disabled={submitting}
              />
              <span>Overwrite</span>
            </label>
          </div>
        </CollapsibleSection>

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
        <>
          <SectionCard title="Resultado de ingesta">
            <div className="status-badge-row">
              <StatusBadge label={result.sensor} />
              {result.overwritten ? (
                <StatusBadge label="Overwrite" tone="warn" />
              ) : null}
            </div>
            {radiometry && <RadiometryBadge radiometry={radiometry} />}
            {(result.metadata_files_detected?.length ?? 0) > 0 && (
              <p className="aoi-hint" role="status">
                Metadata SAFE: {result.metadata_files_detected?.join(", ")}
              </p>
            )}
            {(swirWarning || swirResampled) && (
              <StatusBadge
                label={
                  swirResampled
                    ? "SWIR remuestreado a 10 m"
                    : "SWIR 20 m sin alinear"
                }
                tone={swirResampled ? "ok" : "warn"}
                title={
                  swirResampled
                    ? "B11/B12 a 20 m detectadas. Remuestreo bilinear aplicado a la grilla 10 m (referencia B08)."
                    : "B11/B12 a 20 m detectadas; si no se pudieron alinear, NBR/NDMI pueden quedar incompatibles."
                }
              />
            )}
            <dl className="scene-detail-fields">
              <div className="scene-detail-row">
                <dt>Nombre</dt>
                <dd>{result.name}</dd>
              </div>
              <div className="scene-detail-row">
                <dt>Fecha</dt>
                <dd>{formatAcquisitionDate(result.acquisition_date)}</dd>
              </div>
              <div className="scene-detail-row">
                <dt>Path</dt>
                <dd title={result.scene_path}>{result.scene_path}</dd>
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
              <div className="scene-detail-row">
                <dt>scene_id</dt>
                <dd>
                  <code className="ingest-scene-id">{result.scene_id}</code>
                </dd>
              </div>
            </dl>
            {radiometry && (
              <CollapsibleSection title="Radiometría" defaultOpen={false}>
                <RadiometryBadge radiometry={radiometry} detailed />
              </CollapsibleSection>
            )}
            <div className="aoi-actions">
              <button
                type="button"
                className="aoi-button"
                onClick={() => onUseInIndices(result.scene_id)}
              >
                Usar esta escena en Índices
              </button>
            </div>
          </SectionCard>

          {result.warnings.length > 0 && (
            <CollapsibleSection
              title="Advertencias"
              defaultOpen
              badge={
                <StatusBadge
                  label={String(result.warnings.length)}
                  tone="warn"
                />
              }
            >
              <ul className="ingest-warning-list">
                {result.warnings.map((warning, index) => (
                  <li
                    key={`${warning.code}-${index}`}
                    className={`ingest-warning-item ingest-warning-item--${warning.severity ?? "warning"}`}
                  >
                    <strong className="ingest-warning-title">
                      {warning.title}
                    </strong>
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
            </CollapsibleSection>
          )}

          <CollapsibleSection
            title="Bandas detectadas"
            defaultOpen={false}
            badge={
              <StatusBadge label={String(result.bands.length)} tone="neutral" />
            }
          >
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
          </CollapsibleSection>

          <CollapsibleSection title="Índices compatibles" defaultOpen={false}>
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
          </CollapsibleSection>
        </>
      )}
    </section>
  );
}
