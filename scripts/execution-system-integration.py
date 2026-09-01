#!/usr/bin/env python3
"""HomeFinder E8 full execution-system integration verifier.

Read-only. Verifies that the E0-E8 capability chain is present, mutually
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
    "E8": ["scripts/execution-system-integration.py", "docs/execution-system/E8-FULL-INTEGRATION-2026-09-01.json"],
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
        ("E8", "E8 handover state"),
        ("E-series branch", "E-series branch boundary"),
    ]:
        if phrase not in handover:
            errors.append(f"HandOver missing {label}")

    if "[x] ☑️ E7" not in endorsement:
        errors.append("Endorsement does not show E7 endorsed")
    e8_pending = "[ ] E8 — Full execution-system integration." in endorsement
    e8_endorsed = "[x] ☑️ E8 — Full Execution-System Integration." in endorsement
    if not (e8_pending or e8_endorsed):
        errors.append("Endorsement does not record an E8 lifecycle state")

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

    e8 = load_json("docs/execution-system/E8-FULL-INTEGRATION-2026-09-01.json")
    if e8.get("status") != "EXECUTED_VALIDATED_ENDORSED":
        errors.append("E8 machine state is not endorsed")
    if e8.get("workflow_owner_count") != 1:
        errors.append("E8 reports more than one execution-system workflow owner")
    if e8.get("product_scope_touched") is not False or e8.get("p_series_touched") is not False:
        errors.append("E8 integration must not touch product/P-series scope")

    workflow = read(".github/workflows/homefinder-execution-governance.yml") if (ROOT / ".github/workflows/homefinder-execution-governance.yml").is_file() else ""
    if "permissions:\n  contents: read" not in workflow:
        errors.append("E7/E8 governance workflow does not declare contents: read")
    if "playwright" in workflow.lower() or "chromium" in workflow.lower() or "p04-spatial" in workflow.lower():
        errors.append("E-series governance workflow contains product/browser execution vocabulary")

    report = {
        "schema": "HOMEFINDER-E8-INTEGRATION-1.1",
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
