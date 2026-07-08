import AppLayout from "./components/layout/AppLayout";
import MapView from "./components/map/MapView";
import AoiPanel from "./components/panels/AoiPanel";
import { useAoiWorkspace } from "./hooks/useAoiWorkspace";

export default function App() {
  const workspace = useAoiWorkspace();

  return (
    <AppLayout
      sidebar={
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
    >
      <MapView
        isDrawing={workspace.drawing.isDrawing}
        draftVertices={workspace.drawing.draftVertices}
        completedAoi={workspace.drawing.completedAoi}
        fitBoundsTrigger={workspace.fitBoundsTrigger}
        onMapClick={workspace.drawing.addVertex}
      />
    </AppLayout>
  );
}
