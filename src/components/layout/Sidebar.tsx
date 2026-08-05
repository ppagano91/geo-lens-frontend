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
  map: ReactNode;
  activeTab?: SidebarTabId;
  onActiveTabChange?: (tabId: SidebarTabId) => void;
}

export default function Sidebar({
  aoi,
  scenes,
  ingest,
  indices,
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
        <p className="sidebar-phase">Fase 9B: Ingesta local / Band Set</p>
        <p className="sidebar-note">
          Registrá carpetas Landsat 8 bajo DATA_ROOT y calculá índices sin seed
          SQL.
        </p>
      </div>
    </aside>
  );
}
