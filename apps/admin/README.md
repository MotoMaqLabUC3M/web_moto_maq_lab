# MotoMaqLab Admin

Panel de administración **mobile-first** (Next.js 15) para equipo y blog.

# Panel en /admin — requiere API en marcha (make api-dev)

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Abre http://localhost:3001/admin/login (en local usa `make admin-dev` desde la raíz del monorepo)

## Pantallas

- `/dashboard` — Estado del CMS en vivo
- `/login` — Autenticación JWT
- `/team` — Departamentos y miembros
- `/blog` — Editor por bloques (BlockNote)
- `/account` — Sesión

Los cambios se publican al instante vía API — no hay paso de exportar JSON.

## Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Docker

Incluido en `deploy/docker-compose.yml` (producción) y `docker-compose.dev.yml`.
