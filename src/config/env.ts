const viteEnv =
  typeof import.meta !== "undefined"
    ? (import.meta.env as { VITE_API_BASE_URL?: string } | undefined)
    : undefined;

export const API_BASE_URL =
  viteEnv?.VITE_API_BASE_URL ?? "http://localhost:8000";
