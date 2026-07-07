interface SidebarProps {
  children?: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <nav>
        <p className="sidebar-label">Navegación</p>
        <ul>
          <li className="sidebar-item active">Mapa</li>
        </ul>
      </nav>

      {children}

      <div className="sidebar-info">
        <p className="sidebar-phase">Fase 2: Dibujo de AOI</p>
        <p className="sidebar-note">
          Dibujá un polígono sobre el mapa. El GeoJSON se mantiene en estado
          local y aún no se persiste en el backend.
        </p>
      </div>
    </aside>
  );
}
