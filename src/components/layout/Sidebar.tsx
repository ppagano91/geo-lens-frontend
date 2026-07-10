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
  indices: ReactNode;
  map: ReactNode;
}

export default function Sidebar({ aoi, scenes, indices, map }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTabId>(DEFAULT_SIDEBAR_TAB);

  const sections: Record<SidebarTabId, ReactNode> = {
    aoi,
    scenes,
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
        <p className="sidebar-phase">Fase 5B: Índices en frontend</p>
        <p className="sidebar-note">
          Dibujá y guardá AOIs, consultá escenas con footprint en el mapa y
          explorá el catálogo de índices espectrales. Solo metadata; sin cálculo
          raster todavía.
        </p>
      </div>
    </aside>
  );
}
