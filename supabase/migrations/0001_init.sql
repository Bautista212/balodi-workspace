-- ============================================================================
-- Balodi Workspace — esquema de referencia para la fase 2 (Supabase).
--
-- IMPORTANTE: este archivo NO se ejecutó todavía. Es la traducción a Postgres
-- del modelo que hoy vive en IndexedDB (src/types/index.ts).
--
-- Decisiones:
--  * Todas las claves son UUID para que el cliente pueda generarlas offline y
--    subirlas después sin renumerar nada (la app ya crea IDs con crypto.randomUUID).
--  * El control de acceso cuelga siempre de workspace_members: un usuario ve un
--    tablero si es miembro del workspace que lo contiene, no por ser su autor.
--  * updated_at + version permiten detectar conflictos al sincronizar en lotes.
--  * position es double precision para insertar entre dos tarjetas sin reescribir
--    la columna entera (posiciones fraccionales, igual que en el modo local).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- utilidades
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Datos públicos del usuario. Se crea al registrarse.';

-- --------------------------------------------------------------- workspaces
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workspaces_owner_id_idx on public.workspaces (owner_id);
create index workspaces_updated_at_idx on public.workspaces (updated_at desc);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_id_idx on public.workspace_members (user_id);
comment on table public.workspace_members is 'Fuente de verdad de los permisos. Todas las políticas RLS pasan por acá.';

-- ------------------------------------------------------------------- boards
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text not null default '',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index boards_workspace_id_idx on public.boards (workspace_id);
create index boards_updated_at_idx on public.boards (workspace_id, updated_at desc);

create table public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  title text not null default 'Nueva columna',
  color text not null default '#fd3a00',
  position double precision not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index columns_board_id_idx on public.columns (board_id, position);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  column_id uuid not null references public.columns (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  description text not null default '',
  position double precision not null default 1000,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_board_id_idx on public.tasks (board_id);
create index tasks_column_id_idx on public.tasks (column_id, position);
create index tasks_updated_at_idx on public.tasks (board_id, updated_at desc);

create table public.task_labels (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 40),
  color text not null default '#6b6663'
);
create index task_labels_task_id_idx on public.task_labels (task_id);

-- --------------------------------------------------------------- moodboards
create table public.moodboards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  -- viewport_data: { x, y, scale }. Liviano, se guarda con debounce largo.
  viewport_data jsonb not null default '{"x":0,"y":0,"scale":1}'::jsonb,
  -- document_data: { items: [...] }. Sólo metadatos; los binarios van a assets.
  document_data jsonb not null default '{"items":[]}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index moodboards_workspace_id_idx on public.moodboards (workspace_id);
create index moodboards_updated_at_idx on public.moodboards (workspace_id, updated_at desc);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  moodboard_id uuid references public.moodboards (id) on delete cascade,
  type text not null check (type in ('image', 'video', 'link', 'file')),
  name text not null default '',
  -- Videos y enlaces viven como URL: no se almacena el archivo.
  external_url text,
  -- Imágenes subidas: ruta en Storage, nunca la URL pública.
  storage_path text,
  thumbnail_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assets_needs_source check (external_url is not null or storage_path is not null)
);
create index assets_workspace_id_idx on public.assets (workspace_id);
create index assets_moodboard_id_idx on public.assets (moodboard_id);

-- -------------------------------------------------------------- auditoría
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger workspaces_touch before update on public.workspaces
  for each row execute function public.touch_updated_at();
create trigger boards_touch before update on public.boards
  for each row execute function public.touch_updated_at();
create trigger columns_touch before update on public.columns
  for each row execute function public.touch_updated_at();
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();
create trigger moodboards_touch before update on public.moodboards
  for each row execute function public.touch_updated_at();
create trigger assets_touch before update on public.assets
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Helpers en security definer: evitan la recursión infinita que aparece cuando
-- una política de workspace_members consulta workspace_members.
create or replace function public.is_workspace_member(target uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target and user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_workspace(target uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target and user_id = auth.uid() and role in ('owner', 'editor')
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.tasks enable row level security;
alter table public.task_labels enable row level security;
alter table public.moodboards enable row level security;
alter table public.assets enable row level security;

-- profiles: cada quien administra el suyo.
create policy profiles_self_select on public.profiles for select using (id = auth.uid());
create policy profiles_self_write on public.profiles for update using (id = auth.uid());
create policy profiles_self_insert on public.profiles for insert with check (id = auth.uid());

-- workspaces: se ven si sos miembro; sólo el dueño los borra.
create policy workspaces_member_select on public.workspaces
  for select using (public.is_workspace_member(id));
create policy workspaces_owner_insert on public.workspaces
  for insert with check (owner_id = auth.uid());
create policy workspaces_editor_update on public.workspaces
  for update using (public.can_edit_workspace(id));
create policy workspaces_owner_delete on public.workspaces
  for delete using (owner_id = auth.uid());

-- membresías: se ven las del propio workspace; sólo el dueño invita o expulsa.
create policy members_select on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
create policy members_owner_write on public.workspace_members
  for all using (
    exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())
  );

-- boards / moodboards / assets: acceso por membresía del workspace.
create policy boards_select on public.boards
  for select using (public.is_workspace_member(workspace_id));
create policy boards_write on public.boards
  for all using (public.can_edit_workspace(workspace_id))
  with check (public.can_edit_workspace(workspace_id));

create policy moodboards_select on public.moodboards
  for select using (public.is_workspace_member(workspace_id));
create policy moodboards_write on public.moodboards
  for all using (public.can_edit_workspace(workspace_id))
  with check (public.can_edit_workspace(workspace_id));

create policy assets_select on public.assets
  for select using (public.is_workspace_member(workspace_id));
create policy assets_write on public.assets
  for all using (public.can_edit_workspace(workspace_id))
  with check (public.can_edit_workspace(workspace_id));

-- columns / tasks / task_labels: heredan el permiso subiendo hasta el workspace.
create policy columns_select on public.columns
  for select using (
    exists (select 1 from public.boards b where b.id = board_id and public.is_workspace_member(b.workspace_id))
  );
create policy columns_write on public.columns
  for all using (
    exists (select 1 from public.boards b where b.id = board_id and public.can_edit_workspace(b.workspace_id))
  );

create policy tasks_select on public.tasks
  for select using (
    exists (select 1 from public.boards b where b.id = board_id and public.is_workspace_member(b.workspace_id))
  );
create policy tasks_write on public.tasks
  for all using (
    exists (select 1 from public.boards b where b.id = board_id and public.can_edit_workspace(b.workspace_id))
  );

create policy task_labels_select on public.task_labels
  for select using (
    exists (
      select 1 from public.tasks t
      join public.boards b on b.id = t.board_id
      where t.id = task_id and public.is_workspace_member(b.workspace_id)
    )
  );
create policy task_labels_write on public.task_labels
  for all using (
    exists (
      select 1 from public.tasks t
      join public.boards b on b.id = t.board_id
      where t.id = task_id and public.can_edit_workspace(b.workspace_id)
    )
  );

-- ============================================================================
-- Pendiente para cuando se ejecute este esquema:
--  * trigger que cree el profile y la membresía 'owner' al registrarse;
--  * bucket privado de Storage con políticas espejo de assets;
--  * publicación de Realtime acotada por workspace (no global).
-- ============================================================================
