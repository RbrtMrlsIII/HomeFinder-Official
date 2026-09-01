#!/usr/bin/env python3
"""HomeFinder E8 full execution-system integration verifier.

Read-only. Verifies that the E0-E7 capability chain is present, mutually
compatible, and still subordinate to the master development chronology.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

EXPECTED_FILES = {
    "E0": ["docs/execution-system/E-SERIES-RECONCILIATION-2026-09-01.md"],
    "E1": ["MASTER_SKILL.md"],
    "E2": ["scripts/session_logger.py", "project-guide/repository-governance/EXECUTION-TRACE-AND-FILE-UPDATE.md"],
    "E3": ["scripts/census.py", ".agent/census/census.config.json"],
    "E4": ["scripts/knowledge-search.py", ".agent/knowledge/ANTI-REPEAT-INDEX.json"],
    "E5": ["builds.json", "build-provenance.py", "E5-CANONICAL-BUILD-PROVENANCE.md"],
    "E6": ["scripts/structural-index.py", ".agent/structural/STRUCTURAL-INDEX.json"],
    "E7": ["scripts/execution-gate.py", ".github/workflows/homefinder-execution-governance.yml"],
}


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def load_json(rel: str):
    return json.loads(read(rel))


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    checks: list[dict] = []

    for gate, paths in EXPECTED_FILES.items():
        missing = [p for p in paths if not (ROOT / p).is_file()]
        ok = not missing
        checks.append({"gate": gate, "status": "PASS" if ok else "FAIL", "missing": missing})
        if missing:
            errors.append(f"{gate} missing integration artifact(s): {', '.join(missing)}")

    skill = read("MASTER_SKILL.md") if (ROOT / "MASTER_SKILL.md").is_file() else ""
    if "Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance" not in skill:
        errors.append("canonical execution sequence missing from MASTER_SKILL.md")

    handover = read("project-guide/HandOver.md") if (ROOT / "project-guide/HandOver.md").is_file() else ""
    endorsement = read("project-guide/Endorsement.md") if (ROOT / "project-guide/Endorsement.md").is_file() else ""
    ai = read("project-guide/AI_ASSISTANT_READ_ME.md") if (ROOT / "project-guide/AI_ASSISTANT_READ_ME.md").is_file() else ""
    masterplan = read("project-guide/masterplan.md") if (ROOT / "project-guide/masterplan.md").is_file() else ""

    for phrase, label in [
        ("whole-project", "whole-project handover contract"),
        ("E7", "E7 handover state"),
        ("E-series branch", "E-series branch boundary"),
    ]:
        if phrase not in handover:
            errors.append(f"HandOver missing {label}")

    if "[x] ☑️ E7" not in endorsement or "[ ] E8 — Full execution-system integration." not in endorsement:
        errors.append("Endorsement does not show E7 endorsed and E8 as current integration target")

    if "T02 → T03 → T04 → T05 → T06 → T07" not in masterplan:
        errors.append("masterplan chronology anchor missing")
    if "E-series" not in ai or "masterplan" not in ai:
        errors.append("AI continuity does not link E-series behavior to masterplan authority")

    anti = load_json(".agent/knowledge/ANTI-REPEAT-INDEX.json")
    if anti.get("authority") != "PRODUCT-KNOWLEDGE.md" or anti.get("pre_classify_required") is not True:
        errors.append("E4 anti-repeat boundary invalid")

    structural = load_json(".agent/structural/STRUCTURAL-INDEX.json")
    if structural.get("derived") is not True or structural.get("authority") != "SOURCE_FILES_RETAIN_EXISTING_AUTHORITY":
        errors.append("E6 structural index is not a derived authority-preserving layer")

    provenance = load_json("builds.json")
    if len(provenance.get("records", [])) < 2:
        errors.append("E5 provenance registry lacks cross-platform records")

    e7 = load_json("docs/execution-system/E7-CI-INTEGRATION-2026-09-01.json")
    if e7.get("status") != "EXECUTED_VALIDATED_ENDORSED":
        errors.append("E7 machine state is not endorsed")
    if e7.get("workflow_contract", {}).get("repository_mutation") is not False:
        errors.append("E7 workflow is not explicitly repository-read-only")

    if (ROOT / ".github/workflows/homefinder-execution-governance.yml").is_file():
        workflow = read(".github/workflows/homefinder-execution-governance.yml")
        if "permissions:\n  contents: read" not in workflow:
            errors.append("E7 workflow does not declare contents: read")
        if "playwright" in workflow.lower() or "chromium" in workflow.lower() or "p04-spatial" in workflow.lower():
            errors.append("E7 workflow contains product/browser execution vocabulary")

    report = {
        "schema": "HOMEFINDER-E8-INTEGRATION-1.0",
        "gate": "E8",
        "status": "PASS" if not errors else "FAIL",
        "errors": errors,
        "warnings": warnings,
        "checks": checks,
        "read_only": True,
        "product_scope_touched": False,
    }
    print(json.dumps(report, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
