import { useState } from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_SIDEBAR_TAB,
  type SidebarTabId,
} from "../../types/sidebar";
import SidebarTabs from "./SidebarTabs";

interface SidebarProps {
  aoi: ReactNode;
  scenes: ReactNode;
  ingest: ReactNode;
  indices: ReactNode;
  composiciones: ReactNode;
  resultados: ReactNode;
  map: ReactNode;
  activeTab?: SidebarTabId;
  onActiveTabChange?: (tabId: SidebarTabId) => void;
}

export default function Sidebar({
  aoi,
  scenes,
  ingest,
  indices,
  composiciones,
  resultados,
  map,
  activeTab: controlledTab,
  onActiveTabChange,
}: SidebarProps) {
  const [uncontrolledTab, setUncontrolledTab] =
    useState<SidebarTabId>(DEFAULT_SIDEBAR_TAB);

  const isControlled =
    controlledTab !== undefined && onActiveTabChange !== undefined;
  const activeTab = isControlled ? controlledTab : uncontrolledTab;

  const setActiveTab = (tabId: SidebarTabId) => {
    if (isControlled) {
      onActiveTabChange(tabId);
      return;
    }
    setUncontrolledTab(tabId);
  };

  const sections: Record<SidebarTabId, ReactNode> = {
    aoi,
    scenes,
    ingest,
    indices,
    composiciones,
    resultados,
    map,
  };

  return (
    <aside className="app-sidebar">
      <SidebarTabs activeTab={activeTab} onChange={setActiveTab} />

      <div
        className="sidebar-section"
        role="tabpanel"
        id={`sidebar-panel-${activeTab}`}
        aria-labelledby={`sidebar-tab-${activeTab}`}
      >
        {sections[activeTab]}
      </div>

      <div className="sidebar-info">
        <p className="sidebar-phase">Fase 9I: Catálogo de derivados</p>
        <p className="sidebar-note">
          Productos generados quedan registrados en DB (paths + metadata); los
          archivos siguen en DATA_ROOT.
        </p>
      </div>
    </aside>
  );
}
