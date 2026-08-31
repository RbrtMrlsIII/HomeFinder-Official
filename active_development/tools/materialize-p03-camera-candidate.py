#!/usr/bin/env python3
"""Materialize the bounded P03 camera-contract candidate without reserializing the model XML."""
from __future__ import annotations

import hashlib
import io
import re
import zipfile
from pathlib import Path

SOURCE = Path("master/HomeFinder.sh3d")
OUTPUT = Path("master/HomeFinder-candidate-camera-contract.sh3d")
EXPECTED_SHA256 = "f8a0bf7d0181155d342dfc97fad0679741e38fdcfda60982dfa3ee534eb81aed"
CAMERAS = [f"HF H-{n:02d}" for n in range(1, 10)]


def main() -> None:
    source_bytes = SOURCE.read_bytes()
    source_sha = hashlib.sha256(source_bytes).hexdigest()
    if len(source_bytes) != 5775168:
        raise SystemExit(f"unexpected canonical size: {len(source_bytes)}")

    source_zip = zipfile.ZipFile(io.BytesIO(source_bytes), "r")
    home_xml = source_zip.read("Home.xml").decode("utf-8")

    for camera in CAMERAS:
        marker = f'<observerCamera name="{camera}'
        replacement = f'<observerCamera attribute="storedCamera" name="{camera}'
        if home_xml.count(marker) != 1:
            raise SystemExit(f"expected exactly one ordinary observerCamera for {camera}")
        home_xml = home_xml.replace(marker, replacement, 1)

    if any(home_xml.count(f'<observerCamera attribute="storedCamera" name="{camera}') != 1 for camera in CAMERAS):
        raise SystemExit("camera contract transformation did not produce exactly nine stored cameras")

    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as target:
        for info in source_zip.infolist():
            payload = home_xml.encode("utf-8") if info.filename == "Home.xml" else source_zip.read(info.filename)
            copied = zipfile.ZipInfo(info.filename, info.date_time)
            for attr in (
                "compress_type",
                "comment",
                "extra",
                "create_system",
                "create_version",
                "extract_version",
                "flag_bits",
                "volume",
                "internal_attr",
                "external_attr",
            ):
                setattr(copied, attr, getattr(info, attr))
            target.writestr(copied, payload)

    candidate = output.getvalue()
    candidate_sha = hashlib.sha256(candidate).hexdigest()
    if candidate_sha != EXPECTED_SHA256:
        raise SystemExit(
            f"candidate hash mismatch: {candidate_sha} (expected {EXPECTED_SHA256}); canonical={source_sha}"
        )

    OUTPUT.write_bytes(candidate)
    print(f"canonical sha256: {source_sha}")
    print(f"candidate sha256: {candidate_sha}")
    print(f"candidate bytes: {len(candidate)}")


if __name__ == "__main__":
    main()
