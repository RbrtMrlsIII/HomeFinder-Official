#!/usr/bin/env python3
"""Read-only HomeFinder repository inventory helper.

Purpose: reproduce baseline inventory/hash/extension information without
renaming, moving, deleting, or rewriting repository files.
"""
from pathlib import Path
import argparse, csv, hashlib

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root", type=Path)
    ap.add_argument("--output", type=Path, default=None)
    args = ap.parse_args()
    rows = []
    for p in sorted(x for x in args.root.rglob("*") if x.is_file()):
        rows.append((str(p.relative_to(args.root)), p.stat().st_size,
                     sha256(p), p.suffix.lower() or "[no extension]"))
    target = args.output or Path("baseline-manifest.csv")
    with target.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["path", "size_bytes", "sha256", "extension"])
        w.writerows(rows)
    print(f"Inventoried {len(rows)} files -> {target}")

if __name__ == "__main__":
    main()
