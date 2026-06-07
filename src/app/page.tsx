import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight">
          Centralia<span className="text-red-600">Streaming</span>
        </span>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Ingresar
          </Link>
          <Link
            href="/login?signup=1"
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Tus cuentas de streaming, al instante.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Netflix, Max, Disney+ y más. Comprá con SINPE Móvil y recibí tu acceso
          automáticamente. Gestioná todo desde tu panel.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/login?signup=1"
            className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
          >
            Empezar ahora
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-zinc-300 px-6 py-3 font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { t: "Pago con SINPE", d: "Pagás con tu detalle único y se libera solo." },
            { t: "Recargá créditos", d: "Dejá saldo y comprá al instante cuando querás." },
            { t: "Soporte directo", d: "Chat, cambio de PIN y de nombre de perfil." },
          ].map((f) => (
            <div
              key={f.t}
              className="rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{f.t}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{f.d}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-8 text-center text-sm text-zinc-400">
        © {new Date().getFullYear()} Centralia Streaming
      </footer>
    </div>
  );
}
