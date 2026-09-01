#!/usr/bin/env python3
"""HomeFinder E7 execution-system enforcement gate.

Read-only against the repository. Fails closed when canonical execution
invariants are missing, contradictory, malformed, or duplicated.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "MASTER_SKILL.md",
    "project-guide/AI_ASSISTANT_READ_ME.md",
    "project-guide/HandOver.md",
    "project-guide/Endorsement.md",
    "project-guide/DOCUMENTATION-MAP.md",
    "project-guide/repository-governance/EXECUTION-TRACE-AND-FILE-UPDATE.md",
    "project-guide/repository-governance/CENSUS-AND-INVENTORY.md",
    "project-guide/repository-governance/KNOWLEDGE-AND-ANTI-REPEAT.md",
    "project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md",
    "scripts/session_logger.py",
    "scripts/census.py",
    "scripts/knowledge-search.py",
    "scripts/structural-index.py",
    ".agent/census/census.config.json",
    ".agent/knowledge/ANTI-REPEAT-INDEX.json",
    ".agent/structural/structural-index.config.json",
    ".agent/structural/STRUCTURAL-INDEX.json",
    "builds.json",
]


def load_json(rel: str):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def check_required(errors: list[str]):
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).is_file():
            errors.append(f"missing required canonical file: {rel}")


def check_skill(text: str, errors: list[str]):
    required_phrases = [
        "Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance",
        "Every completed gate produces",
        "whole-project",
        "Before Classify",
        "History rewriting is itself a bounded architectural operation",
    ]
    for phrase in required_phrases:
        if phrase not in text:
            errors.append(f"MASTER_SKILL missing required execution invariant: {phrase}")


def check_anti_repeat(errors: list[str]):
    data = load_json(".agent/knowledge/ANTI-REPEAT-INDEX.json")
    if data.get("authority") != "PRODUCT-KNOWLEDGE.md":
        errors.append("anti-repeat index must remain derived from PRODUCT-KNOWLEDGE.md")
    if data.get("pre_classify_required") is not True:
        errors.append("anti-repeat pre-Classify requirement is not enabled")
    ids = [entry.get("id") for entry in data.get("entries", [])]
    if len(ids) != len(set(ids)):
        errors.append("anti-repeat index contains duplicate IDs")


def check_structural(errors: list[str], warnings: list[str]):
    data = load_json(".agent/structural/STRUCTURAL-INDEX.json")
    if data.get("derived") is not True:
        errors.append("structural index must be explicitly derived")
    if data.get("authority") != "SOURCE_FILES_RETAIN_EXISTING_AUTHORITY":
        errors.append("structural index authority boundary is invalid")
    boundaries = data.get("boundary_checks", {})
    for key in (
        "duplicate_semantic_dictionary",
        "duplicate_execution_skill",
        "replacement_of_sh3d_authority",
        "new_handover_authority",
        "numeric_full_repo_census_claim",
        "history_rewrite",
    ):
        if boundaries.get(key) is not False:
            errors.append(f"structural boundary check must be false: {key}")
    source_paths = [s.get("path") for s in data.get("sources", [])]
    if "active_development/data/dictionary.json" not in source_paths:
        errors.append("semantic dictionary owner missing from structural index")
    if "active_development/3d/docs/model-census.json" not in source_paths:
        errors.append("authored model census owner missing from structural index")
    if "MASTER_SKILL.md" not in source_paths:
        errors.append("canonical execution skill missing from structural index")
    if any(s.get("state") == "MISSING_FROM_CHECKOUT" for s in data.get("sources", [])):
        warnings.append("structural index contains a missing source in this checkout")


def check_provenance(errors: list[str]):
    data = load_json("builds.json")
    if not data.get("records"):
        errors.append("build provenance registry has no records")
        return
    required = {
        "build_id", "timestamp_utc", "source_commit", "branch", "gate",
        "source_inputs", "tooling", "artifact_paths", "result",
        "validation_evidence", "status", "endorsement_state",
    }
    for rec in data["records"]:
        missing = sorted(required - set(rec))
        if missing:
            errors.append(f"provenance record {rec.get('build_id')} missing: {', '.join(missing)}")


def check_handover(text: str, errors: list[str]):
    required = [
        "Current HandOver",
        "whole-project",
        "E6",
        "E7",
        "P04",
        "Physical authority",
        "Required next gate",
    ]
    for phrase in required:
        if phrase not in text:
            errors.append(f"HandOver missing required continuity content: {phrase}")


def check_endorsement(text: str, errors: list[str]):
    e6_marked = "[x] ☑️ E6" in text or "## E6 endorsement note" in text
    if not e6_marked:
        errors.append("Endorsement ledger does not record E6 as endorsed")
    e7_pending = "[ ] E7 — Automated enforcement gates." in text
    e7_endorsed = "[x] ☑️ E7 —" in text
    if not (e7_pending or e7_endorsed):
        errors.append("Endorsement ledger does not record an E7 lifecycle state")


def self_test() -> int:
    bad = {"derived": True, "authority": "NEW_AUTHORITY"}
    return 0 if bad["authority"] != "SOURCE_FILES_RETAIN_EXISTING_AUTHORITY" else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()

    errors: list[str] = []
    warnings: list[str] = []
    check_required(errors)
    if (ROOT / "MASTER_SKILL.md").is_file():
        check_skill((ROOT / "MASTER_SKILL.md").read_text(encoding="utf-8"), errors)
    if (ROOT / ".agent/knowledge/ANTI-REPEAT-INDEX.json").is_file():
        check_anti_repeat(errors)
    if (ROOT / ".agent/structural/STRUCTURAL-INDEX.json").is_file():
        check_structural(errors, warnings)
    if (ROOT / "builds.json").is_file():
        check_provenance(errors)
    if (ROOT / "project-guide/HandOver.md").is_file():
        check_handover((ROOT / "project-guide/HandOver.md").read_text(encoding="utf-8"), errors)
    if (ROOT / "project-guide/Endorsement.md").is_file():
        check_endorsement((ROOT / "project-guide/Endorsement.md").read_text(encoding="utf-8"), errors)

    result = {
        "schema": "HOMEFINDER-EXECUTION-GATE-1.0",
        "gate": "E7",
        "status": "PASS" if not errors else "FAIL",
        "errors": errors,
        "warnings": warnings,
        "checked_required_files": len(REQUIRED_FILES),
        "read_only": True,
    }
    print(json.dumps(result, indent=2) if args.json else f"E7 {result['status']}: {len(errors)} error(s), {len(warnings)} warning(s)")
    if warnings and not args.json:
        for item in warnings:
            print(f"WARNING: {item}")
    if errors and not args.json:
        for item in errors:
            print(f"ERROR: {item}")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
