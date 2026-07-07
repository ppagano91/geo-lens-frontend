import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export default function AppLayout({ children, sidebar }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar>{sidebar}</Sidebar>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
