import { useCallback, useState } from "react";
import { useAoiDrawing } from "./useAoiDrawing";
import { useAois } from "./useAois";
import { aoiRecordToFeature } from "../utils/geojson";

export function useAoiWorkspace() {
  const drawing = useAoiDrawing();
  const {
    aois,
    listLoading,
    saving,
    deletingId,
    error,
    saveSuccessMessage,
    refreshAois,
    saveAoi,
    removeAoi,
    clearMessages,
  } = useAois();
  const [aoiName, setAoiName] = useState("");
  const [aoiDescription, setAoiDescription] = useState("");
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);

  const handleSaveAoi = useCallback(async () => {
    if (!drawing.completedAoi || !aoiName.trim()) {
      return;
    }

    clearMessages();

    await saveAoi({
      name: aoiName.trim(),
      description: aoiDescription.trim() || undefined,
      geometry: drawing.completedAoi.geometry,
      properties: { source: "frontend" },
    });
  }, [
    aoiDescription,
    aoiName,
    clearMessages,
    drawing.completedAoi,
    saveAoi,
  ]);

  const handleSelectSavedAoi = useCallback(
    (aoiId: string) => {
      const aoi = aois.find((item) => item.id === aoiId);
      if (!aoi) {
        return;
      }

      clearMessages();
      setSelectedSavedId(aoi.id);
      setAoiName(aoi.name);
      setAoiDescription(aoi.description ?? "");
      drawing.loadAoi(aoiRecordToFeature(aoi));
      setFitBoundsTrigger((value) => value + 1);
    },
    [aois, clearMessages, drawing],
  );

  const handleDeleteSavedAoi = useCallback(
    async (aoiId: string) => {
      clearMessages();
      await removeAoi(aoiId);

      if (selectedSavedId === aoiId) {
        setSelectedSavedId(null);
        drawing.clearAoi();
        setAoiName("");
        setAoiDescription("");
      }
    },
    [clearMessages, drawing, removeAoi, selectedSavedId],
  );

  const handleClearAoi = useCallback(() => {
    drawing.clearAoi();
    setSelectedSavedId(null);
    clearMessages();
  }, [clearMessages, drawing]);

  const handleStartDrawing = useCallback(() => {
    clearMessages();
    setSelectedSavedId(null);
    drawing.startDrawing();
  }, [clearMessages, drawing]);

  const statusMessage = saveSuccessMessage ?? drawing.statusMessage;

  const canSave =
    drawing.status === "ready" &&
    drawing.completedAoi !== null &&
    aoiName.trim().length > 0 &&
    !saving;

  return {
    drawing,
    saved: {
      aois,
      listLoading,
      saving,
      deletingId,
      error,
      refreshAois,
    },
    aoiName,
    aoiDescription,
    selectedSavedId,
    fitBoundsTrigger,
    statusMessage,
    canSave,
    setAoiName,
    setAoiDescription,
    handleSaveAoi,
    handleSelectSavedAoi,
    handleDeleteSavedAoi,
    handleClearAoi,
    handleStartDrawing,
  };
}
