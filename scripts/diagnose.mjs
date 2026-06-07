// Diagnóstico rápido del estado de la base de datos.
// Correr con:  node --env-file=.env.local scripts/diagnose.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false },
});

const tables = [
  "profiles",
  "services",
  "products",
  "streaming_accounts",
  "account_profiles",
  "orders",
  "entitlements",
  "sinpe_messages",
  "service_requests",
];

console.log("Conectando a:", url);
console.log("---------------------------------------------");

for (const t of tables) {
  const { count, error } = await db
    .from(t)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.log(`❌ ${t.padEnd(20)} ERROR: ${error.message}`);
  } else {
    console.log(`✅ ${t.padEnd(20)} ${count} filas`);
  }
}

console.log("---------------------------------------------");
// ¿Hay algún admin?
const { data: admins } = await db
  .from("profiles")
  .select("email, role")
  .eq("role", "admin");
console.log(
  "Admins:",
  admins?.length ? admins.map((a) => a.email).join(", ") : "NINGUNO todavía",
);
