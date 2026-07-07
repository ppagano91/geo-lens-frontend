import AppLayout from "./components/layout/AppLayout";
import MapView from "./components/map/MapView";
import AoiPanel from "./components/panels/AoiPanel";
import { useAoiDrawing } from "./hooks/useAoiDrawing";

export default function App() {
  const aoi = useAoiDrawing();

  return (
    <AppLayout
      sidebar={
        <AoiPanel
          statusMessage={aoi.statusMessage}
          isDrawing={aoi.isDrawing}
          canFinish={aoi.canFinish}
          hasAoi={aoi.hasAoi}
          completedAoi={aoi.completedAoi}
          onStartDrawing={aoi.startDrawing}
          onFinishDrawing={aoi.finishDrawing}
          onClearAoi={aoi.clearAoi}
        />
      }
    >
      <MapView
        isDrawing={aoi.isDrawing}
        draftVertices={aoi.draftVertices}
        completedAoi={aoi.completedAoi}
        onMapClick={aoi.addVertex}
      />
    </AppLayout>
  );
}
