"""Visual primitives authored for the talk; no third-party logos are redrawn."""
from __future__ import annotations

import html
import json

PUBLIC_URL = "https://pycodebr.com.br/python-brasil-2026/"
REPOSITORY = "https://github.com/pycodebr/pycodebr_python_brasil_2026"
DOCS = "https://hermes-agent.nousresearch.com/docs/"
DURATIONS = [30, 30, 60, 30, 240, 120, 180, 150, 180, 120, 240, 180, 180, 180, 150, 150, 120, 360]
ICONS = {
    "arrow": '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    "back": '<path d="M20 12H4m6-6-6 6 6 6"/>',
    "code": '<path d="m8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18"/>',
    "file": '<path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h8"/>',
    "folder": '<path d="M2 7V4h7l3 3h10v14H2z"/>',
    "check": '<path d="m4 12 5 5L20 5"/>',
    "test": '<path d="M8 2h8M10 2v8L4 20q0 2 2 2h12q2 0 2-2l-6-10V2M8 15h8"/>',
    "loop": '<path d="M20 8A9 9 0 0 0 4 6L2 8m0-5v5h5M4 16a9 9 0 0 0 16 2l2-2m0 5v-5h-5"/>',
    "stack": '<path d="m2 7 10-5 10 5-10 5zm0 5 10 5 10-5M2 17l10 5 10-5"/>',
    "brain": '<path d="M12 4c-4-5-11 0-8 5-5 5 0 12 5 10 1 4 5 3 6 0 6 1 9-6 5-10 2-5-4-9-8-5Zm0 0v15M5 10l4 2m10-2-4 3"/>',
    "monitor": '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v5m-6 0h12M5 12l4-4 4 3 6-5"/>',
    "message": '<path d="M3 3h18v14H9l-6 4zM7 7h10M7 11h7"/>',
    "server": '<rect x="3" y="2" width="18" height="9" rx="2"/><rect x="3" y="13" width="18" height="9" rx="2"/><path d="M6 6h1m3 0h8M6 17h1m3 0h8"/>',
    "pull": '<circle cx="6" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/><path d="M6 6v12M18 18V9q0-5-5-5h-2m3-3-3 3 3 3"/>',
    "merge": '<circle cx="6" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="4" r="2"/><path d="M6 6v12M18 6v3q0 5-5 5H6"/>',
    "shield": '<path d="m12 2 9 4v7q0 6-9 9-9-3-9-9V6zM7 12l3 3 7-7"/>',
    "deploy": '<path d="M3 17v5h18v-5M12 17V2m-6 6 6-6 6 6"/>',
    "book": '<path d="M12 5C8 2 4 2 2 3v17c4-1 7-1 10 2 3-3 6-3 10-2V3c-2-1-6-1-10 2Zm0 0v17"/>',
    "link": '<path d="m9 15 6-6M8 17l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2-1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 0)"/>',
}


def icon(name: str, cls: str = "icon") -> str:
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>'


def image(file: str, name: str, cls: str = "logo") -> str:
    return f'<img class="{cls}" src="assets/{html.escape(file)}" alt="{html.escape(name, quote=True)}" loading="eager">'


def head(title: str, lead: str = "") -> str:
    return f'<header class="slide-head"><h2>{title}</h2>' + (f'<p class="lead">{lead}</p>' if lead else '') + '</header>'


def pills(values: list[str]) -> str:
    return '<div class="pills">' + ''.join(f'<span class="pill">{html.escape(value)}</span>' for value in values) + '</div>'


def slide(number: int, slug: str, title: str, chapter: str, theme: str, body: str, summary: str, sources: list[str] | None = None, layout: str = "", scene: str = "") -> dict:
    return {"id": slug, "number": number, "title": title, "chapter": chapter, "theme": theme, "body": body, "summary": summary, "sources": sources or [], "layout": layout, "scene": scene, "seconds": DURATIONS[number - 1]}


def orbit() -> str:
    return '<div class="orbit" aria-hidden="true"><svg viewBox="0 0 760 740"><circle cx="380" cy="370" r="305"/><circle cx="380" cy="370" r="245" stroke-dasharray="5 13"/><g class="orbital-spin"><ellipse cx="380" cy="370" rx="350" ry="170" transform="rotate(35 380 370)"/><circle cx="644" cy="179" r="7" fill="#ffd343"/><circle cx="118" cy="565" r="5" fill="#e8f4ba"/></g></svg><div class="orbit-core">' + image('hermes-logo-dark.png', '', '') + '</div>' + ''.join('<div class="orbit-tech t' + str(i + 1) + '">' + image(file, '', '') + '</div>' for i, file in enumerate(['python-icon.svg', 'mcp-logo-dark.svg', 'langflow-icon.svg', 'n8n-icon.svg'])) + '</div>'


def network(inner: str, edges: list[list[str]], cls: str = "") -> str:
    return f'<div class="network" data-edges="{html.escape(json.dumps(edges), quote=True)}"><svg class="connections" aria-hidden="true"></svg><div class="network-content {cls}">{inner}</div></div>'


def network_node(identifier: str, title: str, body: str, file: str | None = None, cls: str = "") -> str:
    top = (image(file, title) if file else '') + f'<h3>{title}</h3>'
    return f'<div class="network-node {cls}" data-node-id="{identifier}"><div class="node-top">{top}</div><p>{body}</p></div>'


def waveform() -> str:
    heights = [35, 60, 80, 45, 93, 57, 30, 74, 100, 62, 41, 85, 65, 38, 95, 52, 70, 28, 64, 90, 38, 82]
    return '<div class="waveform" aria-hidden="true">' + ''.join(f'<i style="--h:{height}px;--d:{i * -0.08}s"></i>' for i, height in enumerate(heights)) + '</div>'


def post_stack() -> str:
    return '<div class="post-stack" aria-hidden="true"><div class="post one">' + icon('code') + '<span>Programação</span><i></i></div><div class="post two">' + icon('brain') + '<span>IA e agentes</span><i></i></div></div>'


def mini_chart() -> str:
    return '<svg class="mini-chart" viewBox="0 0 440 215" aria-label="Gráfico ilustrativo de atividade por período, sem dados da operação"><path class="grid" d="M0 40h440M0 100h440M0 160h440M0 213h440"/><path class="series" d="M5 155 55 146 105 158 155 98 205 108 255 74 305 93 355 43 405 55 435 18"/><g fill="#b9cbd6" font-family="Geist,Arial" font-size="18"><text x="7" y="24">Atividade</text><text x="360" y="202">Período</text></g></svg>'
