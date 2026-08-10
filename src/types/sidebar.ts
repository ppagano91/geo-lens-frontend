export type SidebarTabId =
  | "aoi"
  | "scenes"
  | "ingest"
  | "indices"
  | "composiciones"
  | "map";

export interface SidebarTab {
  id: SidebarTabId;
  label: string;
}

export const SIDEBAR_TABS: SidebarTab[] = [
  { id: "aoi", label: "AOI" },
  { id: "scenes", label: "Escenas" },
  { id: "ingest", label: "Ingesta" },
  { id: "indices", label: "Índices" },
  { id: "composiciones", label: "Composiciones" },
  { id: "map", label: "Mapa" },
];

export const DEFAULT_SIDEBAR_TAB: SidebarTabId = "aoi";
