#!/usr/bin/env python3
"""
Genera páginas estáticas sin query string (mejor para SEO y enlaces):
  evento-<id>.html, noticia-<id>.html, patrocinador-<id>.html

Cada archivo incluye meta title, description, canonical y Open Graph / Twitter
correctos en el HTML inicial (no solo vía JavaScript).

Uso (desde la raíz del repo):
  python3 scripts/generate_detail_pages.py
"""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = "https://motomaqlabuc3m.es"

PREFIXES = ("evento-", "noticia-", "news-", "patrocinador-")


def read_json(rel: str) -> dict:
    with open(ROOT / rel, "r", encoding="utf-8") as f:
        return json.load(f)


def safe_id(raw: str) -> str:
    if not raw or not isinstance(raw, str):
        return ""
    raw = raw.strip()
    if re.search(r'[<>:"/\\\\|?*]', raw):
        raise ValueError(f"id no válido para nombre de archivo: {raw!r}")
    return raw


def truncate(text: str, max_len: int = 155) -> str:
    if not text:
        return ""
    t = re.sub(r"\s+", " ", str(text)).strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 1].rstrip() + "\u2026"


def absolute_url(path: str) -> str:
    if not path:
        return ORIGIN + "/assets/img/hero/index.webp"
    if path.startswith("http://") or path.startswith("https://"):
        return path
    p = path.replace("./", "").lstrip("/")
    return f"{ORIGIN}/{p}"


def canonical_path_for(prefix: str, slug: str, item: dict | None = None) -> str:
    sid = safe_id(slug)
    if prefix == "patrocinador-" and item:
        dedicated = item.get("dedicatedPage")
        if dedicated:
            name = str(dedicated).lstrip("/")
            return f"/{name}"
    return f"/{prefix}{sid}.html"


def apply_seo(
    template: str,
    *,
    title: str,
    description: str,
    canonical_path: str,
    image_path: str,
    og_type: str = "article",
    author: str | None = None,
    json_ld: dict | None = None,
) -> str:
    desc = truncate(description or title)
    if canonical_path.startswith("http"):
        canonical = canonical_path
    else:
        canonical = ORIGIN + (
            canonical_path if canonical_path.startswith("/") else "/" + canonical_path
        )
    image = absolute_url(image_path)

    esc_title = html.escape(title, quote=True)
    esc_desc = html.escape(desc, quote=True)
    esc_canonical = html.escape(canonical, quote=True)
    esc_image = html.escape(image, quote=True)
    esc_og_type = html.escape(og_type, quote=True)

    out = re.sub(r"<title>.*?</title>", f"<title>{esc_title}</title>", template, count=1, flags=re.DOTALL)
    out = re.sub(
        r'(<meta\s+name="description"\s+content=")[^"]*(")',
        rf"\1{esc_desc}\2",
        out,
        count=1,
    )
    out = re.sub(
        r'(<link\s+rel="canonical"\s+href=")[^"]*(")',
        rf"\1{esc_canonical}\2",
        out,
        count=1,
    )
    out = re.sub(
        r'(<meta\s+property="og:type"\s+content=")[^"]*(")',
        rf"\1{esc_og_type}\2",
        out,
        count=1,
    )
    # Plantillas con noindex; las páginas generadas sí deben indexarse
    out = re.sub(
        r'<meta\s+name="robots"\s+content="noindex,\s*nofollow"\s*/?>',
        '<meta name="robots" content="index, follow">',
        out,
        count=1,
        flags=re.IGNORECASE,
    )

    for key in (
        "og:title",
        "og:description",
        "og:url",
        "og:image",
        "twitter:title",
        "twitter:description",
        "twitter:image",
    ):
        pat = rf'\s*<meta\s+(?:property|name)="{re.escape(key)}"\s+content="[^"]*"\s*/>\s*\n?'
        out = re.sub(pat, "", out, flags=re.IGNORECASE)

    author_tags = ""
    if author:
        esc_author = html.escape(author, quote=True)
        author_tags = (
            f'    <meta name="author" content="{esc_author}">\n'
            f'    <meta property="article:author" content="{esc_author}">\n'
        )

    social = (
        f'    <meta property="og:title" content="{esc_title}">\n'
        f'    <meta property="og:description" content="{esc_desc}">\n'
        f'    <meta property="og:url" content="{esc_canonical}">\n'
        f'    <meta property="og:image" content="{esc_image}">\n'
        f'    <meta name="twitter:title" content="{esc_title}">\n'
        f'    <meta name="twitter:description" content="{esc_desc}">\n'
        f'    <meta name="twitter:image" content="{esc_image}">\n'
        + author_tags
    )
    out = re.sub(
        r'(<meta\s+name="twitter:card"\s+content="summary_large_image">)',
        social + r"\1",
        out,
        count=1,
    )

    if json_ld:
        ld_json = json.dumps(json_ld, ensure_ascii=False)
        ld_block = f'    <script type="application/ld+json">{ld_json}</script>\n'
        out = re.sub(r"(</head>)", ld_block + r"\1", out, count=1)

    return out


def inject_route_id(template: str, slug: str) -> str:
    snippet = f"\n<script>window.__MML_ROUTE_ID__={json.dumps(slug)};</script>\n"
    marker = "<body>"
    if marker not in template:
        raise ValueError("Plantilla sin <body>")
    return template.replace(marker, marker + snippet, 1)


def remove_stale_generated() -> None:
    for prefix in PREFIXES:
        for path in ROOT.glob(f"{prefix}*.html"):
            path.unlink()


def write_page(
    template: str,
    slug: str,
    prefix: str,
    *,
    title: str,
    description: str,
    image_path: str,
    og_type: str = "article",
    item: dict | None = None,
    author: str | None = None,
    json_ld: dict | None = None,
) -> Path:
    sid = safe_id(slug)
    out_path = ROOT / f"{prefix}{sid}.html"
    canonical = canonical_path_for(prefix, sid, item)
    html_out = inject_route_id(template, sid)
    html_out = apply_seo(
        html_out,
        title=title,
        description=description,
        canonical_path=canonical,
        image_path=image_path,
        og_type=og_type,
        author=author,
        json_ld=json_ld,
    )
    out_path.write_text(html_out, encoding="utf-8")
    return out_path


def article_json_ld(post: dict, canonical_path: str) -> dict:
    image = absolute_url(post.get("imagen") or "assets/img/hero/blog.webp")
    author_name = post.get("autor") or "MotoMaqLab UC3M"
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.get("titulo", ""),
        "description": post.get("extracto") or "",
        "image": image,
        "datePublished": post.get("fecha", ""),
        "author": {"@type": "Person", "name": author_name},
        "publisher": {
            "@type": "Organization",
            "name": "MotoMaqLab UC3M",
            "logo": {
                "@type": "ImageObject",
                "url": f"{ORIGIN}/assets/img/logos_uc3m/uc3m_logo_sin_fondo.webp",
            },
        },
        "mainEntityOfPage": {"@type": "WebPage", "@id": ORIGIN + canonical_path},
    }


def main() -> None:
    remove_stale_generated()

    tpl_evento = (ROOT / "evento.html").read_text(encoding="utf-8")
    tpl_noticia = (ROOT / "noticia.html").read_text(encoding="utf-8")
    tpl_news = (ROOT / "news.html").read_text(encoding="utf-8")
    tpl_pat = (ROOT / "patrocinador.html").read_text(encoding="utf-8")

    written: list[str] = []

    evt = read_json("assets/data/eventos.json")
    for evento in evt.get("eventos") or []:
        eid = evento.get("id")
        if not eid:
            continue
        write_page(
            tpl_evento,
            str(eid),
            "evento-",
            title=f"{evento.get('titulo', 'Evento')} | MotoMaqLab UC3M",
            description=evento.get("descripcion") or "",
            image_path=evento.get("imagen") or "assets/img/hero/eventos.webp",
            og_type="website",
            item=evento,
        )
        written.append(f"evento-{safe_id(str(eid))}.html")

    blog = read_json("assets/data/blog.json")
    for post in blog.get("posts") or []:
        pid = post.get("id")
        if not pid:
            continue
        cat = str(post.get("categoria", "")).strip().lower()
        if cat == "newsletter":
            continue
        canonical = canonical_path_for("noticia-", str(pid), post)
        write_page(
            tpl_noticia,
            str(pid),
            "noticia-",
            title=f"{post.get('titulo', 'Noticia')} | MotoMaqLab UC3M",
            description=post.get("extracto") or "",
            image_path=post.get("imagen") or "assets/img/hero/blog.webp",
            og_type="article",
            item=post,
            author=post.get("autor") or None,
            json_ld=article_json_ld(post, canonical),
        )
        written.append(f"noticia-{safe_id(str(pid))}.html")

    blog_en = read_json("assets/data/blog-en.json")
    for post in blog_en.get("posts") or []:
        pid = post.get("id")
        if not pid:
            continue
        cat = str(post.get("categoria", "")).strip().lower()
        if cat == "newsletter":
            continue
        canonical = canonical_path_for("news-", str(pid), post)
        write_page(
            tpl_news,
            str(pid),
            "news-",
            title=f"{post.get('titulo', 'News')} | MotoMaqLab UC3M",
            description=post.get("extracto") or "",
            image_path=post.get("imagen") or "assets/img/hero/blog.webp",
            og_type="article",
            item=post,
            author=post.get("autor") or None,
            json_ld=article_json_ld(post, canonical),
        )
        written.append(f"news-{safe_id(str(pid))}.html")

    pat = read_json("assets/data/patrocinadores.json")
    seen: set[str] = set()
    for tier in pat.get("tiers") or []:
        tier_name = tier.get("name") or ""
        for sponsor in tier.get("sponsors") or []:
            sid = sponsor.get("id")
            if not sid or sid in seen:
                continue
            if sponsor.get("dedicatedPage"):
                seen.add(sid)
                # Use SEO-optimized title/description when available
                seo_title = sponsor.get("seoTitle") or f"{sponsor.get('name', 'Patrocinador')} — Patrocinador {tier_name} | MotoMaqLab UC3M"
                seo_desc = sponsor.get("seoDescription") or sponsor.get("description") or ""
                write_page(
                    tpl_pat,
                    str(sid),
                    "patrocinador-",
                    title=seo_title,
                    description=seo_desc,
                    image_path=sponsor.get("logo") or "assets/img/hero/patrocinadores.webp",
                    og_type="article",
                    item=sponsor,
                )
                written.append(f"patrocinador-{safe_id(str(sid))}.html")

    print(f"[OK] generate_detail_pages: {len(written)} archivos")
    for w in sorted(written):
        print(f"   + {w}")


if __name__ == "__main__":
    main()
