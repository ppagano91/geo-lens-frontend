import { useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import BasemapSelector from "./components/map/BasemapSelector";
import MapView from "./components/map/MapView";
import AoiPanel from "./components/panels/AoiPanel";
import IndexPanel from "./components/panels/IndexPanel";
import IngestPanel from "./components/panels/IngestPanel";
import ScenePanel from "./components/panels/ScenePanel";
import { DEFAULT_BASEMAP_ID } from "./config/basemaps";
import { useAoiWorkspace } from "./hooks/useAoiWorkspace";
import { useIndexMapOverlay } from "./hooks/useIndexMapOverlay";
import { useLocalSceneIngest } from "./hooks/useLocalSceneIngest";
import { useScenes } from "./hooks/useScenes";
import { useSpectralIndices } from "./hooks/useSpectralIndices";
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

  const selectedSavedAoi = workspace.selectedSavedId
    ? workspace.saved.aois.find((aoi) => aoi.id === workspace.selectedSavedId)
    : undefined;

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

  return (
    <AppLayout
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      aoi={
        <AoiPanel
          statusMessage={workspace.statusMessage}
          isDrawing={workspace.drawing.isDrawing}
          canFinish={workspace.drawing.canFinish}
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
        />
      }
      map={<BasemapSelector value={basemapId} onChange={setBasemapId} />}
    >
      <MapView
        basemapId={basemapId}
        isDrawing={workspace.drawing.isDrawing}
        draftVertices={workspace.drawing.draftVertices}
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
      />
    </AppLayout>
  );
}
