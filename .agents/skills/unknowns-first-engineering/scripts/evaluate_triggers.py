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

EVALUATOR_VERSION = "3.1.1"


def unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def norm(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\wÀ-ɏḀ-ỿ]+", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


def phrase(text: str, value: str) -> bool:
    normalized_text, normalized_value = norm(text), norm(value)
    if not normalized_value:
        return False
    if " " in normalized_value or any(ord(char) > 127 for char in normalized_value):
        return normalized_value in normalized_text
    return f" {normalized_value} " in f" {normalized_text} "


def description(root: Path) -> str:
    text = (root / "SKILL.md").read_text(encoding="utf-8")
    if yaml and text.startswith("---\n"):
        end = text.find("\n---\n", 4)
        if end != -1:
            data = yaml.safe_load(text[4:end]) or {}
            return str(data.get("description", ""))
    match = re.search(r"^description:\s*>?-?\s*(.*?)(?=^\w[\w-]*:|^---$)", text, re.M | re.S)
    return match.group(1).strip() if match else text


def hits(text: str, concepts: dict[str, list[str]]) -> set[str]:
    return {name for name, values in concepts.items() if any(phrase(text, value) for value in values)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("skill_dir", nargs="?", default=".")
    parser.add_argument("--cases", default="evals/trigger_cases.json")
    parser.add_argument("--output")
    args = parser.parse_args()
    root = Path(args.skill_dir).resolve()
    cases_path = Path(args.cases)
    if not cases_path.is_absolute():
        cases_path = root / cases_path
    cases = json.loads(cases_path.read_text(encoding="utf-8"), object_pairs_hook=unique_object)
    concepts = cases["positive_concepts"]
    description_hits = hits(description(root), concepts)
    required = set(cases.get("description_required_concepts", []))
    threshold = float(cases.get("recommended_threshold", 0.4))
    negatives = cases.get("negative_patterns", [])
    denominator = max(3, min(5, len(description_hits) or len(concepts)))
    results: dict[str, list[dict[str, Any]]] = {}
    failures: list[dict[str, Any]] = []
    case_ids: set[str] = set()
    duplicate_ids: list[str] = []
    total = passed = false_positive = false_negative = 0

    for bucket in ("should_trigger", "should_not_trigger", "near_neighbor"):
        expected = bucket == "should_trigger"
        output = []
        for item in cases.get(bucket, []):
            text = item["text"] if isinstance(item, dict) else str(item)
            family = item.get("family", "default") if isinstance(item, dict) else "default"
            case_id = item.get("id") if isinstance(item, dict) else None
            if not case_id or case_id in case_ids:
                duplicate_ids.append(str(case_id))
            else:
                case_ids.add(case_id)
            matched = sorted(hits(text, concepts) & description_hits)
            negative = next((value for value in negatives if phrase(text, value)), None)
            score = min(1.0, len(matched) / denominator)
            predicted = score >= threshold and negative is None
            ok = predicted == expected
            record = {
                "id": case_id,
                "prompt": text,
                "family": family,
                "expected_trigger": expected,
                "predicted_trigger": predicted,
                "passed": ok,
                "score": round(score, 3),
                "matched_concepts": matched,
                "negative_pattern": negative,
            }
            output.append(record)
            total += 1
            if ok:
                passed += 1
            else:
                if expected:
                    false_negative += 1
                else:
                    false_positive += 1
                failures.append({"bucket": bucket, **record})
        results[bucket] = output

    missing = sorted(required - description_hits)
    report = {
        "ok": not failures and not missing and not duplicate_ids,
        "package_version": "3.1.1",
        "evaluator_version": EVALUATOR_VERSION,
        "fixture_schema_version": cases.get("schema_version"),
        "threshold": threshold,
        "description_concepts": sorted(description_hits),
        "missing_description_concepts": missing,
        "duplicate_or_missing_case_ids": duplicate_ids,
        "summary": {
            "total": total,
            "passed": passed,
            "false_positive": false_positive,
            "false_negative": false_negative,
            "pass_rate": round(passed / total, 3) if total else 0,
        },
        "failures": failures,
        "results": results,
        "claim_boundary": "Deterministic fixture conformance only; not host routing or output-quality evidence.",
    }
    rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    print(rendered, end="")
    if args.output:
        output_path = Path(args.output)
        if not output_path.is_absolute():
            output_path = root / output_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered, encoding="utf-8")
    raise SystemExit(0 if report["ok"] else 2)


if __name__ == "__main__":
    main()
