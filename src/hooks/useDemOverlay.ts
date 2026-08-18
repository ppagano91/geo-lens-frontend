import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateDemHillshade,
  getDemMapOverlay,
  listDems,
  uploadDem,
} from "../api/demApi";
import { ApiError } from "../api/client";
import { API_BASE_URL } from "../config/env";
import type { DemAssetRead } from "../types/dem";
import type { IndexMapOverlayCoordinates } from "../types/indexCompute";

const DEFAULT_DEM_OPACITY = 0.45;

export interface ActiveDemOverlay {
  demId: string;
  imageUrl: string;
  coordinates: IndexMapOverlayCoordinates;
  width: number;
  height: number;
  crsOriginal: string;
  opacity: number;
}

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof TypeError) {
    return "No se pudo conectar a la API. Verificá que el backend esté levantado.";
  }
  return fallback;
}

function toAbsoluteImageUrl(imageUrl: string, cacheBust: number): string {
  const base = imageUrl.startsWith("http")
    ? imageUrl
    : `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}t=${cacheBust}`;
}

export function useDemOverlay() {
  const [dems, setDems] = useState<DemAssetRead[]>([]);
  const [selectedDemId, setSelectedDemId] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<ActiveDemOverlay | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [addingToMap, setAddingToMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fitTrigger, setFitTrigger] = useState(0);
  const opacityRef = useRef(DEFAULT_DEM_OPACITY);
  const requestIdRef = useRef(0);

  const selectedDem =
    selectedDemId != null
      ? (dems.find((dem) => dem.id === selectedDemId) ?? null)
      : null;

  const refreshDems = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const data = await listDems();
      setDems(data);
      setSelectedDemId((current) => {
        if (current && !data.some((dem) => dem.id === current)) {
          return data[0]?.id ?? null;
        }
        if (!current && data.length > 0) {
          return data[0].id;
        }
        return current;
      });
    } catch (err) {
      setError(formatApiError(err, "No se pudo cargar la lista de DEMs"));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDems();
  }, [refreshDems]);

  const selectDem = useCallback((demId: string) => {
    setSelectedDemId(demId);
    setError(null);
    setSuccessMessage(null);
  }, []);

  const upload = useCallback(async (file: File, name?: string) => {
    setUploading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const created = await uploadDem(file, name);
      setDems((current) => [created, ...current.filter((d) => d.id !== created.id)]);
      setSelectedDemId(created.id);
      setSuccessMessage(`DEM «${created.name}» cargado.`);
      return created;
    } catch (err) {
      setError(formatApiError(err, "No se pudo cargar el DEM."));
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const generateHillshade = useCallback(async (demId: string) => {
    setGenerating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await generateDemHillshade(demId);
      const data = await listDems();
      setDems(data);
      setSuccessMessage("Hillshade generado.");
      return true;
    } catch (err) {
      setError(
        formatApiError(
          err,
          "No se pudo generar el hillshade. Verificá que el DEM exista.",
        ),
      );
      return false;
    } finally {
      setGenerating(false);
    }
  }, []);

  const addToMap = useCallback(async (demId: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setAddingToMap(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const current = dems.find((dem) => dem.id === demId);
      if (current && !current.preview_path) {
        await generateDemHillshade(demId);
        const refreshed = await listDems();
        if (requestId !== requestIdRef.current) {
          return;
        }
        setDems(refreshed);
      }

      const result = await getDemMapOverlay(demId);
      if (requestId !== requestIdRef.current) {
        return;
      }

      setOverlay({
        demId,
        imageUrl: toAbsoluteImageUrl(result.image_url, Date.now()),
        coordinates: result.coordinates_wgs84,
        width: result.width,
        height: result.height,
        crsOriginal: result.crs_original,
        opacity: opacityRef.current,
      });
      setFitTrigger((value) => value + 1);
      setSuccessMessage("Relieve agregado al mapa.");
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(
        formatApiError(
          err,
          "No se pudo agregar el relieve al mapa. Generá el hillshade primero.",
        ),
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setAddingToMap(false);
      }
    }
  }, [dems]);

  const removeFromMap = useCallback(() => {
    requestIdRef.current += 1;
    setAddingToMap(false);
    setOverlay(null);
  }, []);

  const setOpacity = useCallback((opacity: number) => {
    const clamped = Math.min(1, Math.max(0, opacity));
    opacityRef.current = clamped;
    setOverlay((current) =>
      current ? { ...current, opacity: clamped } : current,
    );
  }, []);

  const fitToOverlay = useCallback(() => {
    if (!overlay) {
      return;
    }
    setFitTrigger((value) => value + 1);
  }, [overlay]);

  return {
    dems,
    selectedDem,
    selectedDemId,
    overlay,
    listLoading,
    uploading,
    generating,
    addingToMap,
    error,
    successMessage,
    fitTrigger,
    refreshDems,
    selectDem,
    upload,
    generateHillshade,
    addToMap,
    removeFromMap,
    setOpacity,
    fitToOverlay,
    clearError: () => setError(null),
  };
}
