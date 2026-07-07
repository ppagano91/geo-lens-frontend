# GeoChange Analyzer — Frontend

Interfaz web con React, Vite, TypeScript y MapLibre GL JS.

## Fase actual: Dibujo de AOI (Fase 2)

El frontend integra MapLibre GL JS con un mapa base y permite dibujar un polígono AOI de forma local. El GeoJSON generado se mantiene en estado de React y **no se persiste en el backend**.

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

## Cómo probar el dibujo de AOI

1. Abrir `http://localhost:5173`.
2. En el sidebar, sección **AOI**, hacer click en **Iniciar dibujo**.
3. Hacer click en el mapa para agregar al menos 3 vértices.
4. Hacer click en **Finalizar AOI** para cerrar el polígono.
5. Verificar que el polígono aparece en el mapa y el GeoJSON se muestra en el panel.
6. Usar **Limpiar AOI** para borrar el dibujo y empezar de nuevo.

## Mapa base

Se usa el estilo público de MapLibre Demo Tiles, sin token ni credenciales:

- **Style URL:** `https://demotiles.maplibre.org/style.json`
- **Centro inicial:** Buenos Aires (`-58.3816`, `-34.6037`)
- **Zoom inicial:** 10
- **Controles:** navegación (zoom y rotación) en la esquina superior derecha

## Componentes principales

| Archivo | Rol |
|---|---|
| `src/components/map/MapView.tsx` | Mapa base y captura de clicks al dibujar |
| `src/components/map/AoiLayer.tsx` | Capas GeoJSON del polígono y vértices |
| `src/components/panels/AoiPanel.tsx` | Controles y visualización del GeoJSON |
| `src/hooks/useAoiDrawing.ts` | Estado local del dibujo de AOI |
| `src/utils/geojson.ts` | Utilidades para generar GeoJSON |

## Build

```bash
npm run build
```

## Qué no incluye todavía

- Persistencia de AOI en backend.
- PostGIS ni base de datos.
- Escenas, raster, índices espectrales.
- Integración GIS con el backend.
