import { useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import BasemapSelector from "./components/map/BasemapSelector";
import MapView from "./components/map/MapView";
import AoiPanel from "./components/panels/AoiPanel";
import DerivedAssetsPanel from "./components/panels/DerivedAssetsPanel";
import IndexPanel from "./components/panels/IndexPanel";
import IngestPanel from "./components/panels/IngestPanel";
import RgbCompositePanel from "./components/panels/RgbCompositePanel";
import ScenePanel from "./components/panels/ScenePanel";
import { DEFAULT_BASEMAP_ID } from "./config/basemaps";
import { useAoiWorkspace } from "./hooks/useAoiWorkspace";
import { useDerivedAssets } from "./hooks/useDerivedAssets";
import { useIndexMapOverlay } from "./hooks/useIndexMapOverlay";
import { useLocalSceneIngest } from "./hooks/useLocalSceneIngest";
import { useScenes } from "./hooks/useScenes";
import { useSpectralIndices } from "./hooks/useSpectralIndices";
import type { DerivedAssetRead } from "./types/derivedAsset";
import {
  DEFAULT_SIDEBAR_TAB,
  type SidebarTabId,
} from "./types/sidebar";

export default function App() {
  const [basemapId, setBasemapId] = useState(DEFAULT_BASEMAP_ID);
  const [activeTab, setActiveTab] =
    useState<SidebarTabId>(DEFAULT_SIDEBAR_TAB);
  const workspace = useAoiWorkspace();
  const scenes = useScenes();
  const spectralIndices = useSpectralIndices();
  const ingest = useLocalSceneIngest();
  const indexOverlay = useIndexMapOverlay();
  const derived = useDerivedAssets(scenes.selectedSceneId);

  const selectedSavedAoi = workspace.selectedSavedId
    ? workspace.saved.aois.find((aoi) => aoi.id === workspace.selectedSavedId)
    : undefined;

  const handleActiveTabChange = (tabId: SidebarTabId) => {
    if (tabId !== "aoi" && workspace.drawing.isDrawing) {
      workspace.handleCancelDrawing();
    }
    setActiveTab(tabId);
  };

  const handleIngestSubmit = async () => {
    const result = await ingest.ingest();
    if (!result) {
      return;
    }

    await scenes.refreshScenes();
  };

  const handleUseInIndices = async (sceneId: string) => {
    await scenes.selectScene(sceneId);
    setActiveTab("indices");
  };

  const handleViewInResults = () => {
    void derived.refreshAssets();
    setActiveTab("resultados");
  };

  const handleAddDerivedToMap = (asset: DerivedAssetRead) => {
    switch (asset.asset_type) {
      case "index":
        void indexOverlay.addToMap(asset.scene_id, asset.product_key);
        break;
      case "index_aoi_crop":
        if (asset.aoi_id) {
          void indexOverlay.addCropToMap(
            asset.scene_id,
            asset.product_key,
            asset.aoi_id,
          );
        }
        break;
      case "rgb_composite":
        void indexOverlay.addRgbToMap(asset.scene_id, asset.product_key);
        break;
      case "rgb_composite_aoi":
        if (asset.aoi_id) {
          void indexOverlay.addRgbAoiToMap(
            asset.scene_id,
            asset.aoi_id,
            asset.product_key,
          );
        }
        break;
      default:
        break;
    }
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onActiveTabChange={handleActiveTabChange}
      aoi={
        <AoiPanel
          statusMessage={workspace.statusMessage}
          isDrawing={workspace.drawing.isDrawing}
          canFinish={workspace.drawing.canFinish}
          canUndo={workspace.drawing.canUndo}
          pointCount={workspace.drawing.pointCount}
          hasAoi={workspace.drawing.hasAoi}
          completedAoi={workspace.drawing.completedAoi}
          aoiName={workspace.aoiName}
          aoiDescription={workspace.aoiDescription}
          canSave={workspace.canSave}
          saving={workspace.saved.saving}
          listLoading={workspace.saved.listLoading}
          deletingId={workspace.saved.deletingId}
          error={workspace.saved.error}
          selectedSavedId={workspace.selectedSavedId}
          savedAois={workspace.saved.aois}
          onAoiNameChange={workspace.setAoiName}
          onAoiDescriptionChange={workspace.setAoiDescription}
          onStartDrawing={workspace.handleStartDrawing}
          onFinishDrawing={workspace.drawing.finishDrawing}
          onCancelDrawing={workspace.handleCancelDrawing}
          onUndoVertex={workspace.drawing.undoLastVertex}
          onClearAoi={workspace.handleClearAoi}
          onSaveAoi={() => void workspace.handleSaveAoi()}
          onRefreshList={() => void workspace.saved.refreshAois()}
          onSelectSavedAoi={workspace.handleSelectSavedAoi}
          onDeselectSavedAoi={workspace.handleDeselectSavedAoi}
          onDeleteSavedAoi={workspace.handleDeleteSavedAoi}
        />
      }
      scenes={
        <ScenePanel
          scenes={scenes.scenes}
          selectedScene={scenes.selectedScene}
          selectedSceneId={scenes.selectedSceneId}
          selectedAoiId={workspace.selectedSavedId}
          selectedAoiName={selectedSavedAoi?.name ?? null}
          listLoading={scenes.listLoading}
          detailLoading={scenes.detailLoading}
          deletingId={scenes.deletingId}
          error={scenes.error}
          successMessage={scenes.successMessage}
          onRefreshList={() => void scenes.refreshScenes()}
          onSelectScene={scenes.selectScene}
          onDeselectScene={scenes.deselectScene}
          onDeleteScene={scenes.removeScene}
        />
      }
      ingest={
        <IngestPanel
          form={ingest.form}
          submitting={ingest.submitting}
          error={ingest.error}
          successMessage={ingest.successMessage}
          result={ingest.result}
          onFormChange={ingest.updateForm}
          onSubmit={() => void handleIngestSubmit()}
          onUseInIndices={(sceneId) => void handleUseInIndices(sceneId)}
        />
      }
      indices={
        <IndexPanel
          indices={spectralIndices.indices}
          selectedIndex={spectralIndices.selectedIndex}
          selectedIndexKey={spectralIndices.selectedIndexKey}
          scenes={scenes.scenes}
          selectedScene={scenes.selectedScene}
          selectedSceneId={scenes.selectedSceneId}
          scenesLoading={scenes.listLoading}
          sceneDetailLoading={scenes.detailLoading}
          categoryFilter={spectralIndices.categoryFilter}
          listLoading={spectralIndices.listLoading}
          detailLoading={spectralIndices.detailLoading}
          error={spectralIndices.error}
          onRefreshList={() => void spectralIndices.refreshIndices()}
          onSelectIndex={spectralIndices.selectIndex}
          onSelectScene={scenes.selectScene}
          onCategoryFilterChange={spectralIndices.setCategoryFilter}
          savedAois={workspace.saved.aois}
          selectedAoiId={workspace.selectedSavedId}
          selectedAoiName={selectedSavedAoi?.name ?? null}
          onSelectAoi={workspace.handleSelectSavedAoi}
          mapOverlay={indexOverlay.overlay}
          mapOverlayLoading={indexOverlay.loading}
          mapOverlayError={indexOverlay.error}
          onAddIndexToMap={(sceneId, indexKey) =>
            void indexOverlay.addToMap(sceneId, indexKey)
          }
          onAddCropToMap={(sceneId, indexKey, aoiId) =>
            void indexOverlay.addCropToMap(sceneId, indexKey, aoiId)
          }
          onRemoveIndexFromMap={indexOverlay.removeFromMap}
          onIndexOverlayOpacityChange={indexOverlay.setOpacity}
          onFitIndexOverlay={indexOverlay.fitToOverlay}
          findExistingDerived={derived.findExisting}
          onViewInResults={handleViewInResults}
          onDerivedCatalogChanged={() => void derived.refreshAssets()}
        />
      }
      composiciones={
        <RgbCompositePanel
          scenes={scenes.scenes}
          selectedScene={scenes.selectedScene}
          selectedSceneId={scenes.selectedSceneId}
          scenesLoading={scenes.listLoading}
          sceneDetailLoading={scenes.detailLoading}
          onSelectScene={scenes.selectScene}
          savedAois={workspace.saved.aois}
          selectedAoiId={workspace.selectedSavedId}
          selectedAoiName={selectedSavedAoi?.name ?? null}
          onSelectAoi={workspace.handleSelectSavedAoi}
          mapOverlay={indexOverlay.overlay}
          mapOverlayLoading={indexOverlay.loading}
          mapOverlayError={indexOverlay.error}
          onAddRgbToMap={(sceneId, preset) =>
            void indexOverlay.addRgbToMap(sceneId, preset)
          }
          onAddRgbAoiToMap={(sceneId, aoiId, preset) =>
            void indexOverlay.addRgbAoiToMap(sceneId, aoiId, preset)
          }
          onRemoveOverlayFromMap={indexOverlay.removeFromMap}
          onOverlayOpacityChange={indexOverlay.setOpacity}
          onFitOverlay={indexOverlay.fitToOverlay}
          findExistingDerived={derived.findExisting}
          onViewInResults={handleViewInResults}
          onDerivedCatalogChanged={() => void derived.refreshAssets()}
        />
      }
      resultados={
        <DerivedAssetsPanel
          scenes={scenes.scenes}
          selectedSceneId={scenes.selectedSceneId}
          scenesLoading={scenes.listLoading}
          onSelectScene={(sceneId) => void scenes.selectScene(sceneId)}
          savedAois={workspace.saved.aois}
          assets={derived.assets}
          allAssets={derived.allAssets}
          existenceById={derived.existenceById}
          filters={derived.filters}
          onFiltersChange={derived.updateFilters}
          listLoading={derived.listLoading}
          busyAssetId={derived.busyAssetId}
          error={derived.error}
          successMessage={derived.successMessage}
          onRefresh={() => void derived.refreshAssets()}
          onAddToMap={handleAddDerivedToMap}
          onDownload={(asset) => void derived.downloadAsset(asset)}
          onSoftDelete={(assetId) => void derived.removeAsset(assetId)}
          onRestore={(assetId) => void derived.restoreAsset(assetId)}
          mapOverlayLoading={indexOverlay.loading}
        />
      }
      map={<BasemapSelector value={basemapId} onChange={setBasemapId} />}
    >
      <MapView
        basemapId={basemapId}
        isDrawing={workspace.drawing.isDrawing}
        draftVertices={workspace.drawing.draftVertices}
        pointCount={workspace.drawing.pointCount}
        canFinish={workspace.drawing.canFinish}
        canUndo={workspace.drawing.canUndo}
        completedAoi={workspace.drawing.completedAoi}
        fitBoundsTrigger={workspace.fitBoundsTrigger}
        sceneFootprint={scenes.selectedScene?.footprint ?? null}
        sceneName={scenes.selectedScene?.name ?? null}
        sceneFitBoundsTrigger={scenes.fitBoundsTrigger}
        indexOverlayImageUrl={indexOverlay.overlay?.imageUrl ?? null}
        indexOverlayCoordinates={indexOverlay.overlay?.coordinates ?? null}
        indexOverlayOpacity={indexOverlay.overlay?.opacity ?? 0.75}
        indexOverlayFitTrigger={indexOverlay.fitTrigger}
        onMapClick={workspace.drawing.addVertex}
        onFinishDrawing={workspace.drawing.finishDrawing}
        onCancelDrawing={workspace.handleCancelDrawing}
        onUndoVertex={workspace.drawing.undoLastVertex}
      />
    </AppLayout>
  );
}
