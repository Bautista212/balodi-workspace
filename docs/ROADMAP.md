# Hoja de ruta — Balodi Workspace

Estado al cierre de esta versión: **fase 1 completa**, fases 2 a 4 pendientes.

Convención: ✅ terminado · 🟡 preparado pero sin implementar · ⬜ no empezado.

---

## Fase 1 — MVP local

| Estado | Entregable |
| --- | --- |
| ✅ | Landing con hero, bloques de producto, sección Balodi y footer |
| ✅ | Rutas completas, incluidos `/login`, `/register`, `/about` y 404 |
| ✅ | Workspaces: crear, editar, eliminar y cambiar de espacio |
| ✅ | Moodboard: lienzo infinito, 8 tipos de elemento, historial y exportación PNG |
| ✅ | Kanban: columnas y tareas con arrastre, filtros y panel de detalle |
| ✅ | Persistencia en IndexedDB con guardado por lotes y *debounce* |
| ✅ | Exportación e importación de backup JSON + reset de la demo |
| ✅ | Smoke tests de rutas, persistencia y backup |
| 🟡 | Modo oscuro: tokens listos, falta el interruptor |

## Fase 2 — Supabase

| Estado | Entregable |
| --- | --- |
| 🟡 | Esquema SQL con FKs, índices, constraints y auditoría (`supabase/migrations/0001_init.sql`, sin ejecutar) |
| 🟡 | RLS por membresía del workspace, con helpers `is_workspace_member` / `can_edit_workspace` |
| 🟡 | Contrato `SupabaseRepository` completo, sin implementación |
| 🟡 | Cola local de cambios pendientes (`db.pendingChanges`) |
| 🟡 | Detección de conflictos por `updated_at` + `version` |
| ⬜ | Autenticación por email y sesión persistente |
| ⬜ | Persistencia remota con consultas acotadas y paginadas |
| ⬜ | Storage privado con URLs firmadas y miniaturas separadas |
| ⬜ | Sincronización en lotes desde la cola local |
| ⬜ | Invitaciones y roles (owner / editor / viewer) en la interfaz |

## Fase 3 — Colaboración

| Estado | Entregable |
| --- | --- |
| ⬜ | Presencia de usuarios en el espacio abierto |
| ⬜ | Cursores en el moodboard |
| ⬜ | Comentarios en tarjetas y elementos |
| ⬜ | Historial de versiones y restauración |
| ⬜ | Registro de actividad por workspace |

Nota: Realtime queda deliberadamente apagado hasta esta fase. Cuando se active,
la suscripción se abre sólo para el workspace visible y se cierra al salir.

## Fase 4 — Diferencial Balodi

| Estado | Entregable |
| --- | --- |
| ⬜ | Plantillas para emprendedores (lanzamiento, contenido mensual, marca) |
| ⬜ | Calendario de contenido |
| ⬜ | Biblioteca de hooks |
| ⬜ | Brief creativo guiado |
| ⬜ | Asistente de estrategia |
| ⬜ | Recursos gratuitos descargables |
| ⬜ | Comunidad |

---

## Deuda técnica conocida

- El moodboard no rota elementos ni permite dibujo libre.
- La exportación PNG rasteriza videos y enlaces como tarjeta; una imagen externa
  con CORS restrictivo se dibuja como bloque vacío.
- No hay tests de arrastre: dnd-kit necesita layout real, así que requiere
  un navegador (Playwright) en lugar de jsdom.
- El bundle principal ronda los 450 kB sin comprimir; los dos editores ya se
  cargan por separado, pero conviene revisar Dexie y dnd-kit si crece.
