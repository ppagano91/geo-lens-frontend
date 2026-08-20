import { useEffect, useRef, useState } from "react";
import { Copy, Crosshair, X } from "lucide-react";
import type { ActiveDemOverlay } from "../../hooks/useDemOverlay";
import type { ActiveRasterOverlay } from "../../hooks/useIndexMapOverlay";
import type { AoiRecord } from "../../types/aoi";
import type { DemAssetRead } from "../../types/dem";
import type { DerivedAssetRead } from "../../types/derivedAsset";
import type {
  ExternalTerrainExaggeration,
  ExternalTerrainProviderId,
} from "../../types/externalTerrain";
import type { SceneListItem } from "../../types/scene";
import {
  formatCompactLonLat,
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
import DemReliefSection from "./DemReliefSection";
import ExternalTerrainSection from "./ExternalTerrainSection";
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
  dems: DemAssetRead[];
  selectedDem: DemAssetRead | null;
  demOverlay: ActiveDemOverlay | null;
  demListLoading: boolean;
  demUploading: boolean;
  demGenerating: boolean;
  demAddingToMap: boolean;
  demError: string | null;
  demSuccessMessage: string | null;
  onSelectDem: (demId: string) => void;
  onUploadDem: (file: File, name?: string) => Promise<unknown>;
  onGenerateHillshade: (demId: string) => Promise<unknown>;
  onAddDemToMap: (demId: string) => Promise<unknown>;
  onRemoveDemFromMap: () => void;
  onDemOpacityChange: (opacity: number) => void;
  onFitDemOverlay: () => void;
  externalTerrainEnabled: boolean;
  externalTerrainProvider: ExternalTerrainProviderId;
  externalTerrainExaggeration: ExternalTerrainExaggeration;
  externalTerrainCanEnable: boolean;
  maptilerConfigured: boolean;
  externalTerrainConfigLoading: boolean;
  externalTerrainConfigError: string | null;
  onExternalTerrainEnabledChange: (enabled: boolean) => void;
  onExternalTerrainProviderChange: (provider: ExternalTerrainProviderId) => void;
  onExternalTerrainExaggerationChange: (
    exaggeration: ExternalTerrainExaggeration,
  ) => void;
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

type CopyStatus = "copied" | "error" | null;

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) {
      return false;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
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
  dems,
  selectedDem,
  demOverlay,
  demListLoading,
  demUploading,
  demGenerating,
  demAddingToMap,
  demError,
  demSuccessMessage,
  onSelectDem,
  onUploadDem,
  onGenerateHillshade,
  onAddDemToMap,
  onRemoveDemFromMap,
  onDemOpacityChange,
  onFitDemOverlay,
  externalTerrainEnabled,
  externalTerrainProvider,
  externalTerrainExaggeration,
  externalTerrainCanEnable,
  maptilerConfigured,
  externalTerrainConfigLoading,
  externalTerrainConfigError,
  onExternalTerrainEnabledChange,
  onExternalTerrainProviderChange,
  onExternalTerrainExaggerationChange,
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
  const compactCoords = formatCompactLonLat(cursor);
  const opacityPct = overlay ? Math.round(overlay.opacity * 100) : 0;
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
  const copyTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopyCoords = async () => {
    if (!compactCoords) {
      return;
    }
    window.clearTimeout(copyTimerRef.current);
    const ok = await copyToClipboard(compactCoords);
    setCopyStatus(ok ? "copied" : "error");
    copyTimerRef.current = window.setTimeout(() => {
      setCopyStatus(null);
    }, 2000);
  };

  return (
    <div className="map-panel panel-stack">
      <SectionCard
        title="Estado del mapa"
        // help="Zoom actual y coordenadas del cursor. El botón copia lon, lat con 6 decimales."
      >
        <BasemapSelector value={basemapId} onChange={onBasemapChange} />
        <dl className="scene-detail-fields">
          <DetailRow label="Zoom" value={formatMapZoom(zoom)} />
        </dl>
        <div className="map-cursor-coords">
          <p className="map-cursor-coords-line">
            <span className="map-cursor-coords-label">Lon, Lat</span>
            <span className="map-cursor-coords-value">
              {compactCoords ?? "—"}
            </span>
          </p>
          <IconButton
            label="Copiar coordenadas"
            onClick={() => void handleCopyCoords()}
            disabled={!compactCoords}
          >
            <Copy size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </div>
        {copyStatus === "copied" ? (
          <p className="map-copy-feedback" role="status">
            Coordenadas copiadas
          </p>
        ) : null}
        {copyStatus === "error" ? (
          <p className="map-copy-feedback map-copy-feedback--error" role="alert">
            No se pudieron copiar las coordenadas.
          </p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Capa activa"
        help="Inspeccioná el índice o RGB que está en el mapa: opacidad, centrar y quitar."
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
              <DetailRow label="product_key" value={overlay.productKey} />
            </dl>
            {context.radiometry ? (
              <RadiometryBadge radiometry={context.radiometry} />
            ) : (
              <p className="aoi-hint">Radiometría no disponible.</p>
            )}
          </>
        ) : null}
      </SectionCard>

      <SectionCard title="Leyenda">
        {overlay && legendSpec ? (
          <LayerLegend spec={legendSpec} />
        ) : (
          <p className="aoi-hint">
            La leyenda aparece cuando hay una capa raster activa.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Relieve / DEM"
        help="Hillshade 2D del DEM propio, o terrain 3D experimental con tiles externos."
      >
        <div className="map-dem-section">
          <DemReliefSection
            dems={dems}
            selectedDem={selectedDem}
            overlay={demOverlay}
            listLoading={demListLoading}
            uploading={demUploading}
            generating={demGenerating}
            addingToMap={demAddingToMap}
            error={demError}
            successMessage={demSuccessMessage}
            onSelectDem={onSelectDem}
            onUpload={onUploadDem}
            onGenerateHillshade={onGenerateHillshade}
            onAddToMap={onAddDemToMap}
            onRemoveFromMap={onRemoveDemFromMap}
            onOpacityChange={onDemOpacityChange}
            onFitOverlay={onFitDemOverlay}
          />
          <ExternalTerrainSection
            enabled={externalTerrainEnabled}
            provider={externalTerrainProvider}
            exaggeration={externalTerrainExaggeration}
            canEnable={externalTerrainCanEnable}
            maptilerConfigured={maptilerConfigured}
            configLoading={externalTerrainConfigLoading}
            configError={externalTerrainConfigError}
            onEnabledChange={onExternalTerrainEnabledChange}
            onProviderChange={onExternalTerrainProviderChange}
            onExaggerationChange={onExternalTerrainExaggerationChange}
          />
        </div>
      </SectionCard>
    </div>
  );
}
