#!/usr/bin/env python3
"""HomeFinder project census.

Source-first, read-only inventory. Counts are derived from the checked-out tree and
configured JSON sources. The tool never mutates source artifacts.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_EXTENSIONS = {
    "models_3d": {".glb", ".gltf", ".obj", ".fbx", ".usd", ".usdz"},
    "textures": {".png", ".jpg", ".jpeg", ".webp", ".ktx", ".ktx2", ".hdr", ".exr"},
}


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def is_excluded(path: Path, excluded: set[str]) -> bool:
    return bool(excluded.intersection(path.parts))


def count_html(root: Path, excluded: set[str]) -> int:
    return sum(1 for p in root.rglob("*.html") if not is_excluded(p, excluded))


def count_files(root: Path, extensions: set[str], excluded: set[str]) -> int:
    return sum(
        1
        for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in extensions and not is_excluded(p, excluded)
    )


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate HomeFinder structural census")
    ap.add_argument("--base", default=".")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--config", default=".agent/census/census.config.json")
    args = ap.parse_args()

    root = Path(args.base).resolve()
    cfg = load_json(root / args.config) or {}
    excluded = set(cfg.get("exclude_dirs", [".git", "node_modules", "dist", "build"]))

    all_files = [p for p in root.rglob("*") if p.is_file() and not is_excluded(p, excluded)]
    tests = [p for p in all_files if "tests" in p.parts or p.name.startswith("test_")]
    workflows = [p for p in all_files if ".github" in p.parts and "workflows" in p.parts]
    sessions = [p for p in all_files if ".agent" in p.parts and "sessions" in p.parts and p.suffix == ".json"]
    docs = [p for p in all_files if "docs" in p.parts or p.name.endswith(".md")]
    findings_root = root / "docs" / "findings"
    findings = [p for p in findings_root.glob("*") if p.is_file()] if findings_root.exists() else []
    forbidden_patterns = cfg.get("forbidden_globs", ["*.zip", "*.save", "*patch*"])
    forbidden = []
    for pattern in forbidden_patterns:
        forbidden.extend(
            str(p.relative_to(root))
            for p in root.rglob(pattern)
            if p.is_file() and not is_excluded(p, excluded)
        )

    dictionary_path = root / cfg.get("dictionary_path", "active_development/data/dictionary.json")
    dictionary = load_json(dictionary_path) or {}
    dictionary_entries = dictionary.get("entries", []) if isinstance(dictionary, dict) else []

    census = {
        "schema": "HOMEFINDER-CENSUS-1.0",
        "generated_at": now(),
        "base": str(root),
        "source_first": True,
        "counts": {
            "repository_files": len(all_files),
            "ui_screens_html": count_html(root, excluded),
            "models_3d": count_files(root, DEFAULT_EXTENSIONS["models_3d"], excluded),
            "textures": count_files(root, DEFAULT_EXTENSIONS["textures"], excluded),
            "tests": len(tests),
            "ci_workflows": len(workflows),
            "session_traces": len(sessions),
            "documentation_files": len(docs),
            "findings_documents": len(findings),
            "dictionary_entries": len(dictionary_entries),
        },
        "authoritative_3d": "master/HomeFinder.sh3d",
        "existing_3d_census": "active_development/3d/docs/model-census.json",
        "dictionary_owner": str(dictionary_path.relative_to(root)) if dictionary_path.exists() else None,
        "forbidden_files": sorted(set(forbidden)),
        "config": str((root / args.config).relative_to(root)),
    }

    out_json = root / ".agent/census/census-latest.json"
    out_md = root / "docs/census/census-latest.md"
    report = "# HomeFinder Project Census\n\nGenerated: %s\n\n## Counts\n\n" % census["generated_at"]
    report += "\n".join(f"- **{k}:** {v}" for k, v in census["counts"].items())
    report += "\n\n## Authority\n\n- Physical 3D authority: `master/HomeFinder.sh3d`\n- Existing detailed 3D census: `active_development/3d/docs/model-census.json`\n- Semantic dictionary owner: `%s`\n" % (census["dictionary_owner"] or "not found")
    if forbidden:
        report += "\n## Forbidden-file findings\n\n" + "\n".join(f"- `{p}`" for p in sorted(set(forbidden))) + "\n"
    else:
        report += "\n## Forbidden-file findings\n\n- None detected by configured patterns.\n"

    if args.write:
        out_json.parent.mkdir(parents=True, exist_ok=True)
        out_md.parent.mkdir(parents=True, exist_ok=True)
        out_json.write_text(json.dumps(census, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        out_md.write_text(report, encoding="utf-8")
    else:
        print(json.dumps(census, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
