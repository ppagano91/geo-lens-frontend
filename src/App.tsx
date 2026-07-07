import AppLayout from "./components/layout/AppLayout";

export default function App() {
  return (
    <AppLayout>
      <h2 className="content-title">Bienvenido</h2>
      <p className="content-description">
        Base inicial para una herramienta GIS de análisis satelital.
      </p>
      <span className="phase-badge">Fase actual: Scaffold inicial</span>
    </AppLayout>
  );
}
