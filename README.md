# JM Farmacia — Demo de gestión

Demo premium de un sistema de gestión para farmacia (República Dominicana).
Construido con Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
y Supabase.

> **TANDA 1 — Cimientos.** Esta entrega incluye: sistema de diseño (dos temas
> premium con toggle persistente), primitivos animados reutilizables, login con
> usuario + contraseña (validado en el servidor) y el layout base (sidebar +
> header + navegación móvil). Los módulos de negocio llegan en próximas tandas.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **Framer Motion** (toda la animación)
- **Supabase** (base de datos, auth, storage) + **Vercel** (deploy + previews)
- **lucide-react** (iconos) · **Recharts** (gráficos, tandas futuras)

## Variables de entorno

Copia `.env.example` a `.env.local` (local) o configúralas en Vercel:

| Variable | Dónde | Notas |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Llave anónima |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor** | Marcar "Sensitive". **Nunca** con prefijo `NEXT_PUBLIC_` |
| `INTERNAL_EMAIL_DOMAIN` | Servidor | Dominio interno para mapear usuario → email (def. `jmfarmacia.local`) |

## Seguridad

- **RLS + FORCE** activado en todas las tablas (`supabase/migrations/0001_init.sql`).
- Auth validada en el **servidor** (middleware + Server Actions).
- El login usa **usuario + contraseña**; el email es interno y nunca se muestra.

## Desarrollo local

```bash
npm install
npm run dev
```

La base de datos se aplica con las migraciones en `supabase/migrations/`.

## Estructura

```
app/
  login/            Pantalla de login (usuario + contraseña)
  (app)/            Shell protegido (sidebar + header)
    dashboard/      Panel general (showcase de primitivos)
    inventario/ …   Placeholders de módulos futuros
components/
  motion/           Primitivos animados reutilizables
  theme/            Proveedor de tema + toggle sol/luna
  layout/           Sidebar, header, navegación
  ui/               Card, Button
lib/supabase/       Clientes de Supabase (browser/server/middleware)
supabase/migrations Esquema con RLS + FORCE
```
