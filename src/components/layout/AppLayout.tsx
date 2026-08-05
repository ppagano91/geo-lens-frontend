import type { ReactNode } from "react";
import type { SidebarTabId } from "../../types/sidebar";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children?: ReactNode;
  aoi: ReactNode;
  scenes: ReactNode;
  ingest: ReactNode;
  indices: ReactNode;
  map: ReactNode;
  activeTab: SidebarTabId;
  onActiveTabChange: (tabId: SidebarTabId) => void;
}

export default function AppLayout({
  children,
  aoi,
  scenes,
  ingest,
  indices,
  map,
  activeTab,
  onActiveTabChange,
}: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar
          aoi={aoi}
          scenes={scenes}
          ingest={ingest}
          indices={indices}
          map={map}
          activeTab={activeTab}
          onActiveTabChange={onActiveTabChange}
        />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
