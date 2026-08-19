#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

PATTERNS = {
    "private_key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "github_token": re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b"),
    "openai_key": re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    "google_api_key": re.compile(r"\bAIza[A-Za-z0-9_-]{25,}\b"),
    "aws_access_key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "generic_secret_assignment": re.compile(r"(?i)\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*['\"][^'\"]{12,}['\"]"),
}
IGNORE = {".git", "__pycache__", "dist"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("skill_dir", nargs="?", default=".")
    parser.add_argument("--output")
    args = parser.parse_args()
    root = Path(args.skill_dir).resolve()
    findings = []
    scanned = 0
    for path in root.rglob("*"):
        if not path.is_file() or any(part in IGNORE for part in path.parts):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except Exception:
            continue
        scanned += 1
        for name, regex in PATTERNS.items():
            for match in regex.finditer(text):
                findings.append({
                    "file": str(path.relative_to(root)).replace("\\", "/"),
                    "pattern": name,
                    "line": text.count("\n", 0, match.start()) + 1,
                })
    report = {
        "ok": not findings,
        "package_version": "3.1.1",
        "findings": findings,
        "files_scanned": scanned,
    }
    rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    print(rendered, end="")
    if args.output:
        output = Path(args.output)
        if not output.is_absolute():
            output = root / output
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered, encoding="utf-8")
    raise SystemExit(0 if report["ok"] else 2)


if __name__ == "__main__":
    main()
