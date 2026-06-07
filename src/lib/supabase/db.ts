import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cliente de base de datos para uso EN EL SERVIDOR.
 * Usa la llave de servicio (ignora RLS). La autorización por usuario se hace
 * en el código filtrando por el user id de Clerk. Nunca usar en el navegador.
 */
export function db() {
  return createAdminClient();
}
