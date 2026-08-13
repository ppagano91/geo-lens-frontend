export type SidebarTabId =
  | "map"
  | "aoi"
  | "scenes"
  | "ingest"
  | "indices"
  | "composiciones"
  | "resultados";

export interface SidebarTab {
  id: SidebarTabId;
  label: string;
}

export const SIDEBAR_TABS: SidebarTab[] = [
  { id: "map", label: "Mapa" },
  { id: "aoi", label: "AOIs" },
  { id: "scenes", label: "Escenas" },
  { id: "ingest", label: "Ingesta" },
  { id: "indices", label: "Índices" },
  { id: "composiciones", label: "Composiciones" },
  { id: "resultados", label: "Resultados" },
];

export const DEFAULT_SIDEBAR_TAB: SidebarTabId = "aoi";

export type ActiveSidebarTab = SidebarTabId | null;

export function sidebarTabActionLabel(
  label: string,
  isActive: boolean,
): string {
  return isActive ? `Cerrar ${label}` : `Abrir ${label}`;
}
