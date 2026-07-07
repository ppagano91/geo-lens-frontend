import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
