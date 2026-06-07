-- ============================================================================
-- Datos de ejemplo (opcional). Ejecutar después de las migraciones.
-- ============================================================================

insert into services (name, slug, color, billing_model, sort_order) values
  ('Netflix',    'netflix',    '#E50914', 'both',         1),
  ('Max',        'max',        '#0046FF', 'both',         2),
  ('Disney+',    'disney',     '#113CCF', 'both',         3),
  ('Prime Video','prime-video','#00A8E1', 'profile',      4),
  ('Spotify',    'spotify',    '#1DB954', 'full_account', 5)
on conflict (slug) do nothing;

-- Productos de ejemplo (perfil 1 mes por servicio)
insert into products (service_id, name, type, price, duration_days, sort_order)
select s.id, s.name || ' — Perfil 1 mes', 'profile', 3000, 30, 1
from services s
where s.billing_model in ('profile', 'both');

insert into products (service_id, name, type, price, duration_days, sort_order)
select s.id, s.name || ' — Cuenta completa 1 mes', 'full_account', 9000, 30, 2
from services s
where s.billing_model in ('full_account', 'both');
