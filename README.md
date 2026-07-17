# GeoChange Analyzer — Frontend

Interfaz web con React, Vite, TypeScript y MapLibre GL JS.

## Fase actual: Cobertura espacial AOI / escena (Fase 6C)

El frontend permite:

- **AOIs**: dibujar, guardar, listar, visualizar y eliminar (Fase 3B).
- **Escenas**: listar escenas registradas, seleccionar, ver detalle con bandas y mostrar footprint en el mapa (Fase 4B).
- **Índices**: listar índices espectrales del catálogo, filtrar por categoría, seleccionar y ver detalle (fórmula, bandas, interpretación) (Fase 5B).
- **Compatibilidad**: evaluar si la escena seleccionada tiene las bandas que pide el índice (solo metadata) (Fase 6A).
- **Cobertura espacial**: evaluar si el AOI guardado queda cubierto por el footprint de la escena (PostGIS vía API) (Fase 6C).
- **Mapas base**: selector para alternar entre calles (OSM), topográfico, satélite y demo MapLibre.

Solo geometrías y metadata; sin lectura raster ni cálculo de índices sobre archivos.

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

## Cómo probar cobertura espacial AOI / escena

1. Crear o seleccionar un **AOI guardado** (tab AOI → Seleccionar en la lista). Un dibujo sin guardar no alcanza: hace falta `aoi_id`.
2. En **Escenas**, seleccionar una escena cuyo footprint cubra el AOI.
3. En **Cobertura espacial AOI / escena** verificar:
   - Mensaje: *El AOI está completamente cubierto por la escena.*
   - Estado: Full, cobertura 100%
4. Probar un AOI que solo intersecte parcialmente → Partial y porcentaje entre 0 y 100.
5. Probar un AOI fuera del footprint → None y 0%.
6. Sin AOI o sin escena → *Seleccioná un AOI y una escena para evaluar cobertura.*
7. Confirmar que compatibilidad de bandas, índices y mapa siguen funcionando.

## Cómo probar compatibilidad índice / escena

1. Tener al menos una escena con bandas registradas (ej. B02, B03, B04, B08, B11, B12).
2. Abrir `http://localhost:5173`.
3. En **Escenas**, seleccionar la escena.
4. En **Índices**, seleccionar **NDVI**.
5. En **Compatibilidad índice / escena** verificar:
   - Bandas requeridas: B08, B04
   - Bandas disponibles: las de la escena
   - Bandas faltantes: vacías (o —)
   - Estado: Compatible
6. Probar un índice con bandas ausentes → No compatible y listado de faltantes.
7. Sin escena o sin índice → mensajes claros de selección.
8. Cambiar escena o índice → la evaluación se actualiza sola.

## Cómo probar índices espectrales

1. Verificar que el backend expone índices: `curl http://localhost:8000/api/v1/indices`.
2. Abrir `http://localhost:5173`.
3. En el panel **Índices**, click en **Refrescar índices**.
4. Deben aparecer NDVI, NDWI, NBR y NDMI.
5. Click en **Seleccionar** sobre NDVI → ver nombre, categoría, fórmula, bandas requeridas e interpretación.
6. Repetir con NDWI, NBR y NDMI.
7. Probar el filtro por categoría (ej. **Vegetación** → solo NDVI).
8. Confirmar que AOIs y escenas siguen funcionando.

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
| `src/api/indexApi.ts` | Funciones de índices espectrales (listar, detalle) |
| `src/api/coverageApi.ts` | Cobertura espacial AOI / escena |
| `src/hooks/useAois.ts` | Estado de AOIs guardados (API) |
| `src/hooks/useAoiDrawing.ts` | Dibujo local de AOI |
| `src/hooks/useAoiWorkspace.ts` | Orquestación dibujo + API de AOIs |
| `src/hooks/useScenes.ts` | Estado de escenas (listar, seleccionar, eliminar) |
| `src/hooks/useSpectralIndices.ts` | Estado de índices espectrales (listar, filtrar, seleccionar) |
| `src/hooks/useSpatialCoverage.ts` | Consulta de cobertura espacial al cambiar AOI/escena |
| `src/components/panels/AoiPanel.tsx` | Panel lateral de AOIs |
| `src/components/panels/ScenePanel.tsx` | Panel lateral de escenas |
| `src/components/panels/IndexPanel.tsx` | Panel lateral de índices espectrales |
| `src/components/panels/CompatibilityPanel.tsx` | Compatibilidad índice / escena (metadata) |
| `src/components/panels/CoveragePanel.tsx` | Cobertura espacial AOI / escena |
| `src/utils/indexCompatibility.ts` | Evaluación de bandas requeridas vs disponibles |
| `src/types/indexCompatibility.ts` | Tipos del resultado de compatibilidad |
| `src/types/spatialCoverage.ts` | Tipos del resultado de cobertura espacial |
| `src/types/spectralIndex.ts` | Tipos TypeScript para definiciones de índices |
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

- Cálculo de índices sobre archivos (NumPy + rasterio).
- Lectura o validación física de `asset_path`.
- Creación de escenas desde la UI.
- Edición de AOIs o escenas existentes.
- Previews, composiciones RGB.
- Autenticación ni multiusuario.
