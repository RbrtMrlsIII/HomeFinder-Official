#!/usr/bin/env python3
"""Create the exact approved P03 camera-contract candidate from canonical HomeFinder.sh3d."""
from __future__ import annotations

import hashlib
import io
import zipfile
from pathlib import Path

SOURCE = Path("master/HomeFinder.sh3d")
OUTPUT = Path("master/HomeFinder.sh3d.p03-candidate")
EXPECTED_SOURCE_SHA = "2463bbf41a92012bbd81b66ea957c993075f5a2bf6db8a43e676b0c832b0e58c"
EXPECTED_CANDIDATE_SHA = "f8a0bf7d0181155d342dfc97fad0679741e38fdcfda60982dfa3ee534eb81aed"
CAMERAS = [f"HF H-{number:02d}" for number in range(1, 10)]


def copy_zipinfo(info: zipfile.ZipInfo) -> zipfile.ZipInfo:
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
    return copied


def main() -> None:
    source_bytes = SOURCE.read_bytes()
    source_sha = hashlib.sha256(source_bytes).hexdigest()
    if source_sha != EXPECTED_SOURCE_SHA:
        raise SystemExit(f"unexpected canonical SHA-256: {source_sha}")

    with zipfile.ZipFile(io.BytesIO(source_bytes), "r") as source_zip:
        home_xml = source_zip.read("Home.xml").decode("utf-8")
        for camera in CAMERAS:
            marker = f'<observerCamera name="{camera}'
            replacement = f'<observerCamera attribute="storedCamera" name="{camera}'
            if home_xml.count(marker) != 1:
                raise SystemExit(f"expected exactly one ordinary observerCamera for {camera}")
            home_xml = home_xml.replace(marker, replacement, 1)

        output_buffer = io.BytesIO()
        with zipfile.ZipFile(output_buffer, "w", compression=zipfile.ZIP_DEFLATED) as target_zip:
            for info in source_zip.infolist():
                payload = home_xml.encode("utf-8") if info.filename == "Home.xml" else source_zip.read(info.filename)
                target_zip.writestr(copy_zipinfo(info), payload)

    candidate = output_buffer.getvalue()
    candidate_sha = hashlib.sha256(candidate).hexdigest()
    if candidate_sha != EXPECTED_CANDIDATE_SHA:
        raise SystemExit(f"candidate SHA-256 mismatch: {candidate_sha}")

    OUTPUT.write_bytes(candidate)
    print(f"canonical SHA-256: {source_sha}")
    print(f"candidate SHA-256: {candidate_sha}")
    print(f"candidate bytes: {len(candidate)}")


if __name__ == "__main__":
    main()
