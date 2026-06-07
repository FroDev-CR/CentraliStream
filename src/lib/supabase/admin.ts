import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la llave de servicio (service_role).
 * IGNORA RLS — usar SOLO en el servidor (webhooks, tareas administrativas).
 * Nunca importar desde código del navegador.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
