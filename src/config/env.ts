const viteEnv =
  typeof import.meta !== "undefined"
    ? (import.meta.env as ImportMetaEnv | undefined)
    : undefined;

export const API_BASE_URL =
  viteEnv?.VITE_API_BASE_URL ?? "http://localhost:8000";

/** Optional MapTiler key for external Terrain RGB. Never collected in the UI. */
export const MAPTILER_KEY = (viteEnv?.VITE_MAPTILER_KEY ?? "").trim();
