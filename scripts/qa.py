"""QA automatizado da apresentação (site).

Uso: python scripts/qa.py [--out qa/current]

Requer playwright (Chromium instalado). Opcionalmente usa opencv-python-headless
para decodificar os QR Codes renderizados. Serve site em loopback, percorre
todos os slides em vários viewports e grava um relatório JSON com as falhas.
"""

from __future__ import annotations

import argparse
import contextlib
import functools
import http.server
import json
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
VIEWPORTS = [
    (1920, 1080), (2560, 1440), (1366, 768), (1280, 800), (1024, 768),
    (768, 1024), (390, 844), (844, 390), (360, 740),
]
QR_EXPECTED = {
    "pycodebr": "https://www.instagram.com/pycodebr/",
    "acompanhe": "https://pycodebr.com.br/python-brasil-2026",
    "materiais": "https://github.com/pycodebr/pycodebr_python_brasil_2026",
}
OFFICIAL = "https://pycodebr.com.br/python-brasil-2026/"
DOWNLOADS = [
    "downloads/agentes-autonomos-hermes-python-brasil-2026.pdf",
    "downloads/agentes-autonomos-hermes-python-brasil-2026.pptx",
]
CHECK_JS = """
() => {
  const slide = document.querySelector('.slide.active');
  const reading = document.body.classList.contains('reading');
  const problems = [];
  const sr = slide.getBoundingClientRect();
  if (reading && document.documentElement.scrollWidth > innerWidth + 1) problems.push('overflow-x:' + document.documentElement.scrollWidth);
  slide.querySelectorAll('img').forEach(img => { if (!img.complete || !img.naturalWidth) problems.push('img:' + img.getAttribute('src')); });
  if (!reading) {
    const tol = 2;
    slide.querySelectorAll('h1,h2,h3,p,li,b,span,button,a,strong,code').forEach(el => {
      if (el.closest('.ghost,.marquee,.layer,.year-giant,.wires,[aria-hidden="true"]')) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || +style.opacity === 0) return;
      if (r.left < sr.left - tol || r.right > sr.right + tol || r.top < sr.top - tol || r.bottom > sr.bottom + tol) problems.push('out:' + el.tagName + ':' + (el.textContent || '').trim().slice(0, 40));
    });
  }
  return { id: slide.dataset.id, reading, problems };
}
"""


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):  # silencia o servidor
        return


@contextlib.contextmanager
def serve(directory: Path):
    handler = functools.partial(QuietHandler, directory=str(directory))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{httpd.server_address[1]}/"
        finally:
            httpd.shutdown()


def decode_qr(png: bytes) -> list[str]:
    try:
        import cv2
        import numpy as np
    except ImportError:
        return ["opencv indisponível"]
    img = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_COLOR)
    detector = cv2.QRCodeDetector()
    ok, decoded, _, _ = detector.detectAndDecodeMulti(img)
    return [d for d in decoded if d] if ok else []


def run(out: Path, engine: str = "chromium", viewports: list[tuple[int, int]] | None = None) -> int:
    report: dict = {"viewports": {}, "errors": [], "interactions": {}, "qr": {}}
    failures = 0
    with serve(SITE) as base, sync_playwright() as p:
        browser = getattr(p, engine).launch()
        for w, h in viewports or VIEWPORTS:
            ctx = browser.new_context(viewport={"width": w, "height": h})
            page = ctx.new_page()
            errors: list[str] = []
            page.on("pageerror", lambda e, errors=errors: errors.append(str(e)))
            page.on("console", lambda m, errors=errors: errors.append(m.text) if m.type == "error" else None)
            page.goto(base + "?still#1")
            page.wait_for_function("document.documentElement.dataset.ready === 'true'")
            count = page.evaluate("presentation.count")
            results = []
            for i in range(count):
                page.evaluate(f"presentation.show({i})")
                page.wait_for_timeout(250)
                res = page.evaluate(CHECK_JS)
                if res["problems"]:
                    failures += 1
                results.append(res)
            report["viewports"][f"{w}x{h}"] = {"count": count, "results": [r for r in results if r["problems"]], "errors": errors}
            failures += len(errors)
            ctx.close()

        ctx = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = ctx.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(base + "#1")
        page.wait_for_function("document.documentElement.dataset.ready === 'true'")
        checks = {}
        page.keyboard.press("ArrowRight"); page.wait_for_timeout(700)
        checks["arrow_right"] = page.evaluate("presentation.current") == 1
        page.keyboard.press("End"); page.wait_for_timeout(700)
        checks["end"] = page.evaluate("presentation.current") == page.evaluate("presentation.count") - 1
        page.keyboard.press("Home"); page.wait_for_timeout(700)
        checks["home"] = page.evaluate("presentation.current") == 0
        page.goto(base + "#cortes-video"); page.wait_for_timeout(900)
        checks["hash_id"] = page.evaluate("document.querySelector('.slide.active').dataset.id") == "cortes-video"
        checks["video_playing"] = page.evaluate("!document.querySelector('video.reel').paused")
        page.goto(base + "#workflow"); page.wait_for_timeout(900)
        page.click('.wf-step[data-step="3"]'); page.wait_for_timeout(600)
        checks["workflow_click"] = page.evaluate("document.querySelector('[data-step-title]').textContent.includes('Sprint')")
        page.keyboard.press("ArrowRight"); page.wait_for_timeout(700)
        checks["keys_after_click"] = page.evaluate("document.querySelector('.slide.active').dataset.id") == "harness"
        page.goto(base + "#arquitetura-operacao"); page.wait_for_timeout(900)
        page.click('[data-focus="context"]'); page.wait_for_timeout(400)
        checks["architecture_focus"] = page.evaluate("document.querySelector('.s-arch').dataset.focus") == "context"
        page.goto(base + "#aprovacao"); page.wait_for_timeout(900)
        page.click('[data-reset-approval]'); page.wait_for_timeout(200)
        page.click('[data-approve]'); page.wait_for_timeout(200)
        page.click('[data-merge]'); page.wait_for_timeout(3600)
        checks["approval_flow"] = "concluído" in page.evaluate("document.querySelector('[data-approval-state]').textContent")
        page.goto(base + "#monitoria"); page.wait_for_timeout(900)
        page.click('[data-signal="errors"]'); page.wait_for_timeout(400)
        checks["monitoring_tab"] = page.evaluate("document.querySelector('[data-sig-title]').textContent") == "Erros após uma mudança"
        page.goto(base + "#memoria"); page.wait_for_timeout(900)
        page.click('[data-phase="reuse"]'); page.wait_for_timeout(800)
        checks["memory_phase"] = page.evaluate("document.querySelector('[data-phase=reuse]').getAttribute('aria-pressed')") == "true"
        page.keyboard.press("m"); page.wait_for_timeout(300)
        checks["motion_toggle"] = page.evaluate("document.body.classList.contains('motion-off')")
        page.keyboard.press("m"); page.wait_for_timeout(300)
        page.keyboard.press("o"); page.wait_for_timeout(300)
        checks["overview_opens"] = page.evaluate("document.querySelector('#overview').open")
        page.keyboard.press("Escape")
        report["interactions"] = checks
        failures += sum(1 for v in checks.values() if not v)
        failures += len(errors)
        report["errors"] = errors

        for slide_id, expected in QR_EXPECTED.items():
            page.goto(base + "?still#" + slide_id)
            page.wait_for_timeout(900)
            png = page.screenshot()
            decoded = decode_qr(png)
            ok = expected in decoded
            report["qr"][slide_id] = {"expected": expected, "decoded": decoded, "ok": ok}
            failures += 0 if ok else 1

        page.goto(base + "#1")
        page.wait_for_function("document.documentElement.dataset.ready === 'true'")
        meta = page.evaluate("""() => ({
          canonical: document.querySelector('link[rel=canonical]')?.href,
          og: document.querySelector('meta[property="og:url"]')?.content,
          robots: document.querySelector('meta[name=robots]')?.content || '',
          downloads: [...document.querySelectorAll('#menu a[download]')].map(a => a.getAttribute('href'))
        })""")
        contract = {
            "canonical_official": meta["canonical"] == OFFICIAL and meta["og"] == OFFICIAL,
            "indexable": "noindex" not in meta["robots"],
            "downloads_linked": sorted(h.split("?")[0] for h in meta["downloads"]) == sorted(DOWNLOADS),
        }
        for href in meta["downloads"]:
            response = page.request.get(base + href)
            contract["download_" + href.split("?")[0].rsplit(".", 1)[-1]] = response.ok and len(response.body()) > 100_000
        report["publication"] = contract
        failures += sum(1 for v in contract.values() if not v)
        browser.close()
    out.mkdir(parents=True, exist_ok=True)
    (out / f"qa-{engine}.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"failures": failures, "publication": report.get("publication"), "interactions": report["interactions"], "qr": {k: v["ok"] for k, v in report["qr"].items()}}, ensure_ascii=False))
    for vp, data in report["viewports"].items():
        if data["results"] or data["errors"]:
            print(vp, json.dumps(data["results"][:6], ensure_ascii=False)[:1200], data["errors"][:3])
    return 1 if failures else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=str(ROOT / "qa" / "current"))
    parser.add_argument("--engine", choices=["chromium", "firefox", "webkit"], default="chromium")
    parser.add_argument("--viewports", default="", help="Lista como 1920x1080,390x844")
    args = parser.parse_args()
    chosen = [tuple(int(v) for v in item.split("x")) for item in args.viewports.split(",") if item]
    sys.exit(run(Path(args.out), args.engine, chosen or None))
