"""Fail before publication if private paths or common token forms appear."""
from __future__ import annotations

import json
import re
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = [
    r"/(?:root|Users)/",
    r"@s\.whatsapp\.net|@g\.us",
    r"gh[pousr]_[A-Za-z0-9]{20,}",
    r"sk-[A-Za-z0-9]{25,}",
    r"AIza[0-9A-Za-z_-]{30,}",
    r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
]
EXCLUDED = {".git", ".venv", "node_modules", "__pycache__", "qa", "private", "backups", "output", ".ruff_cache"}
TEXT_SUFFIXES = {".py", ".md", ".html", ".css", ".js", ".json", ".svg", ".yaml", ".yml", ".toml"}


def main() -> None:
    files = [p for p in ROOT.rglob("*") if p.is_file() and not set(p.relative_to(ROOT).parts) & EXCLUDED]
    findings = []
    for path in files:
        if path == Path(__file__).resolve():
            continue
        if path.name.startswith(".env"):
            findings.append({"file": path.relative_to(ROOT).as_posix(), "reason": "environment file"})
        texts = [path.read_text(errors="ignore")] if path.suffix in TEXT_SUFFIXES else []
        if path.suffix == ".pptx":
            with ZipFile(path) as archive:
                texts.extend(archive.read(n).decode(errors="ignore") for n in archive.namelist() if n.endswith(".xml"))
        for text in texts:
            for pattern in PATTERNS:
                if re.search(pattern, text):
                    findings.append({"file": path.relative_to(ROOT).as_posix(), "reason": "private-data pattern", "rule": pattern})
    print(json.dumps({"files_scanned": len(files), "findings": findings}, ensure_ascii=False))
    if findings:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
