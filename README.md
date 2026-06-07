# Centralia Streaming

Plataforma para vender y gestionar cuentas/perfiles de streaming (Netflix, Max, Disney+, etc.) con pago por **SINPE Móvil**.

Stack: **Next.js 16 + TypeScript + Tailwind v4 + Supabase + Vercel**.

---

## 🚀 Puesta en marcha (paso a paso)

### 1. Crear el proyecto en Supabase
1. Entrá a [supabase.com](https://supabase.com) → **New project**.
2. Anotá la contraseña de la base de datos.
3. Cuando esté listo, andá a **Project Settings → API** y copiá:
   - `Project URL`
   - `anon public` key
   - `service_role` key (¡secreta!)

### 2. Configurar variables de entorno
Editá el archivo `.env.local` (ya existe) con tus llaves:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SINPE_WEBHOOK_SECRET=algo-largo-y-aleatorio
```

### 3. Crear las tablas (migraciones)
En el dashboard de Supabase → **SQL Editor**, ejecutá en orden el contenido de:
1. `supabase/migrations/0001_init.sql`  (tablas, enums, triggers)
2. `supabase/migrations/0002_rls.sql`   (seguridad por fila)
3. `supabase/seed.sql`                  (datos de ejemplo, opcional)

> Más adelante podemos usar la CLI de Supabase para automatizar esto.

### 4. Activar login con Google (opcional pero recomendado)
Supabase → **Authentication → Providers → Google** → activar y poner las
credenciales de Google Cloud. Agregá la URL de callback que indica Supabase.

### 5. Correr la app
```bash
npm run dev
```
Abrí http://localhost:3000

### 6. Crear tu usuario admin
1. Registrate normalmente en la web (con tu correo).
2. En Supabase → **Table Editor → profiles**, buscá tu fila y cambiá
   `role` de `customer` a `admin`.
3. Entrá a http://localhost:3000/admin

---

## 📲 El webhook de SINPE (automatización del pago)

Cuando llega un SMS del banco, una app en un teléfono Android lo reenvía a:

```
POST  https://tu-dominio.vercel.app/api/webhooks/sinpe
Header:  Authorization: Bearer <SINPE_WEBHOOK_SECRET>
Body:    { "message": "<texto completo del SMS>" }
```

El sistema:
1. Parsea monto, detalle y remitente (`src/lib/sinpe/parser.ts`).
2. Busca el código `CENT-XXXX` en el detalle.
3. Casa con la orden pendiente y, si el monto alcanza, **libera la cuenta automáticamente**.

**App Android sugerida:** MacroDroid o "SMS to URL Forwarder" (gratis).
Configurás un disparador "SMS recibido del banco" → acción "HTTP POST" con el
header y body de arriba.

> ⚠️ Ajustá las expresiones regulares en `src/lib/sinpe/parser.ts` al formato
> exacto de los SMS de tu banco (BAC, BN, BCR…). Pasame un par de ejemplos
> reales (sin datos sensibles) y lo afino.

---

## 📁 Estructura

```
src/
  app/
    page.tsx              landing
    login/                ingreso (Google + email)
    dashboard/            panel del cliente (Fase 2)
    admin/                panel de administración (Fase 1)
      inventario/         banco de cuentas
      clientes/  ordenes/  sinpe/  productos/  solicitudes/
    api/webhooks/sinpe/   webhook que recibe los SMS
    auth/                 callback OAuth + logout
  components/             UI (admin, ui)
  lib/
    supabase/             clientes (browser, server, admin)
    sinpe/                parser + liberación de órdenes
    types.ts  auth.ts  utils.ts  config.ts
supabase/
  migrations/  seed.sql
```

## 🗺️ Roadmap
- **Fase 1 (hecho):** panel admin + base de datos + webhook SINPE.
- **Fase 2:** tienda + dashboard del cliente (compra, créditos, soporte, solicitudes).
- **Fase 3:** afinar automatización SINPE + notificaciones.
- **Fase 4:** reportes, vencimientos automáticos, WhatsApp/email.
