# Sitio público MOTO-MAQLAB-UC3M

Sitio estático desplegado en **GitHub Pages** (`motomaqlabuc3m.es`).

## Contenido

- Páginas HTML (ES/EN)
- `assets/` — CSS, JS, imágenes, JSON de datos
- `scripts/` — Generadores Python (sitemap, páginas detalle, equipo)

## Generar páginas estáticas

```bash
python3 scripts/generate_team_html.py
python3 scripts/generate_sitemap.py
python3 scripts/generate_detail_pages.py
```

O desde la raíz: `make site-generate`

## Datos CMS

En producción (VPS), el sitio consume la **API en vivo**:

- `GET /api/v1/public/team`
- `GET /api/v1/public/blog`
- `GET /api/v1/public/blog/{slug}`

El script `assets/js/cms-api.js` hace fetch a la API y usa los JSON en `assets/data/` como fallback (GitHub Pages / offline).
