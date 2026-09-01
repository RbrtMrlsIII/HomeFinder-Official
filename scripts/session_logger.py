#!/usr/bin/env python3
"""HomeFinder session trace helper.

Creates the machine-readable session record at START, records bounded actions/files,
and closes the record explicitly. The tool is intentionally local and deterministic;
it does not infer project authority or silently update unrelated documents.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SystemExit(f"session not found: {path}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"invalid session JSON: {path}: {exc}")


def save(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(path)


def main() -> int:
    p = argparse.ArgumentParser(description="HomeFinder session trace helper")
    sub = p.add_subparsers(dest="cmd", required=True)

    start = sub.add_parser("start")
    start.add_argument("--root", default=".")
    start.add_argument("--session-id", required=True)
    start.add_argument("--milestone", required=True)
    start.add_argument("--gate", required=True)
    start.add_argument("--branch", required=True)
    start.add_argument("--next-gate", default="")

    add = sub.add_parser("add")
    add.add_argument("--file", required=True)
    add.add_argument("--action", required=True)
    add.add_argument("--impact", choices=["LOCAL", "BOUNDED", "SYSTEMIC"], required=True)
    add.add_argument("--root", default=".")

    close = sub.add_parser("close")
    close.add_argument("--root", default=".")
    close.add_argument("--result", required=True)

    verify = sub.add_parser("verify")
    verify.add_argument("--root", default=".")

    args = p.parse_args()
    root = Path(args.root).resolve()
    session_dir = root / ".agent" / "sessions"

    if args.cmd == "start":
        path = session_dir / f"session-{args.session_id}.json"
        if path.exists():
            raise SystemExit(f"refusing to overwrite existing session: {path}")
        data = {
            "session_id": args.session_id,
            "started_at": now(),
            "ended_at": None,
            "status": "OPEN",
            "milestone": args.milestone,
            "gate": args.gate,
            "branch": args.branch,
            "next_gate": args.next_gate,
            "actions": [],
            "files_changed": [],
            "validation": [],
            "complete_trace": True,
        }
        save(path, data)
        print(path)
        return 0

    matches = sorted(session_dir.glob("session-*.json"))
    if len(matches) != 1:
        raise SystemExit(f"expected exactly one open session for this simple helper; found {len(matches)}")
    path = matches[0]
    data = load(path)

    if args.cmd == "add":
        data["actions"].append({"at": now(), "action": args.action, "impact": args.impact})
        if args.file not in data["files_changed"]:
            data["files_changed"].append(args.file)
        save(path, data)
        return 0

    if args.cmd == "close":
        if data.get("status") != "OPEN":
            raise SystemExit("session is not open")
        data["ended_at"] = now()
        data["status"] = args.result
        save(path, data)
        return 0

    if args.cmd == "verify":
        problems = []
        if data.get("status") == "OPEN" and not data.get("started_at"):
            problems.append("OPEN session has no started_at")
        if data.get("status") != "OPEN" and not data.get("ended_at"):
            problems.append("closed session has no ended_at")
        if not isinstance(data.get("actions"), list):
            problems.append("actions is not a list")
        if not isinstance(data.get("files_changed"), list):
            problems.append("files_changed is not a list")
        if problems:
            for problem in problems:
                print(problem, file=sys.stderr)
            return 1
        print("PASS")
        return 0

    return 2


if __name__ == "__main__":
    raise SystemExit(main())
