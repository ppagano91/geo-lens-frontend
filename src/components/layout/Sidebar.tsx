import { useState } from "react";
import type { ReactNode } from "react";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import {
  DEFAULT_SIDEBAR_TAB,
  type SidebarTabId,
} from "../../types/sidebar";
import SidebarNav from "./SidebarNav";

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
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();

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
    map,
    aoi,
    scenes,
    ingest,
    indices,
    composiciones,
    resultados,
  };

  return (
    <aside
      className={
        collapsed ? "app-sidebar app-sidebar--collapsed" : "app-sidebar"
      }
    >
      <SidebarNav
        activeTab={activeTab}
        collapsed={collapsed}
        onChange={setActiveTab}
        onToggleCollapsed={toggleCollapsed}
      />

      <div className="sidebar-main">
        <div
          className="sidebar-section"
          role="tabpanel"
          id={`sidebar-panel-${activeTab}`}
          aria-labelledby={`sidebar-tab-${activeTab}`}
        >
          {sections[activeTab]}
        </div>
      </div>
    </aside>
  );
}
