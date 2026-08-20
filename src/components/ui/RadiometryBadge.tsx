import type { RadiometryInfo } from "../../utils/radiometry";
import {
  isUnknownRadiometry,
  productLevelLabel,
  radiometryTypeLabel,
  UNKNOWN_RADIOMETRY_UI_WARNING,
} from "../../utils/radiometry";

interface RadiometryBadgeProps {
  radiometry: RadiometryInfo | null | undefined;
  /** Show product level + sensor-style details (ingest / scenes). */
  detailed?: boolean;
  className?: string;
}

export default function RadiometryBadge({
  radiometry,
  detailed = false,
  className = "",
}: RadiometryBadgeProps) {
  if (!radiometry) {
    return null;
  }

  const unknown = isUnknownRadiometry(radiometry);
  const typeLabel = radiometryTypeLabel(radiometry.radiometry_type);
  const levelLabel = productLevelLabel(radiometry.product_level);

  return (
    <div
      className={`radiometry-block${unknown ? " radiometry-block--warn" : ""}${className ? ` ${className}` : ""}`}
      role="status"
    >
      <div className="radiometry-badges">
        <span className="radiometry-badge">{typeLabel}</span>
        {radiometry.scale_applied ? (
          <span className="radiometry-badge radiometry-badge--ok">
            Escala aplicada
          </span>
        ) : (
          <span className="radiometry-badge radiometry-badge--muted">
            Sin escala
          </span>
        )}
        {detailed ? (
          <span className="radiometry-badge radiometry-badge--muted">
            {levelLabel}
          </span>
        ) : null}
      </div>
      {detailed ? (
        <dl className="scene-detail-fields radiometry-details">
          <div className="scene-detail-row">
            <dt>Producto</dt>
            <dd>{levelLabel}</dd>
          </div>
          <div className="scene-detail-row">
            <dt>Tipo</dt>
            <dd>{typeLabel}</dd>
          </div>
          <div className="scene-detail-row">
            <dt>Escala</dt>
            <dd>
              {radiometry.scale_applied
                ? `sí (${radiometry.scale_factor ?? "—"} / offset ${radiometry.offset ?? 0})`
                : "no"}
            </dd>
          </div>
          {radiometry.source_product_id ? (
            <div className="scene-detail-row">
              <dt>Product ID</dt>
              <dd title={radiometry.source_product_id}>
                {radiometry.source_product_id}
              </dd>
            </div>
          ) : null}
          {radiometry.radiometry_source ? (
            <div className="scene-detail-row">
              <dt>Origen</dt>
              <dd>{radiometry.radiometry_source}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {(unknown || radiometry.warning) && (
        <p className="radiometry-warning">
          {radiometry.warning?.trim() || UNKNOWN_RADIOMETRY_UI_WARNING}
        </p>
      )}
    </div>
  );
}
