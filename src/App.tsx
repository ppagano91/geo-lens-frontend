import AppLayout from "./components/layout/AppLayout";
import MapView from "./components/map/MapView";
import AoiPanel from "./components/panels/AoiPanel";
import ScenePanel from "./components/panels/ScenePanel";
import { useAoiWorkspace } from "./hooks/useAoiWorkspace";
import { useScenes } from "./hooks/useScenes";

export default function App() {
  const workspace = useAoiWorkspace();
  const scenes = useScenes();

  return (
    <AppLayout
      sidebar={
        <>
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
          <ScenePanel
            scenes={scenes.scenes}
            selectedScene={scenes.selectedScene}
            selectedSceneId={scenes.selectedSceneId}
            listLoading={scenes.listLoading}
            detailLoading={scenes.detailLoading}
            deletingId={scenes.deletingId}
            error={scenes.error}
            onRefreshList={() => void scenes.refreshScenes()}
            onSelectScene={scenes.selectScene}
            onDeleteScene={scenes.removeScene}
          />
        </>
      }
    >
      <MapView
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
