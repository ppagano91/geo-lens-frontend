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
        <p className="sidebar-phase">Fase 3B: AOIs con backend</p>
        <p className="sidebar-note">
          Dibujá un polígono, guardalo en la API y consultá o eliminá AOIs
          persistidos desde el panel lateral.
        </p>
      </div>
    </aside>
  );
}
