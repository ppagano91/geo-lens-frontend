import { useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import BasemapSelector from "./components/map/BasemapSelector";
import MapView from "./components/map/MapView";
import AoiPanel from "./components/panels/AoiPanel";
import IndexPanel from "./components/panels/IndexPanel";
import ScenePanel from "./components/panels/ScenePanel";
import { DEFAULT_BASEMAP_ID } from "./config/basemaps";
import { useAoiWorkspace } from "./hooks/useAoiWorkspace";
import { useScenes } from "./hooks/useScenes";
import { useSpectralIndices } from "./hooks/useSpectralIndices";

export default function App() {
  const [basemapId, setBasemapId] = useState(DEFAULT_BASEMAP_ID);
  const workspace = useAoiWorkspace();
  const scenes = useScenes();
  const spectralIndices = useSpectralIndices();

  const selectedSavedAoi = workspace.selectedSavedId
    ? workspace.saved.aois.find((aoi) => aoi.id === workspace.selectedSavedId)
    : undefined;

  return (
    <AppLayout
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
          onRefreshList={() => void scenes.refreshScenes()}
          onSelectScene={scenes.selectScene}
          onDeleteScene={scenes.removeScene}
        />
      }
      indices={
        <IndexPanel
          indices={spectralIndices.indices}
          selectedIndex={spectralIndices.selectedIndex}
          selectedIndexKey={spectralIndices.selectedIndexKey}
          selectedScene={scenes.selectedScene}
          categoryFilter={spectralIndices.categoryFilter}
          listLoading={spectralIndices.listLoading}
          detailLoading={spectralIndices.detailLoading}
          error={spectralIndices.error}
          onRefreshList={() => void spectralIndices.refreshIndices()}
          onSelectIndex={spectralIndices.selectIndex}
          onCategoryFilterChange={spectralIndices.setCategoryFilter}
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
        onMapClick={workspace.drawing.addVertex}
      />
    </AppLayout>
  );
}
