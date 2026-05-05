# Xplora landing — guía para el equipo

Documentación para trabajar en este repo con claridad (Juan & Rober).

## Stack

| Capa | Tecnología |
|------|------------|
| Front | React 18, Vite 5, TypeScript |
| Estilos | CSS global (`src/index.css`) + objetos de estilo en panel admin (`crmTheme`) |
| Datos públicos | API Node (`/api/public/*`) → lecturas Supabase con anon |
| Panel admin | Misma SPA; rutas admin llaman `/api/admin/*` con **JWT de Supabase** en `Authorization` |
| Backend | Express en `server/` (puerto por defecto **8787** en dev) |
| Imágenes | Cloudinary (subida firmada desde el server con Multer) |

## Arranque local

```bash
npm install
npm run dev
```

Eso levanta **en paralelo**: Vite (front) y el API Express. El front usa **proxy** para `/api` → `localhost:8787` (ver `vite.config.ts`). Opcional: `VITE_API_ORIGIN` para llamar al API sin proxy (útil al depurar).

Variables: copiar `.env.example` → `.env` (Supabase, Cloudinary, etc.).

## Mapa de carpetas (importante)

```
src/
  pages/          # Pantallas (Home, Eventos, Admin…)
  components/      # UI reutilizable; admin/ = panel CRM + emails
  lib/             # db.ts (fetch catálogo), serverApi, supabase client, rutas
  context/         # FeedbackProvider (toasts + confirmaciones)
  hooks/

server/
  src/
    http/          # rutas Express, controllers, middleware
    services/      # Auth JWT Supabase, Cloudinary
    config/
```

## Flujo de datos (resumen)

1. **Sitio público** (`fetchEventos`, etc.) → `publicFetch('/api/public/...')` → Node usa cliente Supabase **anon** y respeta RLS de lectura.
2. **Admin** (`authFetch`) adjunta el token de sesión; Node valida JWT y el cliente Supabase usa ese usuario → **RLS** aplica políticas `authenticated`.

Ver rutas en `server/src/http/routes/register-api.routes.ts`.

## Convenciones de código

- **Tipos compartidos**: `src/types.ts` — filas DB en `snake_case` (`DbEvento`); modelos de UI en camelCase (`Evento`).
- **Comentarios**: JSDoc en funciones exportadas y “por qué” en lógica no obvia; evitar repetir lo que ya dice el nombre del símbolo.
- **Panel admin**: componentes CRM en `components/admin/crm/`; emails en `components/admin/email*.tsx` y `emailTemplate*.ts`.

## Migraciones SQL

En `supabase/migrations/`. Orden cronológico por nombre de archivo. Documentar en el propio `.sql` qué tabla/vista toca.

## Más ayuda

Los archivos centrales llevan encabezados `/** ... */` al inicio del módulo: empezá por `src/lib/db.ts`, `src/lib/serverApi.ts`, `src/pages/Admin.tsx`, `server/src/http/routes/register-api.routes.ts`.
