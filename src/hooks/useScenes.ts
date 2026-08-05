import { useCallback, useEffect, useState } from "react";
import {
  deleteScene,
  getSceneById,
  listScenes,
} from "../api/sceneApi";
import { ApiError } from "../api/client";
import type { SceneListItem, SceneRead } from "../types/scene";

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }

  if (err instanceof TypeError) {
    return "No se pudo conectar a la API. Verificá que el backend esté levantado.";
  }

  return fallback;
}

export function useScenes() {
  const [scenes, setScenes] = useState<SceneListItem[]>([]);
  const [selectedScene, setSelectedScene] = useState<SceneRead | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);

  const refreshScenes = useCallback(async () => {
    setListLoading(true);
    setError(null);

    try {
      const data = await listScenes();
      setScenes(data);

      setSelectedSceneId((currentId) => {
        if (currentId && !data.some((scene) => scene.id === currentId)) {
          setSelectedScene(null);
          return null;
        }
        return currentId;
      });
    } catch (err) {
      setError(formatApiError(err, "No se pudo cargar la lista de escenas"));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshScenes();
  }, [refreshScenes]);

  const selectScene = useCallback(async (sceneId: string) => {
    setDetailLoading(true);
    setError(null);
    setSuccessMessage(null);
    setSelectedSceneId(sceneId);

    try {
      const scene = await getSceneById(sceneId);
      setSelectedScene(scene);
      setFitBoundsTrigger((value) => value + 1);
    } catch (err) {
      setSelectedScene(null);
      setSelectedSceneId(null);
      setError(formatApiError(err, "No se pudo cargar el detalle de la escena"));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const deselectScene = useCallback(() => {
    setSelectedSceneId(null);
    setSelectedScene(null);
    setError(null);
    setSuccessMessage(null);
  }, []);

  const removeScene = useCallback(
    async (sceneId: string) => {
      setDeletingId(sceneId);
      setError(null);
      setSuccessMessage(null);

      try {
        await deleteScene(sceneId);
        setScenes((current) => current.filter((scene) => scene.id !== sceneId));
        setSuccessMessage("Escena dada de baja correctamente");

        if (selectedSceneId === sceneId) {
          setSelectedSceneId(null);
          setSelectedScene(null);
        }
      } catch (err) {
        setError(formatApiError(err, "No se pudo dar de baja la escena"));
        throw err;
      } finally {
        setDeletingId(null);
      }
    },
    [selectedSceneId],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    scenes,
    selectedScene,
    selectedSceneId,
    listLoading,
    detailLoading,
    deletingId,
    error,
    successMessage,
    fitBoundsTrigger,
    refreshScenes,
    selectScene,
    deselectScene,
    removeScene,
    clearError,
  };
}
