# GeoChange Analyzer — Frontend

Interfaz web con React, Vite, TypeScript y MapLibre GL JS.

## Fase actual: AOIs con backend (Fase 3B)

El frontend permite dibujar un polígono AOI, guardarlo en la API, listar AOIs persistidos, visualizarlos en el mapa y eliminarlos.

## Requisitos

- Node.js 20+
- Backend corriendo en `http://localhost:8000` (ver `backend/README.md`)
- PostgreSQL/PostGIS levantado con migraciones aplicadas

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

```powershell
npm run dev
```

La aplicación estará en `http://localhost:5173`.

## Cómo probar AOIs con backend

1. Asegurarse de que backend y PostgreSQL estén corriendo.
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
| `src/hooks/useAois.ts` | Estado de AOIs guardados (API) |
| `src/hooks/useAoiDrawing.ts` | Dibujo local de AOI |
| `src/hooks/useAoiWorkspace.ts` | Orquestación dibujo + API |
| `src/components/panels/AoiPanel.tsx` | Panel lateral con controles y lista |
| `src/components/map/MapView.tsx` | Mapa base y fitBounds al cargar AOI |
| `src/components/map/AoiLayer.tsx` | Capas GeoJSON del polígono |

## Build

```powershell
npm run build
```

## Qué no incluye todavía

- Edición de AOIs existentes.
- Escenas, raster, índices espectrales.
- Autenticación ni multiusuario.
