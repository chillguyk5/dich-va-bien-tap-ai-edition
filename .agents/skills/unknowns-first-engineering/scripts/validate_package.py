#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

try:
    import yaml
except Exception:
    yaml = None

REQUIRED = [
    "SKILL.md", "README.md", "LICENSE", "manifest.json", "agents/interface.yaml",
    "evals/trigger_cases.json", "evals/output_cases.json", "scripts/validate_package.py",
    "scripts/evaluate_triggers.py", "scripts/secret_scan.py",
]
ALLOWED_FRONTMATTER = {"name", "description", "license", "allowed-tools", "metadata"}
CANONICAL_TARGETS = {"claude", "codex", "generic"}
REMOVED_PATHS = {
    "domains/api-integrations.md", "domains/data-migrations.md", "domains/deployment.md",
    "domains/docs-sites.md", "references/long-running-work.md",
}
IGNORED_PARTS = {".git", "__pycache__", "dist"}


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=_unique_object)


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def load_yaml(path: Path) -> dict[str, Any]:
    if yaml is None:
        raise ValueError("PyYAML is required for YAML validation")
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        raise ValueError(f"YAML root must be a mapping: {path}")
    return data


def frontmatter(text: str) -> dict[str, Any]:
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---\n", 4)
    if end < 0:
        return {}
    if yaml is None:
        raise ValueError("PyYAML is required for frontmatter validation")
    data = yaml.safe_load(text[4:end]) or {}
    return data if isinstance(data, dict) else {}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("skill_dir", nargs="?", default=".")
    parser.add_argument("--output")
    args = parser.parse_args()
    root = Path(args.skill_dir).resolve()
    failures: list[str] = []
    warnings: list[str] = []

    for rel in REQUIRED:
        if not (root / rel).is_file():
            failures.append(f"missing required file: {rel}")

    entries = sorted(
        p.relative_to(root) for p in root.rglob("SKILL.md")
        if not any(part in IGNORED_PARTS for part in p.parts)
    )
    if entries != [Path("SKILL.md")]:
        failures.append(f"expected one root SKILL.md; found: {[str(x) for x in entries]}")

    skill_text = ""
    skill_version = None
    if (root / "SKILL.md").is_file():
        skill_text = (root / "SKILL.md").read_text(encoding="utf-8")
        try:
            fm = frontmatter(skill_text)
        except Exception as exc:
            failures.append(f"frontmatter invalid: {exc}")
            fm = {}
        for key in ("name", "description"):
            if not fm.get(key):
                failures.append(f"missing frontmatter: {key}")
        if fm.get("name") != "unknowns-first-engineering":
            failures.append("frontmatter name must be unknowns-first-engineering")
        extra = set(fm) - ALLOWED_FRONTMATTER
        if extra:
            failures.append(f"unsupported frontmatter keys: {sorted(extra)}")
        metadata = fm.get("metadata") if isinstance(fm.get("metadata"), dict) else {}
        skill_version = metadata.get("version")
        if len(skill_text.encode("utf-8")) > 14000:
            warnings.append("SKILL.md context budget exceeds 14000 bytes")

    manifest: dict[str, Any] = {}
    if (root / "manifest.json").is_file():
        try:
            manifest = load_json(root / "manifest.json")
        except Exception as exc:
            failures.append(f"manifest invalid: {exc}")
        for key in ("name", "version", "owner", "updated_at", "status", "maturity_tier"):
            if not manifest.get(key):
                failures.append(f"manifest missing: {key}")
        version = str(manifest.get("version", ""))
        if version and not re.fullmatch(r"\d+\.\d+\.\d+", version):
            failures.append("manifest version is not semver")
        if manifest.get("name") != "unknowns-first-engineering":
            failures.append("manifest name mismatch")
        if skill_version and version != str(skill_version):
            failures.append("SKILL.md metadata version does not match manifest")
        if not isinstance(manifest.get("release_gates"), list):
            failures.append("manifest release_gates must be an array")
        if not isinstance(manifest.get("release_evidence"), dict):
            failures.append("manifest release_evidence must be an object")
        targets = set(manifest.get("target_platforms", []))
        if targets != CANONICAL_TARGETS:
            failures.append(f"manifest target_platforms must be {sorted(CANONICAL_TARGETS)}")
        for component in manifest.get("components", []):
            if not (root / component).exists():
                failures.append(f"manifest component missing: {component}")

    for path in root.rglob("*"):
        if not path.is_file() or any(part in IGNORED_PARTS for part in path.parts):
            continue
        suffix = path.suffix.lower()
        try:
            if suffix == ".json":
                load_json(path)
            elif suffix in {".yaml", ".yml"}:
                load_yaml(path)
        except Exception as exc:
            failures.append(f"invalid {path.relative_to(root)}: {exc}")

    markdown_files = list(root.rglob("*.md"))
    for path in markdown_files:
        text = path.read_text(encoding="utf-8")
        rel_text = str(path.relative_to(root)).replace("\\", "/")
        for removed in REMOVED_PATHS:
            if removed in text:
                failures.append(f"stale removed path in {rel_text}: {removed}")
        for link in re.findall(r"\]\(([^)#]+(?:\.md|\.json|\.yaml|\.yml))[^)]*\)", text):
            if link.startswith(("http://", "https://")):
                continue
            target = (path.parent / link).resolve()
            if not target.is_file():
                failures.append(f"missing linked file from {rel_text}: {link}")

    if any(p.name == "__pycache__" for p in root.rglob("__pycache__")):
        failures.append("generated __pycache__ directory present")
    if any(p.name.startswith("SKILL.") and p.name != "SKILL.md" for p in root.rglob("SKILL.*")):
        failures.append("alternate SKILL.* entrypoint/fixture present in active package")

    version = str(manifest.get("version", ""))
    for rel in ("README.md", "CHANGELOG.md", "reports/skill-ir.json"):
        path = root / rel
        if path.is_file() and version and version not in path.read_text(encoding="utf-8"):
            failures.append(f"current version {version} not found in {rel}")

    report = {
        "ok": not failures,
        "package": manifest.get("name"),
        "version": manifest.get("version"),
        "root": str(root),
        "failures": sorted(set(failures)),
        "warnings": sorted(set(warnings)),
        "skill_entrypoints": [str(item).replace("\\", "/") for item in entries],
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
