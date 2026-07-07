export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <nav>
        <p className="sidebar-label">Navegación</p>
        <ul>
          <li className="sidebar-item active">Mapa</li>
        </ul>
      </nav>
      <div className="sidebar-info">
        <p className="sidebar-phase">Fase 1: Mapa base</p>
        <p className="sidebar-note">
          Mapa base inicial. Las herramientas de AOI se agregarán en la próxima
          fase.
        </p>
      </div>
    </aside>
  );
}
