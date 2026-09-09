# Balodi Workspace

Moodboards y tableros en un mismo lugar. Una herramienta gratuita para emprendedores,
equipos creativos y empresas chicas, creada por **Balodi Marketing**.

Estado: **beta 0.1** — MVP local-first, sin backend conectado.

---

## Qué es

Dos espacios de trabajo que se usan siempre juntos:

- **Moodboard**: una pizarra infinita para juntar imágenes, notas, enlaces, videos y formas.
- **Tablero**: un Kanban para convertir esas ideas en tareas, etapas y prioridades.

Todo funciona sin cuenta y sin servidor: los datos se guardan en el navegador (IndexedDB).

## Instalación

Requiere Node 20 o superior.

```bash
npm install
```

## Cómo iniciarlo

```bash
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # build de producción (tsc -b + vite build)
npm run preview    # sirve el build
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
npm run test       # smoke tests (Vitest + jsdom)
```

## Cómo funciona el modo local

La interfaz nunca habla con un backend: habla con un **repositorio abstracto**
(`src/repositories/types.ts`). Hoy el proveedor activo es `LocalRepository`, que
usa [Dexie](https://dexie.org/) sobre IndexedDB.

- Al abrir la app por primera vez se siembra un espacio de ejemplo ("Mi negocio")
  con un moodboard y un tablero. Se puede borrar todo desde **Inicio → Restablecer demo**.
- Los cambios se ven al instante en memoria y se persisten con *debounce*: nunca se
  escribe en cada movimiento del mouse.
- Las imágenes que subís se comprimen y redimensionan antes de guardarse como `Blob`,
  con una miniatura aparte.
- Los videos se agregan **por URL** (YouTube, Vimeo o `.mp4`). No se descarga ni se
  almacena ningún video.
- En la interfaz se muestra discretamente el estado **Modo local**.

Podés llevarte todo con **Exportar backup** (JSON) y recuperarlo con **Importar backup**.

## Variables de entorno

Copiá el ejemplo y completá lo que necesites:

```bash
cp .env.example .env
```

| Variable | Para qué sirve |
| --- | --- |
| `VITE_DATA_PROVIDER` | `local` (por defecto) o `supabase` (fase 2). |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase. Vacío = modo local. |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima del proyecto. Vacío = modo local. |
| `VITE_BALODI_CONTACT_URL` | Destino del botón "Hablar con Balodi" (WhatsApp, Calendly, landing). |
| `VITE_BALODI_INSTAGRAM_URL` | Instagram de Balodi. |
| `VITE_BALODI_WEBSITE_URL` | Sitio web de Balodi. |

Si faltan las variables de Supabase, la app arranca igual en modo local.
**Nunca commitees credenciales reales.**

Todos los textos y enlaces de marca están centralizados en `src/config/brand.ts`.

## Cómo conectar Supabase (fase 2)

1. Crear el proyecto en Supabase y ejecutar `supabase/migrations/0001_init.sql`
   (todavía **no** se ejecutó: es un esquema de referencia con FKs, índices,
   constraints, auditoría y RLS por membresía del workspace).
2. Completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Implementar `src/repositories/SupabaseRepository.ts`, que hoy expone el contrato
   completo pero lanza un error explícito de "fase 2".
4. Cambiar `VITE_DATA_PROVIDER=supabase`. No hay que tocar ningún componente:
   la decisión vive en `src/repositories/index.ts`.

Reglas de consumo pensadas para que el producto siga siendo gratis:

- Consultas acotadas por workspace y paginadas; nunca traer todo al iniciar.
- Seleccionar sólo los campos necesarios.
- Escrituras en lote desde la cola local (`db.pendingChanges`), con *debounce*.
- Índices listos para `owner_id`, `workspace_id`, `board_id`, `column_id`, `updated_at`.
- Conflictos por `updated_at` + `version`.
- Realtime **apagado** en esta versión; cuando se active, sólo para el workspace abierto
  y cerrando la suscripción al salir de la vista.
- Storage privado con URLs firmadas, imágenes comprimidas y miniaturas separadas.

## Qué funciona hoy

**Producto**

- Landing responsive, `/about`, 404 diseñado, pantallas de acceso y registro
  con "Probar sin registrarme".
- Espacios de trabajo: crear, editar, eliminar (con confirmación), selector en la barra lateral.
- Dashboard con proyectos recientes, backup JSON y reset de la demo.

**Tablero Kanban**

- Crear, renombrar, recolorear, reordenar y eliminar columnas.
- Crear, reordenar, mover entre columnas, duplicar y eliminar tareas (dnd-kit).
- Panel de tarea: descripción, prioridad, etiquetas, fecha límite, portada por URL.
- Búsqueda, filtros por prioridad y etiqueta, contadores por columna.
- Guardado automático por lotes con estado "Guardando… / Guardado".

**Moodboard**

- Lienzo infinito propio: zoom con rueda (Ctrl/⌘) y controles, pan, centrar contenido, grilla.
- Notas, textos, imágenes locales, imagen por URL, enlaces, videos y formas.
- Mover, redimensionar, selección múltiple con marquesina, duplicar, copiar/pegar,
  traer adelante / enviar atrás, bloquear, eliminar.
- Deshacer y rehacer, menú contextual, atajos de teclado, exportar a PNG.
- Guardado automático con snapshots por *debounce*.

**Calidad**

- Estados hover / focus / active / disabled / loading, foco visible, HTML semántico.
- Confirmación antes de cada acción destructiva, toasts, skeletons, límite de error.
- 7 smoke tests que cubren rutas, siembra de la demo, alta de tareas con persistencia
  real en IndexedDB, apertura del moodboard y ciclo completo de backup.

## Qué queda pendiente

- Autenticación real y sincronización remota (`SupabaseRepository` sin implementar).
- Colaboración: presencia, cursores, comentarios, historial de versiones.
- Modo oscuro: los tokens existen (`[data-theme="dark"]`), falta el interruptor.
- Rotación de elementos y dibujo libre en el moodboard.
- Ejecución del SQL y las políticas de Storage.

Ver `docs/ROADMAP.md`.

## Estructura

```
src/
  app/            layout de la aplicación y rutas
  components/     componentes compartidos
  components/ui/  primitivas (botón, campos, modal, toasts…)
  config/         brand.ts y env.ts
  data/           datos de demostración centralizados
  features/       landing, workspaces, moodboards, boards, brand, auth
  hooks/          hooks reutilizables
  lib/            Dexie, utilidades, media, exportación PNG
  repositories/   contrato de datos + implementación local y stub de Supabase
  stores/         Zustand (UI, workspaces, tablero, moodboard)
  styles/         tokens CSS y base de Tailwind
  types/          modelo de datos compartido
supabase/migrations/  esquema SQL de referencia
docs/                 hoja de ruta
test/                 smoke tests
```

## Sobre las fotografías

La landing usa composiciones gráficas generadas por código, no fotos de terceros.
Para poner las fotos de Balodi, completá `brand.media` en `src/config/brand.ts`:
el componente `PhotoSlot` usa la imagen real si hay URL y dibuja la composición si no.

---

Creado por [Balodi Marketing](https://balodi.example). Producto en beta.
