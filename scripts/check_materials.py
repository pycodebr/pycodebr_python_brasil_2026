"""Validate local material links and extract Mermaid sources for rendering."""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


def slug(text: str) -> str:
    value = re.sub(r"[`*_]", "", text).strip().lower()
    value = re.sub(r"[^\w\-\s]", "", value, flags=re.UNICODE)
    return value.replace(" ", "-")


def main() -> None:
    files = [ROOT / "README.md", ROOT / "THIRD_PARTY.md", ROOT / "exemplos/README.md", *sorted((ROOT / "materiais").glob("*.md"))]
    bad = []
    links = 0
    diagrams = []
    directory = ROOT / "materiais/diagramas"
    directory.mkdir(exist_ok=True)
    for path in files:
        text = path.read_text()
        for url in re.findall(r"!?\[[^\]]*\]\(([^)]+)\)", text):
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc:
                continue
            target = (path.parent / unquote(parsed.path)).resolve() if parsed.path else path
            links += 1
            if not target.exists():
                bad.append({"source": path.relative_to(ROOT).as_posix(), "target": url})
            elif parsed.fragment and target.suffix == ".md":
                headings = re.findall(r"^#{1,6}\s+(.+)$", target.read_text(), re.MULTILINE)
                if unquote(parsed.fragment) not in {slug(h) for h in headings}:
                    bad.append({"source": path.relative_to(ROOT).as_posix(), "anchor": url})
        for index, code in enumerate(re.findall(r"```mermaid\n(.*?)\n```", text, re.DOTALL), 1):
            filename = f"{path.stem}-{index:02d}.mmd"
            (directory / filename).write_text(code + "\n")
            diagrams.append(filename)
    report = {"markdown_files":len(files), "relative_links_checked":links, "mermaid_diagrams":diagrams, "missing":bad, "passed":not bad}
    (ROOT / "qa").mkdir(exist_ok=True)
    (ROOT / "qa/materials.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if bad:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
