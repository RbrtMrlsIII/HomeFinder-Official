#!/usr/bin/env python3
"""Create an isolated P03 camera-contract test fixture without mutating the canonical SH3D."""
from __future__ import annotations

import hashlib
import re
import shutil
import zipfile
from pathlib import Path

SOURCE = Path("master/HomeFinder.sh3d")
OUTPUT = Path("/tmp/HomeFinder-P03-candidate.sh3d")
EXPECTED = [f"HF H-{i:02d} —" for i in range(1, 10)]

if not SOURCE.is_file():
    raise SystemExit(f"Missing canonical model: {SOURCE}")

changed = 0
with zipfile.ZipFile(SOURCE, "r") as zin, zipfile.ZipFile(OUTPUT, "w") as zout:
    names = zin.namelist()
    if "Home.xml" not in names:
        raise SystemExit("Home.xml not found inside HomeFinder.sh3d")
    for info in zin.infolist():
        data = zin.read(info.filename)
        if info.filename == "Home.xml":
            text = data.decode("utf-8")
            for name in EXPECTED:
                pattern = re.compile(
                    r'(<observerCamera\b[^>]*\bname="' + re.escape(name) + r'[^>]*)(>)'
                )
                def replace(match: re.Match[str]) -> str:
                    global changed
                    attrs = match.group(1)
                    if 'attribute="storedCamera"' in attrs:
                        return match.group(0)
                    changed += 1
                    return attrs + ' attribute="storedCamera"' + match.group(2)
                text = pattern.sub(replace, text)
            data = text.encode("utf-8")
        zout.writestr(info, data)

with zipfile.ZipFile(OUTPUT, "r") as z:
    text = z.read("Home.xml").decode("utf-8")

missing = []
for name in EXPECTED:
    hit = re.search(r'<observerCamera\b[^>]*\bname="' + re.escape(name) + r'[^>]*>', text)
    if not hit or 'attribute="storedCamera"' not in hit.group(0):
        missing.append(name)

if missing:
    raise SystemExit("Candidate verification failed: " + ", ".join(missing))
if changed not in (0, 9):
    raise SystemExit(f"Unexpected H-series change count: {changed}")

print(f"P03 isolated candidate: {OUTPUT}")
print(f"P03 H-series camera changes: {changed}")
print(f"P03 candidate SHA-256: {hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}")
