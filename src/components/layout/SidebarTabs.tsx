import type { SidebarTab, SidebarTabId } from "../../types/sidebar";
import { SIDEBAR_TABS } from "../../types/sidebar";

interface SidebarTabsProps {
  activeTab: SidebarTabId;
  onChange: (tabId: SidebarTabId) => void;
  tabs?: SidebarTab[];
}

export default function SidebarTabs({
  activeTab,
  onChange,
  tabs = SIDEBAR_TABS,
}: SidebarTabsProps) {
  return (
    <nav className="sidebar-tabs" aria-label="Secciones del panel">
      <div className="sidebar-tabs-list" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`sidebar-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`sidebar-panel-${tab.id}`}
              className={
                isActive ? "sidebar-tab sidebar-tab--active" : "sidebar-tab"
              }
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
