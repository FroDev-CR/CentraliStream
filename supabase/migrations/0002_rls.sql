-- ============================================================================
-- Centralia Streaming — Row Level Security (con Clerk)
--
-- La app accede a los datos SIEMPRE desde el servidor con la llave secreta
-- (service_role), que ignora RLS. La autorización (qué cliente ve qué) se
-- hace en el código filtrando por el user id de Clerk.
--
-- Por seguridad, activamos RLS en todas las tablas SIN políticas permisivas:
-- así la llave pública (navegador) NO puede leer ni escribir nada directamente.
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

-- Sin políticas = denegado para anon/authenticated. service_role pasa por encima.
