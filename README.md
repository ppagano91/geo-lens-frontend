# GeoLens — Frontend

UI React + Vite + MapLibre de GeoLens v0.1. Arranque y flujo demo:
[README raíz](../README.md). Uso: [docs/user-guide-v0.1.md](../docs/user-guide-v0.1.md).

## Requisitos

- Node.js 20+
- Backend en `http://localhost:8000`

## Instalación

```powershell
cd geo-lens-frontend
npm install
copy .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:8000
```

MapTiler no se configura acá. Si usás relieve MapTiler, la key va en el
backend (`MAPTILER_API_KEY`).

## Ejecutar

```powershell
npm run dev
```

App: `http://localhost:5173`.

## Tests / build

```powershell
npx tsc --noEmit
npm run build
```

## Qué incluye v0.1

AOIs (polígono/rectángulo), ingesta Landsat 8 y Sentinel-2, índices, RGB
(escena y por AOI), Resultados, inspector de mapa, DEM hillshade, relieve
externo experimental, dark mode y layout responsive.

## Qué no incluye

STAC, login, jobs async, tiles propios, SCP Lite, menú contextual del mapa.
