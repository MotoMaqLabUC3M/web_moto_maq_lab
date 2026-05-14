#!/usr/bin/env python3
"""
Genera páginas estáticas sin query string (mejor para SEO y enlaces):
  evento-<id>.html, noticia-<id>.html, patrocinador-<id>.html

Cada archivo es una copia de la plantilla base con un script inline que
define window.__MML_ROUTE_ID__ antes del JS de detalle. La lógica sigue
centralizada en los mismos .js y JSON; esto solo duplica la envoltura HTML.

Uso (desde la raíz del repo):
  python3 scripts/generate_detail_pages.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PREFIXES = ("evento-", "noticia-", "patrocinador-")


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


def write_page(template: str, slug: str, prefix: str) -> Path:
    sid = safe_id(slug)
    out = ROOT / f"{prefix}{sid}.html"
    out.write_text(inject_route_id(template, sid), encoding="utf-8")
    return out


def main() -> None:
    remove_stale_generated()

    tpl_evento = (ROOT / "evento.html").read_text(encoding="utf-8")
    tpl_noticia = (ROOT / "noticia.html").read_text(encoding="utf-8")
    tpl_pat = (ROOT / "patrocinador.html").read_text(encoding="utf-8")

    written: list[str] = []

    evt = read_json("assets/data/eventos.json")
    for evento in evt.get("eventos") or []:
        eid = evento.get("id")
        if not eid:
            continue
        write_page(tpl_evento, str(eid), "evento-")
        written.append(f"evento-{safe_id(str(eid))}.html")

    blog = read_json("assets/data/blog.json")
    for post in blog.get("posts") or []:
        pid = post.get("id")
        if not pid:
            continue
        write_page(tpl_noticia, str(pid), "noticia-")
        written.append(f"noticia-{safe_id(str(pid))}.html")

    pat = read_json("assets/data/patrocinadores.json")
    seen: set[str] = set()
    for tier in pat.get("tiers") or []:
        for sponsor in tier.get("sponsors") or []:
            sid = sponsor.get("id")
            if not sid or sid in seen:
                continue
            if sponsor.get("dedicatedPage"):
                seen.add(sid)
                write_page(tpl_pat, str(sid), "patrocinador-")
                written.append(f"patrocinador-{safe_id(str(sid))}.html")

    print(f"[OK] generate_detail_pages: {len(written)} archivos")
    for w in sorted(written):
        print(f"   + {w}")


if __name__ == "__main__":
    main()
