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

Incluye extensiones de Image Sitemap (xmlns:image) para declarar
explícitamente las imágenes de cada página, mejorando la indexación
de Google Images y evitando que elija imágenes incorrectas (ej. logos
de patrocinadores en la página de patrocinadores).

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


def image_entry(loc: str, caption: str, title: str = "") -> str:
    """Genera un bloque <image:image> para el Image Sitemap."""
    title_tag = f"\n      <image:title>{title}</image:title>" if title else ""
    return (
        f"    <image:image>\n"
        f"      <image:loc>{loc}</image:loc>\n"
        f"      <image:caption>{caption}</image:caption>"
        f"{title_tag}\n"
        f"    </image:image>"
    )


def url_entry(loc: str, lastmod: str, changefreq: str, priority: str,
              images=None) -> str:
    """Genera un bloque <url> con soporte opcional de Image Sitemap."""
    img_block = "\n" + "\n".join(images) if images else ""
    return (
        f"  <url>\n"
        f"    <loc>{loc}</loc>\n"
        f"    <lastmod>{lastmod}</lastmod>\n"
        f"    <changefreq>{changefreq}</changefreq>\n"
        f"    <priority>{priority}</priority>"
        f"{img_block}\n"
        f"  </url>"
    )


# ── Imagen hero representativa de cada página principal ──────────────
# Estas imágenes son las que queremos que Google muestre en resultados.

PAGE_HERO_IMAGES = {
    "index.html": (
        "assets/img/home/equipo_index.webp",
        "Equipo MotoMaqLab UC3M celebrando con el prototipo de competición MotoStudent"
    ),
    "index-en.html": (
        "assets/img/home/equipo_index.webp",
        "MotoMaqLab UC3M team celebrating with MotoStudent competition prototype"
    ),
    "sobre-nosotros.html": (
        "assets/img/hero/sobre-nosotros.webp",
        "Equipo MotoMaqLab UC3M en el Circuito de MotorLand Aragón — Ingeniería y competición"
    ),
    "about-us.html": (
        "assets/img/hero/sobre-nosotros.webp",
        "MotoMaqLab UC3M team at MotorLand Aragón Circuit — Engineering and competition"
    ),
    # equipo.html y team.html → se generan desde JSON con build_team_images()
    "patrocinadores.html": (
        "assets/img/hero/patrocinadores.webp",
        "Patrocinadores de MotoMaqLab UC3M — empresas e instituciones que apoyan la ingeniería de competición"
    ),
    "sponsors.html": (
        "assets/img/hero/patrocinadores.webp",
        "MotoMaqLab UC3M Sponsors — companies and institutions supporting competition engineering"
    ),
    "eventos.html": (
        "assets/img/hero/eventos.webp",
        "Eventos y calendario del equipo MotoMaqLab UC3M en MotoStudent"
    ),
    "events.html": (
        "assets/img/hero/eventos.webp",
        "MotoMaqLab UC3M team events and MotoStudent competition calendar"
    ),
    "blog.html": (
        "assets/img/hero/blog.webp",
        "Blog y noticias del equipo MotoMaqLab UC3M — ingeniería y competición"
    ),
    "blog-en.html": (
        "assets/img/hero/blog.webp",
        "MotoMaqLab UC3M team blog and news — engineering and motorsport"
    ),
    "motostudent.html": (
        "assets/img/motostudent/moto_en_pista.jpeg",
        "Prototipo MotoMaqLab UC3M en el Circuito FIM de MotorLand Aragón — MotoStudent"
    ),
    "motostudent-en.html": (
        "assets/img/motostudent/moto_en_pista.jpeg",
        "MotoMaqLab UC3M prototype at FIM MotorLand Aragón Circuit — MotoStudent"
    ),
    "unete.html": (
        "assets/img/home/header_unete.webp",
        "Únete al equipo MotoMaqLab UC3M — Proceso de captación para la temporada MotoStudent"
    ),
}

# ── Páginas principales ──────────────────────────────────────────────

MAIN_PAGES = [
    {"file": "index.html", "loc": "/", "changefreq": "weekly", "priority": "1.0"},
    {"file": "index-en.html", "loc": "/index-en.html", "changefreq": "weekly", "priority": "1.0"},
    {"file": "unete.html", "loc": "/unete.html", "changefreq": "monthly", "priority": "0.9"},
    {"file": "sobre-nosotros.html", "loc": "/sobre-nosotros.html", "changefreq": "monthly", "priority": "0.8"},
    {"file": "about-us.html", "loc": "/about-us.html", "changefreq": "monthly", "priority": "0.8"},
    {"file": "equipo.html", "loc": "/equipo.html", "changefreq": "monthly", "priority": "0.8"},
    {"file": "team.html", "loc": "/team.html", "changefreq": "monthly", "priority": "0.8"},
    {"file": "patrocinadores.html", "loc": "/patrocinadores.html", "changefreq": "monthly", "priority": "0.8"},
    {"file": "sponsors.html", "loc": "/sponsors.html", "changefreq": "monthly", "priority": "0.8"},
    {"file": "eventos.html", "loc": "/eventos.html", "changefreq": "weekly", "priority": "0.8"},
    {"file": "events.html", "loc": "/events.html", "changefreq": "weekly", "priority": "0.8"},
    {"file": "blog.html", "loc": "/blog.html", "changefreq": "weekly", "priority": "0.8"},
    {"file": "blog-en.html", "loc": "/blog-en.html", "changefreq": "weekly", "priority": "0.8"},
    {"file": "motostudent.html", "loc": "/motostudent.html", "changefreq": "monthly", "priority": "0.8"},
    {"file": "motostudent-en.html", "loc": "/motostudent-en.html", "changefreq": "monthly", "priority": "0.8"},
]


def build_team_images(json_path: str) -> list:
    """
    Genera los bloques image: para todos los miembros del equipo
    (excluye placeholders y duplicados).
    Pone primero la imagen hero de la página de equipo.
    """
    data = read_json(json_path)
    images = []

    # Hero de la página de equipo (foto grupal)
    images.append(image_entry(
        f"{DOMAIN}/assets/img/hero/equipo.webp",
        "Equipo completo MotoMaqLab UC3M — ingenieros y estudiantes MotoStudent UC3M"
    ))

    seen = set()
    for section in data.get("sections", []):
        for member in section.get("members", []):
            if member.get("isPlaceholder"):
                continue
            img_path = member.get("image", "")
            if not img_path or img_path in seen:
                continue
            seen.add(img_path)
            name = member.get("name", "")
            role = member.get("role", "")
            caption = f"Foto de {name}, {role} en MotoMaqLab UC3M"
            title = f"{name} — {role} | MotoMaqLab UC3M"
            images.append(image_entry(
                f"{DOMAIN}/{img_path}",
                caption,
                title
            ))
    return images


def main():
    main_entries = []
    pat_entries = []
    evt_entries = []
    blog_entries = []

    # 1) Páginas principales – lastmod del propio archivo HTML + imágenes declaradas
    for page in MAIN_PAGES:
        file_path = ROOT / page["file"]
        lastmod = get_last_modified(file_path)
        images = []

        if page["file"] == "equipo.html":
            images = build_team_images("assets/data/equipo.json")
        elif page["file"] == "team.html":
            images = build_team_images("assets/data/equipo-en.json")
        elif page["file"] in PAGE_HERO_IMAGES:
            img_url, caption = PAGE_HERO_IMAGES[page["file"]]
            images.append(image_entry(f"{DOMAIN}/{img_url}", caption))

        main_entries.append(url_entry(
            f'{DOMAIN}{page["loc"]}', lastmod,
            page["changefreq"], page["priority"],
            images if images else None
        ))

    # 2) Patrocinadores con página dedicada (Español e Inglés)
    for lang_file in ["assets/data/patrocinadores.json", "assets/data/patrocinadores-en.json"]:
        json_path = ROOT / lang_file
        if json_path.exists():
            pat_data = read_json(lang_file)
            pat_lastmod = get_last_modified(json_path)
            for tier in pat_data.get("tiers", []):
                for sponsor in tier.get("sponsors", []):
                    if sponsor.get("dedicatedPage"):
                        sponsor_images = []
                        logo = sponsor.get("logo", "")
                        name = sponsor.get("name", "")
                        if logo:
                            sponsor_images.append(image_entry(
                                f"{DOMAIN}/{logo}",
                                f"Logo de {name}, patrocinador de MotoMaqLab UC3M",
                                f"{name} — Patrocinador MotoMaqLab UC3M"
                            ))
                        # Primera foto de galería si existe
                        galeria = sponsor.get("galeria", [])
                        if galeria:
                            sponsor_images.append(image_entry(
                                f"{DOMAIN}/{galeria[0]}",
                                f"{name} colaborando con MotoMaqLab UC3M en MotoStudent"
                            ))
                        pat_entries.append(url_entry(
                            f"{DOMAIN}/{sponsor['dedicatedPage']}",
                            pat_lastmod, "monthly", "0.8",
                            sponsor_images if sponsor_images else None
                        ))

    # 3) Eventos
    evt_data = read_json("assets/data/eventos.json")
    evt_lastmod = get_last_modified(ROOT / "assets/data/eventos.json")
    for evento in evt_data["eventos"]:
        eid = str(evento.get("id", "")).strip()
        if not eid:
            continue
        evt_images = None
        img = evento.get("imagen") or evento.get("image")
        if img:
            titulo = evento.get("titulo", evento.get("title", f"Evento {eid}"))
            evt_images = [image_entry(
                f"{DOMAIN}/{img}",
                f"{titulo} — MotoMaqLab UC3M"
            )]
        evt_entries.append(url_entry(
            f"{DOMAIN}/evento-{quote(eid)}.html",
            lastmod_for_item(evento, evt_lastmod), "monthly", "0.6",
            evt_images
        ))

    # 4) Blog posts (skip newsletters — they redirect to PDF, not a real page)
    blog_data = read_json("assets/data/blog.json")
    blog_lastmod = get_last_modified(ROOT / "assets/data/blog.json")
    for post in blog_data["posts"]:
        pid = str(post.get("id", "")).strip()
        if not pid:
            continue
        # Newsletters open the PDF directly; they have no detail page to index
        cat = str(post.get("categoria", "")).strip().lower()
        if cat == "newsletter":
            continue
        post_images = None
        img = post.get("imagen") or post.get("image") or post.get("thumbnail")
        if img:
            titulo = post.get("titulo", post.get("title", f"Artículo {pid}"))
            post_images = [image_entry(
                f"{DOMAIN}/{img}",
                f"{titulo} — MotoMaqLab UC3M"
            )]
        blog_entries.append(url_entry(
            f"{DOMAIN}/noticia-{quote(pid)}.html",
            lastmod_for_item(post, blog_lastmod), "monthly", "0.6",
            post_images
        ))

    # 5) Blog posts EN (skip newsletters)
    blog_en_data = read_json("assets/data/blog-en.json")
    blog_en_lastmod = get_last_modified(ROOT / "assets/data/blog-en.json")
    for post in blog_en_data.get("posts", []):
        pid = str(post.get("id", "")).strip()
        if not pid:
            continue
        cat = str(post.get("categoria", "")).strip().lower()
        if cat == "newsletter":
            continue
        post_images = None
        img = post.get("imagen") or post.get("image") or post.get("thumbnail")
        if img:
            titulo = post.get("titulo", post.get("title", f"Article {pid}"))
            post_images = [image_entry(
                f"{DOMAIN}/{img}",
                f"{titulo} — MotoMaqLab UC3M"
            )]
        blog_entries.append(url_entry(
            f"{DOMAIN}/news-{quote(pid)}.html",
            lastmod_for_item(post, blog_en_lastmod), "monthly", "0.6",
            post_images
        ))

    # ── Generar XML ──────────────────────────────────────────────────
    now = datetime.now(tz=timezone.utc).isoformat()
    total = len(main_entries) + len(pat_entries) + len(evt_entries) + len(blog_entries)

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Generado automáticamente por scripts/generate_sitemap.py -->
  <!-- Última generación: {now} -->

  <!-- Páginas principales -->
{chr(10).join(main_entries)}

  <!-- Detalle de patrocinadores -->
{chr(10).join(pat_entries)}

  <!-- Detalle de eventos -->
{chr(10).join(evt_entries)}

  <!-- Detalle de blog (ES + EN) -->
{chr(10).join(blog_entries)}

</urlset>
"""

    out_path = ROOT / "sitemap.xml"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(xml)

    print(f"[OK] sitemap.xml generado con {total} URLs")
    print(f"   Páginas principales: {len(main_entries)}")
    print(f"   Patrocinadores ES+EN: {len(pat_entries)}")
    print(f"   Eventos: {len(evt_entries)}")
    print(f"   Blog posts ES+EN: {len(blog_entries)}")


if __name__ == "__main__":
    main()
