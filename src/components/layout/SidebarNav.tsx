import {
  Activity,
  Blend,
  ChevronsLeft,
  ChevronsRight,
  FolderOpen,
  Layers,
  Map,
  Pentagon,
  Upload,
  type LucideIcon,
} from "lucide-react";
import type {
  ActiveSidebarTab,
  SidebarTab,
  SidebarTabId,
} from "../../types/sidebar";
import {
  SIDEBAR_TABS,
  sidebarTabActionLabel,
} from "../../types/sidebar";

const TAB_ICONS: Record<SidebarTabId, LucideIcon> = {
  map: Map,
  aoi: Pentagon,
  scenes: Layers,
  ingest: Upload,
  indices: Activity,
  composiciones: Blend,
  resultados: FolderOpen,
};

interface SidebarNavProps {
  activeTab: ActiveSidebarTab;
  collapsed: boolean;
  onChange: (tabId: SidebarTabId) => void;
  onToggleCollapsed: () => void;
  tabs?: SidebarTab[];
}

export default function SidebarNav({
  activeTab,
  collapsed,
  onChange,
  onToggleCollapsed,
  tabs = SIDEBAR_TABS,
}: SidebarNavProps) {
  const collapseLabel = collapsed ? "Expandir menú" : "Colapsar menú";

  return (
    <nav
      className={collapsed ? "sidebar-nav sidebar-nav--collapsed" : "sidebar-nav"}
      aria-label="Secciones del panel"
    >
      <button
        type="button"
        className="sidebar-collapse-btn"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapseLabel}
        title={collapseLabel}
        data-label={collapseLabel}
      >
        {collapsed ? (
          <ChevronsRight size={18} strokeWidth={2} aria-hidden="true" />
        ) : (
          <ChevronsLeft size={18} strokeWidth={2} aria-hidden="true" />
        )}
        <span className="sidebar-nav-label">Menú</span>
      </button>

      <div className="sidebar-nav-list" role="tablist" aria-orientation="vertical">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = TAB_ICONS[tab.id];
          const actionLabel = sidebarTabActionLabel(tab.label, isActive);

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`sidebar-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={isActive ? `sidebar-panel-${tab.id}` : undefined}
              aria-label={actionLabel}
              title={actionLabel}
              data-label={actionLabel}
              className={
                isActive
                  ? "sidebar-nav-item sidebar-nav-item--active"
                  : "sidebar-nav-item"
              }
              onClick={() => onChange(tab.id)}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" />
              <span className="sidebar-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
