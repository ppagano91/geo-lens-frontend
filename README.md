# GeoChange Analyzer — Frontend

Interfaz web con React, Vite, TypeScript y MapLibre GL JS.

## Fase actual: Escenas en frontend (Fase 4B)

El frontend permite:

- **AOIs**: dibujar, guardar, listar, visualizar y eliminar (Fase 3B).
- **Escenas**: listar escenas registradas, seleccionar, ver detalle con bandas y mostrar footprint en el mapa.
- **Mapas base**: selector para alternar entre calles (OSM), topográfico, satélite y demo MapLibre.

Solo metadata; `asset_path` se muestra como texto y no se abre. Sin lectura raster.

## Requisitos

- Node.js 20+
- PostgreSQL + PostGIS local en Windows con base `geochange` y migraciones aplicadas (ver [README raíz](../README.md) pasos 1–5 o [backend/README.md](../backend/README.md))
- Backend corriendo en `http://localhost:8000`

## Instalación

```powershell
cd frontend
npm install
copy .env.example .env
```

## Variables de entorno

Crear `.env` en `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Ejecutar

Con el backend ya levantado (paso 6 del [README raíz](../README.md)):

```powershell
npm run dev
```

La aplicación estará en `http://localhost:5173`.

## Cómo probar escenas

1. Crear una escena desde Swagger (`http://localhost:8000/docs`) o curl (ver [docs/scenes_metadata.md](../docs/scenes_metadata.md)).
2. Abrir `http://localhost:5173`.
3. En el panel **Escenas**, click en **Refrescar escenas**.
4. Click en **Seleccionar** sobre una escena.
5. Verificar detalle, lista de bandas y footprint verde en el mapa.
6. Confirmar que el flujo de AOIs sigue funcionando.

## Mapas base

El selector **Mapa base** en el sidebar permite alternar entre:

| Opción | Proveedor | Uso |
|---|---|---|
| **Calles** (default) | OpenStreetMap | Calles y contexto urbano para dibujar AOIs |
| **Topográfico** | OpenTopoMap | Relieve y curvas de nivel |
| **Satélite** | Esri World Imagery | Imagen satelital de referencia |
| **Demo MapLibre** | MapLibre demo tiles | Fallback de desarrollo |

Configuración centralizada en `src/config/basemaps.ts`.

**Nota de desarrollo:** OSM, OpenTopoMap y Esri se usan como opciones de desarrollo sin API key. Para producción, revisar políticas de uso, licencias y considerar un proveedor propio o caché de tiles. El estilo demo de MapLibre queda solo como fallback.

### Cómo probar mapas base

1. Abrir la app → el mapa inicia en **Calles**.
2. Cambiar a **Topográfico**, **Satélite** y **Demo MapLibre**.
3. Dibujar un AOI y confirmar que sigue visible al cambiar de mapa.
4. Seleccionar una escena con footprint y confirmar que sigue visible al cambiar de mapa.
5. Verificar que no hay errores en consola ni capas duplicadas.

## Cómo probar AOIs con backend

1. Completar el flujo local: PostgreSQL/PostGIS → `alembic upgrade head` → backend → frontend.
2. Abrir `http://localhost:5173`.
3. **Iniciar dibujo** → click en el mapa (mínimo 3 vértices) → **Finalizar AOI**.
4. Completar **Nombre del AOI** → **Guardar AOI**.
5. Verificar que aparece en la lista **AOIs guardadas**.
6. **Limpiar AOI** y luego **Ver** un AOI guardado para cargarlo en el mapa.
7. **Eliminar** un AOI guardado desde la lista.

## Componentes principales

| Archivo | Rol |
|---|---|
| `src/api/client.ts` | Cliente HTTP base |
| `src/api/aoiApi.ts` | Funciones CRUD de AOIs |
| `src/api/sceneApi.ts` | Funciones de escenas (listar, detalle, bandas, eliminar) |
| `src/hooks/useAois.ts` | Estado de AOIs guardados (API) |
| `src/hooks/useAoiDrawing.ts` | Dibujo local de AOI |
| `src/hooks/useAoiWorkspace.ts` | Orquestación dibujo + API de AOIs |
| `src/hooks/useScenes.ts` | Estado de escenas (listar, seleccionar, eliminar) |
| `src/components/panels/AoiPanel.tsx` | Panel lateral de AOIs |
| `src/components/panels/ScenePanel.tsx` | Panel lateral de escenas |
| `src/config/basemaps.ts` | Configuración de mapas base (OSM, OpenTopoMap, Esri, demo) |
| `src/components/map/BasemapSelector.tsx` | Selector de mapa base en sidebar |
| `src/components/map/MapView.tsx` | Mapa base, cambio de estilo y fitBounds |
| `src/components/map/AoiLayer.tsx` | Capas GeoJSON del AOI (azul) |
| `src/components/map/SceneFootprintLayer.tsx` | Capa footprint de escena (verde) |

## Build

```powershell
npm run build
```

## Qué no incluye todavía

- Creación de escenas desde la UI.
- Edición de AOIs o escenas existentes.
- Lectura raster, índices espectrales, previews.
- Autenticación ni multiusuario.
