#!/usr/bin/env python3
"""
generate_sitemap.py

Genera automáticamente el sitemap.xml leyendo:
  - Los archivos HTML principales del proyecto
  - Los JSON de datos dinámicos (patrocinadores, eventos, blog)

Las fechas <lastmod> usan la fecha del contenido (evento/post) cuando
existe (YYYY-MM-DD); si no, la mtime del JSON o del HTML.

No incluye: 404.html, creador_*.html (tienen noindex), ni plantillas
vacías — solo MAIN_PAGES + URLs de datos (patrocinadores, eventos, blog).

Uso:
  py scripts/generate_sitemap.py

Se ejecutará desde la raíz del proyecto y sobrescribirá sitemap.xml.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import quote

DOMAIN = "https://motomaqlabuc3m.es"
ROOT = Path(__file__).resolve().parent.parent


def get_last_modified(file_path: Path) -> str:
    """Devuelve la fecha de última modificación en formato YYYY-MM-DD."""
    try:
        mtime = os.path.getmtime(file_path)
        return datetime.fromtimestamp(mtime, tz=timezone.utc).strftime("%Y-%m-%d")
    except OSError:
        return datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")


def read_json(rel_path: str) -> dict:
    full = ROOT / rel_path
    with open(full, "r", encoding="utf-8") as f:
        return json.load(f)


def iso_date_prefix(value) -> Optional[str]:
    """Devuelve YYYY-MM-DD si el valor es una fecha ISO reconocible."""
    if not value or not isinstance(value, str):
        return None
    s = value.strip()
    if len(s) >= 10 and s[4] == "-" and s[7] == "-":
        return s[:10]
    return None


def lastmod_for_item(item: dict, json_fallback: str) -> str:
    for key in ("updatedAt", "fechaModificacion", "fechaFin", "fecha"):
        d = iso_date_prefix(item.get(key))
        if d:
            return d
    return json_fallback


def url_entry(loc: str, lastmod: str, changefreq: str, priority: str) -> str:
    return (
        f"  <url>\n"
        f"    <loc>{loc}</loc>\n"
        f"    <lastmod>{lastmod}</lastmod>\n"
        f"    <changefreq>{changefreq}</changefreq>\n"
        f"    <priority>{priority}</priority>\n"
        f"  </url>"
    )


# ── Páginas principales ──────────────────────────────────────────────

MAIN_PAGES = [
    {"file": "index.html", "loc": "/", "changefreq": "weekly", "priority": "1.0"},
    {"file": "sobre-nosotros.html", "loc": "/sobre-nosotros.html", "changefreq": "monthly", "priority": "0.8"},
    {"file": "equipo.html", "loc": "/equipo.html", "changefreq": "monthly", "priority": "0.8"},
    {"file": "patrocinadores.html", "loc": "/patrocinadores.html", "changefreq": "monthly", "priority": "0.8"},
    {"file": "eventos.html", "loc": "/eventos.html", "changefreq": "weekly", "priority": "0.8"},
    {"file": "blog.html", "loc": "/blog.html", "changefreq": "weekly", "priority": "0.8"},
]


def main():
    main_entries = []
    pat_entries = []
    evt_entries = []
    blog_entries = []

    # 1) Páginas principales – lastmod del propio archivo HTML
    for page in MAIN_PAGES:
        file_path = ROOT / page["file"]
        lastmod = get_last_modified(file_path)
        main_entries.append(url_entry(f'{DOMAIN}{page["loc"]}', lastmod, page["changefreq"], page["priority"]))

    # 2) Patrocinadores con página dedicada
    pat_data = read_json("assets/data/patrocinadores.json")
    pat_lastmod = get_last_modified(ROOT / "assets/data/patrocinadores.json")
    for tier in pat_data["tiers"]:
        for sponsor in tier["sponsors"]:
            if sponsor.get("dedicatedPage"):
                pat_entries.append(url_entry(
                    f"{DOMAIN}/{sponsor['dedicatedPage']}",
                    pat_lastmod, "monthly", "0.6"
                ))

    # 3) Eventos
    evt_data = read_json("assets/data/eventos.json")
    evt_lastmod = get_last_modified(ROOT / "assets/data/eventos.json")
    for evento in evt_data["eventos"]:
        eid = quote(str(evento.get("id", "")))
        if not eid:
            continue
        evt_entries.append(url_entry(
            f"{DOMAIN}/evento.html?id={eid}",
            lastmod_for_item(evento, evt_lastmod), "monthly", "0.6"
        ))

    # 4) Blog posts
    blog_data = read_json("assets/data/blog.json")
    blog_lastmod = get_last_modified(ROOT / "assets/data/blog.json")
    for post in blog_data["posts"]:
        pid = quote(str(post.get("id", "")))
        if not pid:
            continue
        blog_entries.append(url_entry(
            f"{DOMAIN}/noticia.html?id={pid}",
            lastmod_for_item(post, blog_lastmod), "monthly", "0.6"
        ))

    # ── Generar XML ──────────────────────────────────────────────────
    now = datetime.now(tz=timezone.utc).isoformat()
    total = len(main_entries) + len(pat_entries) + len(evt_entries) + len(blog_entries)

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Generado automáticamente por scripts/generate_sitemap.py -->
  <!-- Última generación: {now} -->

  <!-- Páginas principales -->
{chr(10).join(main_entries)}

  <!-- Detalle de patrocinadores -->
{chr(10).join(pat_entries)}

  <!-- Detalle de eventos -->
{chr(10).join(evt_entries)}

  <!-- Detalle de blog -->
{chr(10).join(blog_entries)}

</urlset>
"""

    out_path = ROOT / "sitemap.xml"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(xml)

    print(f"[OK] sitemap.xml generado con {total} URLs")
    print(f"   Páginas principales: {len(main_entries)}")
    print(f"   Patrocinadores: {len(pat_entries)}")
    print(f"   Eventos: {len(evt_entries)}")
    print(f"   Blog posts: {len(blog_entries)}")


if __name__ == "__main__":
    main()
