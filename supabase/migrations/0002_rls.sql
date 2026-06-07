-- ============================================================================
-- Centralia Streaming — Row Level Security (RLS)
-- Regla general: el cliente solo ve/edita lo suyo; el admin ve todo.
-- El service_role (usado en webhooks y operaciones de servidor) ignora RLS.
-- ============================================================================

alter table profiles            enable row level security;
alter table services            enable row level security;
alter table streaming_accounts  enable row level security;
alter table account_profiles    enable row level security;
alter table products            enable row level security;
alter table sinpe_messages      enable row level security;
alter table orders              enable row level security;
alter table entitlements        enable row level security;
alter table credit_transactions enable row level security;
alter table service_requests    enable row level security;
alter table support_tickets     enable row level security;
alter table support_messages    enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles: ver el propio o admin"
  on profiles for select
  using (id = auth.uid() or is_admin());

create policy "profiles: actualizar el propio o admin"
  on profiles for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

create policy "profiles: admin inserta/borra"
  on profiles for all
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- services / products: lectura pública para autenticados; escritura solo admin
-- ---------------------------------------------------------------------------
create policy "services: lectura autenticada"
  on services for select using (auth.role() = 'authenticated');
create policy "services: escritura admin"
  on services for all using (is_admin()) with check (is_admin());

create policy "products: lectura autenticada"
  on products for select using (auth.role() = 'authenticated');
create policy "products: escritura admin"
  on products for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Inventario sensible: solo admin (las credenciales se entregan vía entitlements)
-- ---------------------------------------------------------------------------
create policy "streaming_accounts: solo admin"
  on streaming_accounts for all using (is_admin()) with check (is_admin());

-- El cliente puede ver el perfil que tiene asignado; el admin ve todo
create policy "account_profiles: cliente ve el asignado o admin"
  on account_profiles for select
  using (assigned_customer_id = auth.uid() or is_admin());
create policy "account_profiles: escritura admin"
  on account_profiles for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- sinpe_messages: solo admin / service_role
-- ---------------------------------------------------------------------------
create policy "sinpe_messages: solo admin"
  on sinpe_messages for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create policy "orders: ver las propias o admin"
  on orders for select
  using (customer_id = auth.uid() or is_admin());
create policy "orders: cliente crea las propias"
  on orders for insert
  with check (customer_id = auth.uid() or is_admin());
create policy "orders: admin actualiza"
  on orders for update using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- entitlements
-- ---------------------------------------------------------------------------
create policy "entitlements: ver los propios o admin"
  on entitlements for select
  using (customer_id = auth.uid() or is_admin());
create policy "entitlements: escritura admin"
  on entitlements for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- credit_transactions
-- ---------------------------------------------------------------------------
create policy "credit_txn: ver los propios o admin"
  on credit_transactions for select
  using (customer_id = auth.uid() or is_admin());
create policy "credit_txn: escritura admin"
  on credit_transactions for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- service_requests
-- ---------------------------------------------------------------------------
create policy "requests: ver las propias o admin"
  on service_requests for select
  using (customer_id = auth.uid() or is_admin());
create policy "requests: cliente crea las propias"
  on service_requests for insert
  with check (customer_id = auth.uid() or is_admin());
create policy "requests: admin actualiza"
  on service_requests for update using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- support_tickets
-- ---------------------------------------------------------------------------
create policy "tickets: ver los propios o admin"
  on support_tickets for select
  using (customer_id = auth.uid() or is_admin());
create policy "tickets: cliente crea los propios"
  on support_tickets for insert
  with check (customer_id = auth.uid() or is_admin());
create policy "tickets: admin/cliente actualiza el propio"
  on support_tickets for update
  using (customer_id = auth.uid() or is_admin())
  with check (customer_id = auth.uid() or is_admin());

-- ---------------------------------------------------------------------------
-- support_messages: visibles si el ticket es del cliente o es admin
-- ---------------------------------------------------------------------------
create policy "msgs: ver del propio ticket o admin"
  on support_messages for select
  using (
    is_admin() or exists (
      select 1 from support_tickets t
      where t.id = ticket_id and t.customer_id = auth.uid()
    )
  );
create policy "msgs: crear en el propio ticket o admin"
  on support_messages for insert
  with check (
    is_admin() or exists (
      select 1 from support_tickets t
      where t.id = ticket_id and t.customer_id = auth.uid()
    )
  );
