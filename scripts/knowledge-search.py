#!/usr/bin/env python3
"""HomeFinder durable-knowledge and anti-repeat checker.

Searches the canonical PRODUCT-KNOWLEDGE.md and the derived anti-repeat index.
This tool is advisory by default: it does not authorize mutation or replace
project authority. --anti returns a non-zero result when strong anti-pattern
matches are found, allowing callers to gate Classify in automation later.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE = ROOT / "PRODUCT-KNOWLEDGE.md"
INDEX = ROOT / ".agent" / "knowledge" / "ANTI-REPEAT-INDEX.json"


def load_index() -> dict:
    try:
        return json.loads(INDEX.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"cannot load anti-repeat index: {exc}")


def terms_hit(query: str, triggers: list[str]) -> list[str]:
    q = query.casefold()
    return [t for t in triggers if t.casefold() in q]


def score(query: str, entry: dict) -> int:
    hits = len(terms_hit(query, entry.get("trigger", [])))
    if not hits:
        return 0
    return min(100, 35 * hits)


def main() -> int:
    ap = argparse.ArgumentParser(description="Search HomeFinder durable knowledge")
    ap.add_argument("query", nargs="+", help="approach, hypothesis, or proposed action")
    ap.add_argument("--anti", action="store_true", help="treat anti-pattern hits as a gate")
    ap.add_argument("--score", action="store_true", help="include match score")
    args = ap.parse_args()

    q = " ".join(args.query).strip()
    index = load_index()
    entries = index.get("entries", [])

    results = []
    for entry in entries:
        s = score(q, entry)
        if s:
            item = {
                "id": entry.get("id"),
                "kind": entry.get("kind"),
                "rule": entry.get("rule"),
                "source": entry.get("source"),
            }
            if args.score:
                item["score"] = s
            results.append(item)

    if results:
        print(json.dumps({"query": q, "matches": results}, indent=2, ensure_ascii=False))
    else:
        print(json.dumps({"query": q, "matches": []}, indent=2, ensure_ascii=False))

    if args.anti and results:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
