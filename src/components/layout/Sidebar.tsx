import { useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import {
  DEFAULT_SIDEBAR_TAB,
  SIDEBAR_TABS,
  type ActiveSidebarTab,
  type SidebarTabId,
} from "../../types/sidebar";
import IconButton from "../ui/IconButton";
import SidebarNav from "./SidebarNav";

interface SidebarProps {
  aoi: ReactNode;
  scenes: ReactNode;
  ingest: ReactNode;
  indices: ReactNode;
  composiciones: ReactNode;
  resultados: ReactNode;
  map: ReactNode;
  activeTab?: ActiveSidebarTab;
  onActiveTabChange?: (tabId: ActiveSidebarTab) => void;
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
    useState<ActiveSidebarTab>(DEFAULT_SIDEBAR_TAB);
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();

  const isControlled =
    controlledTab !== undefined && onActiveTabChange !== undefined;
  const activeTab = isControlled ? controlledTab : uncontrolledTab;

  const selectTab = (next: ActiveSidebarTab) => {
    if (isControlled) {
      onActiveTabChange(next);
      return;
    }
    setUncontrolledTab(next);
  };

  const handleNavChange = (tabId: SidebarTabId) => {
    selectTab(tabId === activeTab ? null : tabId);
  };

  const handleClosePanel = () => {
    selectTab(null);
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

  const activeLabel = activeTab
    ? SIDEBAR_TABS.find((tab) => tab.id === activeTab)?.label
    : undefined;
  const panelOpen = activeTab !== null;
  const sidebarClass = [
    "app-sidebar",
    collapsed ? "app-sidebar--collapsed" : "",
    panelOpen ? "" : "app-sidebar--panel-closed",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={sidebarClass}>
      <SidebarNav
        activeTab={activeTab}
        collapsed={collapsed}
        onChange={handleNavChange}
        onToggleCollapsed={toggleCollapsed}
      />

      {panelOpen && activeTab ? (
        <div className="sidebar-main">
          <div className="sidebar-panel-toolbar">
            <h2 className="sidebar-panel-title">{activeLabel}</h2>
            <IconButton
              label={`Cerrar ${activeLabel ?? "panel"}`}
              tone="ghost"
              onClick={handleClosePanel}
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </IconButton>
          </div>
          <div
            className="sidebar-section"
            role="tabpanel"
            id={`sidebar-panel-${activeTab}`}
            aria-labelledby={`sidebar-tab-${activeTab}`}
          >
            {sections[activeTab]}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
