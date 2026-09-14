# MotoMaqLab API

Backend REST en Go (Chi) — CMS SaaS para equipo y blog.

## Estructura

```
apps/api/
├── cmd/api/              # Servidor HTTP
├── cmd/import/           # Migración JSON → BD (una vez)
├── internal/
│   ├── config/
│   ├── domain/
│   ├── repository/
│   ├── service/
│   ├── external/publicformat/  # Respuestas públicas compatibles con el sitio
│   ├── handler/
│   ├── middleware/
│   └── router/
├── Dockerfile
└── .env.example
```

## Desarrollo

```bash
cp .env.example .env
go run ./cmd/api
```

## Endpoints

### Públicos (sitio web)

| Método | Ruta |
|--------|------|
| GET | `/api/v1/public/team?locale=es` |
| GET | `/api/v1/public/blog?locale=es` |
| GET | `/api/v1/public/blog/{slug}?locale=es` |
| GET | `/media/*` |

### Admin (JWT)

| Método | Ruta |
|--------|------|
| POST | `/api/v1/auth/login` |
| GET | `/api/v1/stats` |
| CRUD | `/api/v1/departments`, `/api/v1/members/*` |
| CRUD | `/api/v1/blog/posts` |
| POST | `/api/v1/media/upload` |

Documentación completa en el README raíz del monorepo.
