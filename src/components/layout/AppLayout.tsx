import type { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children?: ReactNode;
  aoi: ReactNode;
  scenes: ReactNode;
  indices: ReactNode;
  map: ReactNode;
}

export default function AppLayout({
  children,
  aoi,
  scenes,
  indices,
  map,
}: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar aoi={aoi} scenes={scenes} indices={indices} map={map} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
