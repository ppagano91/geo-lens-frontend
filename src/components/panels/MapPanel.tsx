import { Crosshair, X } from "lucide-react";
import type { ActiveRasterOverlay } from "../../hooks/useIndexMapOverlay";
import type { AoiRecord } from "../../types/aoi";
import type { DerivedAssetRead } from "../../types/derivedAsset";
import type { SceneListItem } from "../../types/scene";
import {
  formatCursorLine,
  formatMapZoom,
  getLayerLegendSpec,
  overlayKindLabel,
  overlayProductKeyLabel,
  overlayProductName,
  resolveOverlayInspectorContext,
  type MapCursorPosition,
} from "../../utils/mapInspector";
import BasemapSelector from "../map/BasemapSelector";
import LayerLegend from "../map/LayerLegend";
import IconButton from "../ui/IconButton";
import RadiometryBadge from "../ui/RadiometryBadge";
import SectionCard from "../ui/SectionCard";

interface MapPanelProps {
  basemapId: string;
  onBasemapChange: (basemapId: string) => void;
  overlay: ActiveRasterOverlay | null;
  overlayLoading: boolean;
  scenes: SceneListItem[];
  aois: AoiRecord[];
  derivedAssets: DerivedAssetRead[];
  cursor: MapCursorPosition | null;
  zoom: number | null;
  onOpacityChange: (opacity: number) => void;
  onFitOverlay: () => void;
  onRemoveOverlay: () => void;
}

function DetailRow({
  label,
  value,
  wrap = false,
}: {
  label: string;
  value: string;
  wrap?: boolean;
}) {
  return (
    <div className={`scene-detail-row${wrap ? " scene-detail-row--wrap" : ""}`}>
      <dt>{label}</dt>
      <dd title={value}>{value}</dd>
    </div>
  );
}

export default function MapPanel({
  basemapId,
  onBasemapChange,
  overlay,
  overlayLoading,
  scenes,
  aois,
  derivedAssets,
  cursor,
  zoom,
  onOpacityChange,
  onFitOverlay,
  onRemoveOverlay,
}: MapPanelProps) {
  const context = overlay
    ? resolveOverlayInspectorContext(overlay, scenes, aois, derivedAssets)
    : null;
  const legendSpec = overlay
    ? getLayerLegendSpec(
        overlay.productKey,
        overlay.kind,
        context?.rgbBandsLabel ?? null,
      )
    : null;
  const coords = formatCursorLine(cursor);
  const opacityPct = overlay ? Math.round(overlay.opacity * 100) : 0;

  return (
    <div className="map-panel panel-stack">
      <SectionCard title="Mapa base">
        <BasemapSelector value={basemapId} onChange={onBasemapChange} />
      </SectionCard>

      <SectionCard
        title="Capa activa"
        help="Inspeccioná la capa raster que está en el mapa. Agregala desde Índices, Composiciones o Resultados."
      >
        {!overlay && !overlayLoading ? (
          <div className="map-inspector-empty" role="status">
            <p className="map-inspector-empty-title">
              No hay capa raster activa
            </p>
            <p className="aoi-hint">
              Agregá un índice, composición RGB o resultado al mapa para
              inspeccionarlo acá.
            </p>
          </div>
        ) : null}

        {overlayLoading && !overlay ? (
          <p className="aoi-hint" role="status">
            Cargando capa raster…
          </p>
        ) : null}

        {overlay && context ? (
          <>
            <p className="map-inspector-layer-name">
              {overlayProductName(overlay.productKey, overlay.kind)}
            </p>
            <dl className="scene-detail-fields">
              <DetailRow
                label="Producto"
                value={overlayProductKeyLabel(overlay.productKey)}
              />
              <DetailRow
                label="Tipo"
                value={overlayKindLabel(overlay.kind)}
              />
              <DetailRow
                label="Escena"
                value={context.sceneName ?? overlay.sceneId.slice(0, 8)}
                wrap
              />
              {overlay.aoiId ? (
                <DetailRow
                  label="AOI"
                  value={context.aoiName ?? overlay.aoiId.slice(0, 8)}
                  wrap
                />
              ) : null}
              <DetailRow
                label="product_key"
                value={overlay.productKey}
              />
            </dl>
            {context.radiometry ? (
              <RadiometryBadge radiometry={context.radiometry} />
            ) : (
              <p className="aoi-hint">Radiometría no disponible.</p>
            )}
            <div
              className="index-overlay-controls map-inspector-controls"
              aria-label="Controles de capa activa"
            >
              <label
                className="aoi-field-label"
                htmlFor="map-inspector-opacity"
              >
                Opacidad ({opacityPct}%)
              </label>
              <input
                id="map-inspector-opacity"
                className="index-overlay-opacity"
                type="range"
                min={0}
                max={100}
                step={1}
                value={opacityPct}
                onChange={(event) =>
                  onOpacityChange(Number(event.target.value) / 100)
                }
              />
              <div
                className="aoi-icon-actions"
                role="group"
                aria-label="Acciones de capa"
              >
                <IconButton label="Centrar capa" onClick={onFitOverlay}>
                  <Crosshair size={16} strokeWidth={2} aria-hidden="true" />
                </IconButton>
                <IconButton label="Quitar capa" onClick={onRemoveOverlay}>
                  <X size={16} strokeWidth={2} aria-hidden="true" />
                </IconButton>
              </div>
            </div>
          </>
        ) : null}
      </SectionCard>

      {overlay && legendSpec ? (
        <SectionCard title="Leyenda">
          <LayerLegend spec={legendSpec} />
        </SectionCard>
      ) : null}

      <SectionCard title="Cursor / zoom">
        <dl className="scene-detail-fields">
          <DetailRow label="Lat" value={coords.lat} />
          <DetailRow label="Lon" value={coords.lon} />
          <DetailRow label="Zoom" value={formatMapZoom(zoom)} />
        </dl>
      </SectionCard>
    </div>
  );
}
