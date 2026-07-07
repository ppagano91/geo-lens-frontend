# GeoChange Analyzer — Frontend

Interfaz web con React, Vite, TypeScript y MapLibre GL JS.

## Fase actual: Mapa base (Fase 1)

El frontend integra MapLibre GL JS y muestra un mapa base dentro del layout principal. No hay todavía AOI, capas de análisis ni comunicación con el backend para datos GIS.

## Requisitos

- Node.js 20+

## Instalación

```bash
cd frontend
npm install
```

## Variables de entorno

Opcional. Crear `.env` en `frontend/`:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Ejecutar

```bash
npm run dev
```

La aplicación estará en `http://localhost:5173`.

## Mapa base

Se usa el estilo público de MapLibre Demo Tiles, sin token ni credenciales:

- **Style URL:** `https://demotiles.maplibre.org/style.json`
- **Centro inicial:** Buenos Aires (`-58.3816`, `-34.6037`)
- **Zoom inicial:** 10
- **Controles:** navegación (zoom y rotación) en la esquina superior derecha

El componente `src/components/map/MapView.tsx` crea la instancia del mapa con `useRef` y `useEffect`, y la destruye al desmontar el componente.

## Build

```bash
npm run build
```

## Qué no incluye todavía

- Dibujo de AOI.
- GeoJSON ni capas de datos.
- Escenas, raster, índices espectrales.
- Integración GIS con el backend.
