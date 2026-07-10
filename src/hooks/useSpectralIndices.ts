import { useCallback, useEffect, useState } from "react";
import { getIndexByKey, listIndices } from "../api/indexApi";
import { ApiError } from "../api/client";
import type { SpectralIndexDefinition } from "../types/spectralIndex";

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }

  if (err instanceof TypeError) {
    return "No se pudo conectar a la API. Verificá que el backend esté levantado.";
  }

  return fallback;
}

export function useSpectralIndices() {
  const [indices, setIndices] = useState<SpectralIndexDefinition[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<SpectralIndexDefinition | null>(
    null,
  );
  const [selectedIndexKey, setSelectedIndexKey] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshIndices = useCallback(async () => {
    setListLoading(true);
    setError(null);

    try {
      const data = await listIndices(
        categoryFilter ? { category: categoryFilter } : {},
      );
      setIndices(data);
    } catch (err) {
      setError(formatApiError(err, "Error al cargar índices"));
    } finally {
      setListLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    void refreshIndices();
  }, [refreshIndices]);

  const selectIndex = useCallback(async (indexKey: string) => {
    setDetailLoading(true);
    setError(null);
    setSelectedIndexKey(indexKey);

    try {
      const index = await getIndexByKey(indexKey);
      setSelectedIndex(index);
    } catch (err) {
      setSelectedIndex(null);
      setError(formatApiError(err, "No se pudo cargar el detalle del índice"));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    indices,
    selectedIndex,
    selectedIndexKey,
    categoryFilter,
    listLoading,
    detailLoading,
    error,
    refreshIndices,
    selectIndex,
    setCategoryFilter,
    clearError,
  };
}
