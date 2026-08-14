import type { LayerLegendSpec } from "../../utils/mapInspector";

interface LayerLegendProps {
  spec: LayerLegendSpec;
}

/** Compact qualitative legend for the active raster overlay. */
export default function LayerLegend({ spec }: LayerLegendProps) {
  if (spec.kind === "rgb") {
    return (
      <div className="layer-legend" aria-label="Leyenda RGB">
        <p className="layer-legend-title">{spec.title}</p>
        {spec.bandsLabel ? (
          <p className="layer-legend-bands">{spec.bandsLabel}</p>
        ) : (
          <p className="aoi-hint">Bandas no disponibles para esta capa.</p>
        )}
      </div>
    );
  }

  return (
    <div className="layer-legend" aria-label="Leyenda de índice">
      <div
        className="layer-legend-bar"
        style={{ background: spec.gradient }}
        role="img"
        aria-label={spec.stops.map((stop) => stop.label).join(" a ")}
      />
      <div className="layer-legend-labels">
        {spec.stops.map((stop) => (
          <span key={stop.label} className="layer-legend-label">
            <span
              className="layer-legend-swatch"
              style={{ backgroundColor: stop.color }}
              aria-hidden="true"
            />
            {stop.label}
          </span>
        ))}
      </div>
    </div>
  );
}
