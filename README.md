# MotoMaqLab Platform

Monorepo de la plataforma **MOTO-MAQLAB-UC3M**: sitio web público, API REST y panel de administración (CMS).

En producción todo vive bajo **un solo dominio**:

| Ruta | Qué es |
|------|--------|
| `/` | Web pública (HTML estático) |
| `/admin/` | Panel CMS (no indexado) |
| `/api/` | API REST |
| `/media/` | Imágenes subidas desde el admin |

La **base de datos es la fuente de verdad**. Lo que publicas en el panel aparece al instante en la web; no hay exportación manual a JSON.

---

## Requisitos

| Herramienta | Versión mínima | Para qué |
|-------------|----------------|----------|
| **Go** | 1.22+ | API backend |
| **Node.js** | 20+ | Panel admin (Next.js) |
| **npm** | 10+ | Dependencias del admin |
| **Docker** *(opcional)* | 24+ | Despliegue en VPS |
| **Python 3** *(opcional)* | 3.10+ | Scripts del sitio / `make site-dev` |

---

## Instalación rápida (desarrollo local)

### 1. Clonar el repositorio

```bash
git clone https://github.com/MotoMaqLabUC3M/web_moto_maq_lab.git
cd web_moto_maq_lab
```

### 2. Configurar variables de entorno

**API** — copia el ejemplo y ajusta si hace falta:

```bash
cp apps/api/.env.example apps/api/.env
```

Valores por defecto en desarrollo:

- Usuario admin: `admin`
- Contraseña: la que pongas en `ADMIN_PASSWORD` (el ejemplo trae un placeholder; cámbialo)
- SQLite en `apps/api/data/motomaqlab.db`

**Panel admin:**

```bash
cp apps/admin/.env.local.example apps/admin/.env.local
```

Contenido típico:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> En local con `make dev` la web llama a la API a través del gateway (`http://localhost:3000/api/`), pero el admin habla directo con la API en `:8080`.

### 3. Importar contenido legacy (primera vez)

Si vienes del sitio estático con JSON en `apps/site/assets/data/`:

```bash
make import-legacy
```

Importa departamentos, miembros del equipo y posts del blog a SQLite.

### 4. Arrancar todo

```bash
make dev
```

Abre **http://localhost:3000**:

- **Web pública** → `/`
- **Admin** → enlace **Admin** al final del footer, o directamente `/admin/login`
- **API** → `/api/` (proxy al backend en `:8080`)

Credenciales: las de `ADMIN_USERNAME` / `ADMIN_PASSWORD` en `apps/api/.env`.

Para parar: `Ctrl+C` en la terminal.

---

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `make dev` | **Recomendado.** API + admin + gateway en `:3000` |
| `make import-legacy` | Importar JSON del sitio a la BD (una vez) |
| `make api-dev` | Solo API en `:8080` |
| `make admin-dev` | Solo panel admin en `:3001` |
| `make site-dev` | Solo HTML estático en `:5500` (sin `/admin`) |
| `make api-build` | Compilar binario de la API |
| `make admin-build` | Build de producción del admin |
| `make docker-dev` | Stack dev con Docker + SQLite |
| `make docker-prod` | Stack prod (Postgres + nginx) para VPS |
| `make site-generate` | Regenerar HTML del equipo, sitemap, etc. |

---

## Estructura del monorepo

```
.
├── apps/
│   ├── site/       # Sitio estático público (HTML, CSS, JS)
│   ├── api/        # Backend Go — REST, JWT, SQLite/Postgres
│   └── admin/      # Panel Next.js 15 en /admin (BlockNote, Mantine)
├── deploy/         # Docker Compose + nginx (VPS)
├── scripts/
│   ├── dev.sh      # Orquestador de make dev
│   └── devgateway/ # Proxy local :3000 → web + /admin + /api
├── Makefile
└── README.md
```

---

## Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  apps/site  │────▶│  apps/api   │◀────│ apps/admin  │
│  (público)  │     │   (Go)      │     │  (Next.js)  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │ SQLite /    │
                    │ PostgreSQL  │
                    └─────────────┘
```

| Componente | Rol |
|------------|-----|
| **Site** | HTML estático; carga datos con `cms-api.js` (API + fallback JSON) |
| **API** | CRUD interno + endpoints públicos sin auth |
| **Admin** | Gestión de equipo, blog e imágenes; editor tipo Notion |

### Endpoints públicos (sin autenticación)

- `GET /api/v1/public/team?locale=es|en`
- `GET /api/v1/public/blog?locale=es|en`
- `GET /api/v1/public/blog/{slug}?locale=es|en`
- `GET /media/*` — archivos subidos

---

## Despliegue en VPS (producción)

### 1. Preparar entorno

```bash
cd deploy
cp .env.example .env
```

Edita `.env`:

- `JWT_SECRET` — secreto largo y aleatorio (mín. 32 caracteres)
- `ADMIN_PASSWORD` — contraseña segura del panel
- `POSTGRES_PASSWORD` — contraseña de Postgres
- `PUBLIC_API_BASE_URL` — URL pública del sitio (ej. `https://motomaqlabuc3m.es`)
- `NEXT_PUBLIC_API_URL` — misma URL pública (nginx hace proxy de `/api`)
- `CORS_ORIGINS` — dominio del sitio

### 2. Levantar stack

```bash
make docker-prod
# o: cd deploy && docker compose up -d --build
```

Nginx sirve:

- `/` → archivos estáticos de `apps/site`
- `/admin/` → contenedor Next.js
- `/api/` y `/media/` → contenedor Go

El panel queda en `https://tudominio.es/admin/` y **no se indexa** (`robots.txt`, `noindex`, cabeceras nginx).

### 3. Importar datos (primera vez en el servidor)

```bash
docker compose exec api /app/import -site /site
```

(Ajusta según cómo montes volúmenes en tu `docker-compose.yml`.)

---

## Desarrollo: cómo funciona `make dev`

`scripts/dev.sh` levanta tres procesos:

1. **API** en `:8080` (Go + SQLite)
2. **Admin** en `:3001` (Next.js con `basePath: /admin`)
3. **Gateway** en `:3000` — sirve la web estática y hace proxy de `/admin/` y `/api/`

Así el entorno local replica la misma URL que producción: un solo puerto, rutas distintas.

---

## Migración desde el sitio estático anterior

El repo antes era solo HTML en la raíz. Ahora el sitio vive en `apps/site/`. Los JSON en `apps/site/assets/data/` siguen como **fallback** si la API no responde.

Para poblar la BD desde esos JSON:

```bash
make import-legacy
```

---

## Seguridad

- No subas `.env`, `.env.local` ni credenciales al repositorio (ya están en `.gitignore`).
- Cambia `JWT_SECRET` y `ADMIN_PASSWORD` antes de desplegar.
- El panel en `/admin` tiene `noindex` y no debe aparecer en buscadores.

---

## Licencia

Proyecto del equipo **MOTO-MAQLAB-UC3M**.
