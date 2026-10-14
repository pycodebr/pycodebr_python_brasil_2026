"""Monta site-v2/index.html a partir de src-v2/shell.html e dos slides em src-v2/slides.

Uso: python scripts/build_v2.py
Não depende de bibliotecas externas. O resultado é um site estático que roda offline.
"""

from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src-v2"
SITE = ROOT / "site-v2"
ASSET_TOKENS = {
    "H_DECK_CSS": "assets/css/deck.css",
    "H_SCENES_CSS": "assets/css/scenes.css",
    "H_FX_JS": "assets/js/fx.js",
    "H_SCENES_OPENING_JS": "assets/js/scenes-opening.js",
    "H_SCENES_TIMELINE_JS": "assets/js/scenes-timeline.js",
    "H_SCENES_OPS_JS": "assets/js/scenes-ops.js",
    "H_SCENES_DEV_JS": "assets/js/scenes-dev.js",
    "H_DECK_JS": "assets/js/deck.js",
}


def short_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


def bundle_css() -> None:
    files = sorted((SRC / "css").glob("*.css"))
    if not files:
        raise SystemExit("Nenhum CSS de cena em src-v2/css")
    header = "/* Gerado por scripts/build_v2.py a partir de src-v2/css. Edite as fontes. */\n"
    body = "\n".join(f"/* --- {f.name} --- */\n" + f.read_text(encoding="utf-8").strip() + "\n" for f in files)
    (SITE / "assets" / "css" / "scenes.css").write_text(header + body, encoding="utf-8")


def build() -> Path:
    bundle_css()
    slide_files = sorted((SRC / "slides").glob("*.html"))
    if not slide_files:
        raise SystemExit("Nenhum slide encontrado em src-v2/slides")
    ids: list[str] = []
    parts: list[str] = []
    for number, path in enumerate(slide_files, start=1):
        html = path.read_text(encoding="utf-8").strip()
        match = re.search(r'<section[^>]*\bdata-id="([^"]+)"', html)
        if not match:
            raise SystemExit(f"{path.name}: falta data-id na seção")
        slide_id = match.group(1)
        if slide_id in ids:
            raise SystemExit(f"{path.name}: data-id repetido ({slide_id})")
        ids.append(slide_id)
        html = html.replace("{{N}}", str(number), 1)
        parts.append(html)
    shell = (SRC / "shell.html").read_text(encoding="utf-8")
    for token, rel in ASSET_TOKENS.items():
        shell = shell.replace("{{" + token + "}}", short_hash(SITE / rel))
    output = shell.replace("{{SLIDES}}", "\n".join(parts))
    leftover = re.findall(r"\{\{[A-Z_]+\}\}", output)
    if leftover:
        raise SystemExit(f"Tokens não substituídos: {leftover}")
    target = SITE / "index.html"
    target.write_text(output, encoding="utf-8")
    print(f"{target.relative_to(ROOT)}: {len(ids)} slides")
    return target


if __name__ == "__main__":
    sys.exit(0 if build() else 1)
