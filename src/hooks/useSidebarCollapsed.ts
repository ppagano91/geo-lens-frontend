import { useCallback, useState } from "react";

export const SIDEBAR_COLLAPSED_STORAGE_KEY = "geolens.sidebarCollapsed";

function readStoredCollapsed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (stored === "true") {
      return true;
    }
    if (stored === "false") {
      return false;
    }
  } catch {
    // Private mode / blocked storage.
  }

  return false;
}

function persistCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      collapsed ? "true" : "false",
    );
  } catch {
    // Ignore quota / privacy errors.
  }
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState(readStoredCollapsed);

  const setCollapsed = useCallback((next: boolean) => {
    persistCollapsed(next);
    setCollapsedState(next);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  return { collapsed, setCollapsed, toggleCollapsed };
}
