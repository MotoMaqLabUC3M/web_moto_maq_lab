#!/usr/bin/env python3
"""
generate_team_html.py

Pre-renderiza las tarjetas del equipo leyendo equipo.json / equipo-en.json
e inyectando el HTML estático dentro de equipo.html y team.html.

Esto garantiza que Google indexe todas las fotos de los miembros sin
depender del renderizado JavaScript del lado del cliente.

El script usa marcadores HTML para delimitar la zona inyectada:
    <!-- TEAM_START -->  ...contenido...  <!-- TEAM_END -->

Si los marcadores no existen (primera ejecución), los crea dentro de
<div id="team-sections">. En ejecuciones posteriores, reemplaza solo
el contenido entre los marcadores (idempotente).

El JS del cliente (equipo.js) detecta que el contenido ya existe
y no hace nada.

Uso (desde la raíz del repo):
    py scripts/generate_team_html.py
"""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

MARKER_START = "<!-- TEAM_START -->"
MARKER_END = "<!-- TEAM_END -->"


def read_json(rel_path: str) -> dict:
    with open(ROOT / rel_path, "r", encoding="utf-8") as f:
        return json.load(f)


def esc(text: str) -> str:
    """Escapa HTML en atributos y contenido."""
    return html.escape(str(text or ""), quote=True)


def build_member_card(member: dict, index: int) -> str:
    """Genera el HTML de una tarjeta de miembro."""
    name = esc(member.get("name", ""))
    role = esc(member.get("role", ""))
    image = esc(member.get("image", ""))
    is_placeholder = member.get("isPlaceholder", False)

    placeholder_attr = ' class="placeholder-img"' if is_placeholder else ""
    # First member of each section loads eagerly for better SEO
    loading = "eager" if index == 0 else "lazy"

    return (
        f'            <div class="team-member-card">\n'
        f'                <img src="{image}" '
        f'alt="Foto de {name}, {role} en MOTO-MAQLAB-UC3M"'
        f'{placeholder_attr} loading="{loading}" decoding="async" '
        f'width="250" height="350" />\n'
        f"                <h3>{name}</h3>\n"
        f"                <p>{role}</p>\n"
        f"            </div>"
    )


def build_section(section: dict) -> str:
    """Genera el HTML de una sección del equipo."""
    title = esc(section.get("title", ""))
    members = section.get("members", [])
    cards = "\n".join(
        build_member_card(m, i) for i, m in enumerate(members)
    )
    return (
        f'        <section class="section-container">\n'
        f'            <div class="section-title">\n'
        f"                <h2>{title}</h2>\n"
        f"            </div>\n"
        f'            <div class="team-row">\n'
        f"{cards}\n"
        f"            </div>\n"
        f"        </section>"
    )


def build_all_sections(json_path: str) -> str:
    """Lee el JSON y genera todo el HTML de las secciones."""
    data = read_json(json_path)
    sections = data.get("sections", [])
    return "\n".join(build_section(s) for s in sections)


def inject_into_html(html_file: str, team_html: str) -> None:
    """Inyecta el HTML del equipo de forma idempotente usando marcadores."""
    path = ROOT / html_file
    content = path.read_text(encoding="utf-8")

    wrapped = f"{MARKER_START}\n{team_html}\n        {MARKER_END}"

    if MARKER_START in content:
        # Ya tiene marcadores → reemplazar contenido entre ellos
        pattern = re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END)
        new_content = re.sub(pattern, wrapped, content, count=1, flags=re.DOTALL)
    else:
        # Primera ejecución → insertar marcadores dentro de <div id="team-sections">
        target = '<div id="team-sections">'
        if target not in content:
            print(f"   [WARN] No se encontró el marcador en {html_file}")
            return
        new_content = content.replace(
            target,
            f"{target}\n        {wrapped}\n        ",
            1,
        )

    path.write_text(new_content, encoding="utf-8")
    print(f"   + {html_file}")


def main() -> None:
    # Español: equipo.json → equipo.html
    es_html = build_all_sections("assets/data/equipo.json")
    inject_into_html("equipo.html", es_html)

    # Inglés: equipo-en.json → team.html
    en_html = build_all_sections("assets/data/equipo-en.json")
    inject_into_html("team.html", en_html)

    print("[OK] generate_team_html: HTML del equipo inyectado")


if __name__ == "__main__":
    main()
