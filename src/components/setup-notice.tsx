export function SetupNotice() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-lg rounded-xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/40">
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-300">
          Falta conectar Supabase
        </h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/80">
          Para que el panel funcione, agregá tus llaves de Supabase en el archivo{" "}
          <code className="rounded bg-amber-200 px-1 dark:bg-amber-900">
            .env.local
          </code>
          :
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-amber-900 p-3 text-xs text-amber-100">
{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...`}
        </pre>
        <p className="mt-3 text-sm text-amber-800 dark:text-amber-200/80">
          Las encontrás en{" "}
          <span className="font-medium">
            Supabase → Project Settings → API
          </span>
          . Luego reiniciá el servidor de desarrollo.
        </p>
      </div>
    </div>
  );
}
