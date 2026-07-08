import { useCallback, useEffect, useState } from "react";
import { createAoi, deleteAoi, listAois } from "../api/aoiApi";
import { ApiError } from "../api/client";
import type { AoiCreatePayload, AoiRecord } from "../types/aoi";

export function useAois() {
  const [aois, setAois] = useState<AoiRecord[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );

  const refreshAois = useCallback(async () => {
    setListLoading(true);
    setError(null);

    try {
      const data = await listAois();
      setAois(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo cargar la lista de AOIs";
      setError(message);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAois();
  }, [refreshAois]);

  const saveAoi = useCallback(async (payload: AoiCreatePayload) => {
    setSaving(true);
    setError(null);
    setSaveSuccessMessage(null);

    try {
      const created = await createAoi(payload);
      setSaveSuccessMessage(`AOI "${created.name}" guardado`);
      await refreshAois();
      return created;
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo guardar el AOI";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [refreshAois]);

  const removeAoi = useCallback(
    async (aoiId: string) => {
      setDeletingId(aoiId);
      setError(null);

      try {
        await deleteAoi(aoiId);
        setAois((current) => current.filter((aoi) => aoi.id !== aoiId));
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "No se pudo eliminar el AOI";
        setError(message);
        throw err;
      } finally {
        setDeletingId(null);
      }
    },
    [],
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setSaveSuccessMessage(null);
  }, []);

  return {
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
  };
}
