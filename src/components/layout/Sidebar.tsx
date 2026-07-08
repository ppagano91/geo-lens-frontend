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
        <p className="sidebar-phase">Fase 4B: Escenas en frontend</p>
        <p className="sidebar-note">
          Dibujá y guardá AOIs, y consultá escenas registradas con su footprint
          en el mapa. Solo metadata; sin lectura raster todavía.
        </p>
      </div>
    </aside>
  );
}
