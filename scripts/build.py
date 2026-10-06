"""Build the static presentation from reviewed public content."""
from __future__ import annotations

import hashlib
import html
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from presentation_content import INTERACTIONS, SLIDES
from scene_helpers import PUBLIC_URL, REPOSITORY, icon

TITLE = "Agentes Autônomos de IA com Hermes Agent"
DOWNLOAD_NAME = "agentes-autonomos-hermes-python-brasil-2026"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def main() -> None:
    require(len(SLIDES) == 18, "The concise deck must have 18 scenes")
    require(len({s["id"] for s in SLIDES}) == 18, "Duplicate slide IDs")
    require(sum(s["seconds"] for s in SLIDES) == 2700, "Timing must include 40 minutes plus 5 for questions")
    require([s["id"] for s in SLIDES[:4]] == ["capa", "felipe", "pycodebr", "acompanhe"], "Opening order mismatch")
    site = ROOT / "site"
    site.mkdir(exist_ok=True)
    sections = []
    for number, slide in enumerate(SLIDES, 1):
        require(number == slide["number"], "Out-of-order scene")
        sections.append(
            f'<section id="slide-{number}" class="slide {html.escape(slide["layout"])}" '
            f'data-id="{html.escape(slide["id"])}" data-title="{html.escape(slide["title"], quote=True)}" '
            f'data-chapter="{html.escape(slide["chapter"], quote=True)}" data-theme="{slide["theme"]}" '
            f'data-scene="{slide["scene"]}" aria-label="Slide {number}: {html.escape(slide["title"], quote=True)}">'
            + slide["body"]
            + '<footer class="slide-foot"><span class="chapter-name">'
            + f'{number:02d} / {html.escape(slide["chapter"])}'
            + '</span><span class="brand"><img src="assets/pycodebr-icon-official.png" alt="PycodeBR">@pycodebr</span></footer></section>'
        )
    css_hash = hashlib.sha256((site / "assets/presentation.css").read_bytes()).hexdigest()[:12]
    js_hash = hashlib.sha256((site / "assets/presentation.js").read_bytes()).hexdigest()[:12]
    payload = json.dumps(INTERACTIONS, ensure_ascii=False).replace("</", "<\\/")
    markup = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#03090e">
<title>{TITLE} | Felipe Azambuja · Python Brasil 2026</title>
<meta name="description" content="Slides e materiais da palestra de Felipe Azambuja: Hermes Agent, memória, auto skills, workflow de IA assistida e observabilidade com agentes.">
<link rel="canonical" href="{PUBLIC_URL}"><meta property="og:title" content="{TITLE}"><meta property="og:type" content="website"><meta property="og:url" content="{PUBLIC_URL}"><meta property="og:description" content="Python Brasil 2026 · Felipe Azambuja · PycodeBR"><link rel="icon" href="assets/python-icon.svg" type="image/svg+xml">
<link rel="preload" href="assets/Geist-Latin-300.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="assets/presentation.css?v={css_hash}">
</head><body>
<main id="viewport" aria-label="Apresentação da Python Brasil"><div id="frame"><div id="deck">{''.join(sections)}</div></div></main>
<nav id="toolbar" aria-label="Controles da apresentação"><button id="previous" class="nav-arrow" aria-label="Slide anterior">{icon('back')}</button><span id="counter" aria-live="polite"></span><button id="next" class="nav-arrow" aria-label="Próximo slide">{icon('arrow')}</button><select id="jump" aria-label="Ir para o slide"></select><button id="open-overview">Índice</button><a class="desktop-only" href="{REPOSITORY}#materiais" target="_blank" rel="noopener noreferrer">Materiais</a><button id="timer" class="meter desktop-only" aria-pressed="false" title="Clique para iniciar/pausar; clique duplo zera. Conteúdo: 40 min; perguntas: 5 min.">00:00</button><button id="open-menu" aria-label="Abrir opções e downloads">Opções</button></nav><div id="progress"></div>
<dialog id="overview"><button id="close-overview" class="dialog-close">Fechar</button><h2>Escolha um slide</h2><div id="overview-list"></div></dialog>
<dialog id="menu"><button id="close-menu" class="dialog-close">Fechar</button><h2>Apresentação e materiais</h2><div class="menu-actions"><button id="fullscreen">Tela cheia</button><button id="motion" aria-pressed="true">Pausar animações</button><a href="downloads/{DOWNLOAD_NAME}.pdf?v=2" download>Baixar PDF</a><a href="downloads/{DOWNLOAD_NAME}.pptx?v=2" download>Baixar PowerPoint</a><a href="{REPOSITORY}#materiais" target="_blank" rel="noopener noreferrer">Materiais no GitHub</a></div><p>Setas e PageUp/PageDown navegam. Home abre a capa e End abre o encerramento. F alterna a tela cheia, O abre o índice e B escurece a tela. Escape restaura a tela.</p><p>Em celulares e tablets na vertical, o conteúdo se reorganiza para leitura. Role o slide para explorar a cena. Cada pessoa navega no próprio dispositivo.</p><p>PDF e PowerPoint são versões estáticas. O PowerPoint preserva o visual como imagens por slide; animações e interações ficam nesta página.</p><p>As demonstrações são locais e ilustrativas, sem acesso a ambientes ou dados de produção. Hermes Agent é um projeto da Nous Research e de sua comunidade.</p><p id="fullscreen-help" hidden>Este navegador não disponibilizou a tela cheia. Você pode usar a apresentação normalmente ou ocultar a barra do navegador pelos controles do dispositivo.</p></dialog>
<div id="blank" aria-hidden="true"></div><noscript>Ative o JavaScript para navegar ou baixe o <a href="downloads/{DOWNLOAD_NAME}.pdf">PDF</a>.</noscript>
<script id="interaction-data" type="application/json">{payload}</script><script src="assets/presentation.js?v={js_hash}"></script></body></html>
'''
    (site / "index.html").write_text(markup)
    data = {"title": TITLE, "url": PUBLIC_URL, "repository": REPOSITORY, "revision": 2, "slides": SLIDES, "interactions": INTERACTIONS}
    (ROOT / "src/content.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    manifest = [{"path": p.relative_to(site).as_posix(), "bytes": p.stat().st_size, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(site.rglob("*")) if p.is_file()]
    (ROOT / "build-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"slides": len(SLIDES), "planned_seconds": sum(s["seconds"] for s in SLIDES), "questions_seconds": 300, "site_files": len(manifest), "revision": 2}, ensure_ascii=False))


if __name__ == "__main__":
    main()
