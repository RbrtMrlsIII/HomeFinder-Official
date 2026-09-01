#!/usr/bin/env python3
"""HomeFinder E5 canonical build-provenance helper.

Records provenance without moving or rewriting HomeFinder's existing source/artifact ownership.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

STATUSES = {"GENERATED", "BUILD_VERIFIED", "DEPLOYMENT_READY", "RUNTIME_VALIDATED", "ENDORSED", "FAILED", "BLOCKED"}
ENDORSEMENT_STATES = {"PENDING", "ENDORSED", "REJECTED", "DEFERRED", "NOT_APPLICABLE"}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build-id", required=True)
    parser.add_argument("--source-commit", required=True)
    parser.add_argument("--branch", required=True)
    parser.add_argument("--gate", required=True)
    parser.add_argument("--status", required=True, choices=sorted(STATUSES))
    parser.add_argument("--artifact", action="append", default=[])
    parser.add_argument("--input", action="append", default=[])
    parser.add_argument("--tooling", action="append", default=[])
    parser.add_argument("--result", default="")
    parser.add_argument("--validation", action="append", default=[])
    parser.add_argument("--deployment-reference", default=None)
    parser.add_argument("--endorsement-state", default="PENDING", choices=sorted(ENDORSEMENT_STATES))
    parser.add_argument("--registry", default="builds.json")
    args = parser.parse_args()

    artifacts = []
    for raw in args.artifact:
        p = Path(raw)
        item = {"path": raw}
        if p.is_file():
            item["sha256"] = sha256_file(p)
            item["bytes"] = p.stat().st_size
        else:
            item["availability"] = "NOT_PRESENT_AT_RECORDING"
        artifacts.append(item)

    record = {
        "build_id": args.build_id,
        "timestamp_utc": utc_now(),
        "source_commit": args.source_commit,
        "branch": args.branch,
        "gate": args.gate,
        "source_inputs": args.input,
        "tooling": args.tooling,
        "artifact_paths": artifacts,
        "result": args.result,
        "validation_evidence": args.validation,
        "deployment_reference": args.deployment_reference,
        "status": args.status,
        "endorsement_state": args.endorsement_state,
    }

    registry = Path(args.registry)
    data = json.loads(registry.read_text(encoding="utf-8")) if registry.exists() else {
        "schema": "HOMEFINDER-BUILD-PROVENANCE-1.0",
        "updated": utc_now(),
        "status_vocabulary": sorted(STATUSES),
        "endorsement_vocabulary": sorted(ENDORSEMENT_STATES),
        "records": [],
    }
    data.setdefault("records", []).append(record)
    data["updated"] = utc_now()
    data.setdefault("endorsement_vocabulary", sorted(ENDORSEMENT_STATES))
    registry.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(record, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
