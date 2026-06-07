# Centralia Streaming

Plataforma para vender y gestionar cuentas/perfiles de streaming (Netflix, Max, Disney+, etc.) con pago por **SINPE Móvil**.

Stack: **Next.js 16 + TypeScript + Tailwind v4 + Clerk (auth) + Supabase (datos) + Vercel**.

---

## 🚀 Puesta en marcha

### 1. Variables de entorno
Copiá `.env.example` a `.env.local` y completá:
- **Clerk** (clerk.com → API Keys): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
- **Supabase** (Project Settings → API): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret key).
- `SINPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SINPE_NUMBER`, `NEXT_PUBLIC_SINPE_NAME`.
- `NEXT_PUBLIC_TEST_MODE=true` → libera la cuenta al instante al comprar (sin esperar el SMS).

### 2. Base de datos (Supabase → SQL Editor)
Ejecutá en orden (⚠️ `0001` borra y recrea las tablas — es re-ejecutable):
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/seed.sql` (servicios y productos de ejemplo)

> Los IDs de usuario son los de **Clerk** (texto). El acceso a datos se hace
> desde el servidor con la llave secreta; el navegador no toca la BD directo.

### 3. Correr
```bash
npm run dev   # http://localhost:3000
```

### 4. Crear tu admin
1. Registrate en la web (Clerk).
2. En Supabase → **Table Editor → profiles**, tu fila se crea sola al entrar al
   dashboard. Cambiá `role` de `customer` a `admin`.
3. Entrá a `/admin`.

---

## 🛒 Flujo de compra (modo prueba)
Tienda → "Agregar al carrito" → **Carrito → Finalizar compra**. Con
`NEXT_PUBLIC_TEST_MODE=true`, la cuenta se **libera al instante** desde el
inventario (no espera el SINPE). Apagá el modo prueba para producción.

> Para que haya algo que liberar, primero cargá inventario en
> **Admin → Banco de cuentas → Agregar cuenta**.

## 📲 Webhook de SINPE (producción)
La app Android reenvía el SMS a:
```
POST https://TU-DOMINIO/api/webhooks/sinpe
Authorization: Bearer <SINPE_WEBHOOK_SECRET>
Body: { "message": "<texto del SMS>" }
```
Casa el código `CENT-XXXX` del detalle con la orden y libera. Ajustá las
regex en `src/lib/sinpe/parser.ts` al formato de tu banco.

## ☁️ Deploy en Vercel
En **Settings → Environment Variables** poné TODAS las del `.env.local`
(Clerk + Supabase + SINPE + TEST_MODE). **Redesplegá** tras agregarlas.
En Clerk, agregá tu dominio de Vercel en los **dominios permitidos**.

## 🗺️ Roadmap
- ✅ Fase 1: panel admin + base de datos + webhook SINPE.
- ✅ Fase 2: tienda + carrito + dashboard cliente (compra, créditos, soporte, solicitudes).
- ⏳ Fase 3: afinar parser SINPE con SMS reales + notificaciones (email/WhatsApp).
- ⏳ Fase 4: reportes, vencimientos automáticos, CRUD admin completo.
