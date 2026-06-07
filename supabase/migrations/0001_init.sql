-- ============================================================================
-- Centralia Streaming — Esquema inicial
-- Plataforma de venta de cuentas/perfiles de streaming con pago por SINPE Móvil
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensiones
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role            as enum ('admin', 'customer');
create type billing_model        as enum ('profile', 'full_account', 'both');
create type account_status       as enum ('active', 'expiring', 'expired', 'problem', 'disabled');
create type profile_status       as enum ('available', 'reserved', 'sold', 'disabled');
create type product_type         as enum ('profile', 'full_account');
create type order_kind           as enum ('purchase', 'credit_topup');
create type order_status         as enum ('pending', 'paid', 'fulfilled', 'rejected', 'cancelled', 'expired');
create type payment_method       as enum ('sinpe', 'credits');
create type sinpe_status         as enum ('unmatched', 'matched', 'ignored');
create type credit_txn_type      as enum ('topup', 'purchase', 'refund', 'adjustment');
create type entitlement_status   as enum ('active', 'expired', 'revoked');
create type request_type         as enum ('pin_change', 'profile_name_change');
create type request_status       as enum ('pending', 'in_progress', 'done', 'rejected');
create type ticket_status        as enum ('open', 'pending', 'closed');

-- ---------------------------------------------------------------------------
-- profiles: usuarios de la app (espejo de auth.users) — clientes y admins
-- ---------------------------------------------------------------------------
create table profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  role           user_role     not null default 'customer',
  full_name      text,
  email          text,
  phone          text,
  sinpe_name     text,                                  -- nombre exacto registrado para casar el SINPE
  credit_balance numeric(12,2) not null default 0 check (credit_balance >= 0),
  is_blocked     boolean       not null default false,
  created_at     timestamptz   not null default now(),
  updated_at     timestamptz   not null default now()
);
comment on table profiles is 'Usuarios de la plataforma (clientes y administradores).';
comment on column profiles.sinpe_name is 'Nombre que el cliente usa en sus SINPE, para verificación.';

-- ---------------------------------------------------------------------------
-- services: catálogo de servicios (Netflix, Max, Disney+, ...)
-- ---------------------------------------------------------------------------
create table services (
  id            uuid primary key default gen_random_uuid(),
  name          text          not null,
  slug          text          not null unique,
  logo_url      text,
  color         text,                                   -- color de marca para la UI
  billing_model billing_model not null default 'both',
  is_active     boolean       not null default true,
  sort_order    int           not null default 0,
  created_at    timestamptz   not null default now()
);
comment on table services is 'Catálogo de servicios de streaming que se ofrecen.';

-- ---------------------------------------------------------------------------
-- streaming_accounts: el "banco de cuentas" (inventario real)
-- ---------------------------------------------------------------------------
create table streaming_accounts (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid          not null references services (id) on delete restrict,
  email         text          not null,
  password      text          not null,
  label         text,                                   -- nota interna p.ej. "lote marzo"
  max_profiles  int           not null default 5 check (max_profiles > 0),
  cost          numeric(12,2),                          -- costo nuestro
  purchased_at  date,
  paid_through  date,                                   -- hasta cuándo está pagada (nuestro costo)
  status        account_status not null default 'active',
  notes         text,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);
comment on table streaming_accounts is 'Cuentas reales en inventario; cada una tiene varios perfiles.';

create index idx_streaming_accounts_service on streaming_accounts (service_id);
create index idx_streaming_accounts_status  on streaming_accounts (status);

-- ---------------------------------------------------------------------------
-- account_profiles: perfiles dentro de cada cuenta
-- ---------------------------------------------------------------------------
create table account_profiles (
  id                   uuid primary key default gen_random_uuid(),
  account_id           uuid          not null references streaming_accounts (id) on delete cascade,
  profile_label        text,                            -- "Perfil 1"
  profile_name         text,                            -- nombre visible actual
  pin                  text,
  status               profile_status not null default 'available',
  assigned_customer_id uuid          references profiles (id) on delete set null,
  created_at           timestamptz   not null default now(),
  updated_at           timestamptz   not null default now()
);
comment on table account_profiles is 'Perfiles individuales vendibles dentro de una cuenta.';

create index idx_account_profiles_account  on account_profiles (account_id);
create index idx_account_profiles_status   on account_profiles (status);
create index idx_account_profiles_customer on account_profiles (assigned_customer_id);

-- ---------------------------------------------------------------------------
-- products: lo que el cliente ve y compra en la tienda
-- ---------------------------------------------------------------------------
create table products (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid          not null references services (id) on delete restrict,
  name          text          not null,
  type          product_type  not null,
  price         numeric(12,2) not null check (price >= 0),
  duration_days int           not null default 30 check (duration_days > 0),
  description   text,
  is_active     boolean       not null default true,
  sort_order    int           not null default 0,
  created_at    timestamptz   not null default now()
);
comment on table products is 'Items vendibles (perfil o cuenta completa) con precio y duración.';

create index idx_products_service on products (service_id);

-- ---------------------------------------------------------------------------
-- sinpe_messages: cada SMS de SINPE recibido por el webhook
-- ---------------------------------------------------------------------------
create table sinpe_messages (
  id              uuid primary key default gen_random_uuid(),
  raw_text        text          not null,
  sender_name     text,                                 -- parseado
  amount          numeric(12,2),                        -- parseado
  detail          text,                                 -- concepto/detalle parseado
  reference       text,                                 -- referencia del banco
  external_id     text          unique,                 -- hash para idempotencia
  status          sinpe_status  not null default 'unmatched',
  matched_order_id uuid,                                -- FK añadida después de crear orders
  received_at     timestamptz   not null default now(),
  created_at      timestamptz   not null default now()
);
comment on table sinpe_messages is 'Mensajes SINPE crudos + parseados recibidos por el webhook.';

create index idx_sinpe_messages_status on sinpe_messages (status);
create index idx_sinpe_messages_detail on sinpe_messages (detail);

-- ---------------------------------------------------------------------------
-- orders: cada compra o recarga de créditos
-- ---------------------------------------------------------------------------
create table orders (
  id               uuid primary key default gen_random_uuid(),
  code             text          not null unique,        -- detalle SINPE único, p.ej. "CENT-7K9Q"
  customer_id      uuid          not null references profiles (id) on delete cascade,
  kind             order_kind    not null default 'purchase',
  product_id       uuid          references products (id) on delete set null,
  amount           numeric(12,2) not null check (amount >= 0),
  payment_method   payment_method not null default 'sinpe',
  status           order_status  not null default 'pending',
  sinpe_message_id uuid          references sinpe_messages (id) on delete set null,
  expires_at       timestamptz,                          -- ventana para pagar el SINPE
  paid_at          timestamptz,
  fulfilled_at     timestamptz,
  admin_note       text,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);
comment on table orders is 'Órdenes de compra y recargas de crédito.';
comment on column orders.code is 'Código único que el cliente pone en el detalle del SINPE.';

create index idx_orders_customer on orders (customer_id);
create index idx_orders_status   on orders (status);
create index idx_orders_code     on orders (code);

-- FK diferida de sinpe_messages -> orders
alter table sinpe_messages
  add constraint fk_sinpe_matched_order
  foreign key (matched_order_id) references orders (id) on delete set null;

-- ---------------------------------------------------------------------------
-- entitlements: lo que el cliente tiene activo ahora mismo
-- ---------------------------------------------------------------------------
create table entitlements (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid          not null references profiles (id) on delete cascade,
  order_id           uuid          references orders (id) on delete set null,
  product_id         uuid          references products (id) on delete set null,
  account_id         uuid          references streaming_accounts (id) on delete set null,
  account_profile_id uuid          references account_profiles (id) on delete set null,
  starts_at          timestamptz   not null default now(),
  ends_at            timestamptz   not null,
  status             entitlement_status not null default 'active',
  created_at         timestamptz   not null default now()
);
comment on table entitlements is 'Accesos activos del cliente (qué cuenta/perfil tiene y hasta cuándo).';

create index idx_entitlements_customer on entitlements (customer_id);
create index idx_entitlements_status   on entitlements (status);
create index idx_entitlements_ends_at  on entitlements (ends_at);

-- ---------------------------------------------------------------------------
-- credit_transactions: historial de saldo de la plataforma
-- ---------------------------------------------------------------------------
create table credit_transactions (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid          not null references profiles (id) on delete cascade,
  type          credit_txn_type not null,
  amount        numeric(12,2) not null,                  -- positivo suma, negativo resta
  balance_after numeric(12,2) not null,
  order_id      uuid          references orders (id) on delete set null,
  note          text,
  created_at    timestamptz   not null default now()
);
comment on table credit_transactions is 'Movimientos de créditos (recargas, compras, ajustes).';

create index idx_credit_txn_customer on credit_transactions (customer_id);

-- ---------------------------------------------------------------------------
-- service_requests: solicitudes de cambio de PIN / nombre de perfil
-- ---------------------------------------------------------------------------
create table service_requests (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid          not null references profiles (id) on delete cascade,
  entitlement_id     uuid          references entitlements (id) on delete set null,
  account_profile_id uuid          references account_profiles (id) on delete set null,
  type               request_type  not null,
  requested_value    text,                               -- nuevo PIN o nuevo nombre
  status             request_status not null default 'pending',
  admin_note         text,
  created_at         timestamptz   not null default now(),
  updated_at         timestamptz   not null default now()
);
comment on table service_requests is 'Solicitudes del cliente: cambio de PIN o de nombre de perfil.';

create index idx_service_requests_status   on service_requests (status);
create index idx_service_requests_customer on service_requests (customer_id);

-- ---------------------------------------------------------------------------
-- support_tickets / support_messages: chat de soporte
-- ---------------------------------------------------------------------------
create table support_tickets (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid          not null references profiles (id) on delete cascade,
  subject     text,
  status      ticket_status not null default 'open',
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);
comment on table support_tickets is 'Tickets de soporte (uno por conversación).';

create index idx_support_tickets_customer on support_tickets (customer_id);
create index idx_support_tickets_status   on support_tickets (status);

create table support_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid        not null references support_tickets (id) on delete cascade,
  sender_id  uuid        references profiles (id) on delete set null,
  is_admin   boolean     not null default false,
  body       text        not null,
  created_at timestamptz not null default now()
);
comment on table support_messages is 'Mensajes dentro de un ticket de soporte.';

create index idx_support_messages_ticket on support_messages (ticket_id);

-- ============================================================================
-- Funciones y triggers
-- ============================================================================

-- updated_at automático
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated         before update on profiles          for each row execute function set_updated_at();
create trigger trg_streaming_accounts_upd   before update on streaming_accounts for each row execute function set_updated_at();
create trigger trg_account_profiles_upd     before update on account_profiles  for each row execute function set_updated_at();
create trigger trg_orders_updated           before update on orders            for each row execute function set_updated_at();
create trigger trg_service_requests_upd     before update on service_requests  for each row execute function set_updated_at();
create trigger trg_support_tickets_upd      before update on support_tickets   for each row execute function set_updated_at();

-- Crear fila en profiles automáticamente cuando se registra un usuario en auth.users
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helper: ¿el usuario actual es admin?
create or replace function is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Generador de código de orden (detalle SINPE): CENT-XXXX
create or replace function generate_order_code()
returns text language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sin caracteres ambiguos
  code text;
  i int;
begin
  loop
    code := 'CENT-';
    for i in 1..4 loop
      code := code || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from orders where orders.code = code);
  end loop;
  return code;
end;
$$;
