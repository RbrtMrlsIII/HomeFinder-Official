#!/usr/bin/env python3
"""Generate the HomeFinder derived structural intelligence index.

The index is intentionally a navigation layer. It never rewrites or elevates
the authority of the listed source files.
"""
from __future__ import annotations
import argparse, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / '.agent' / 'structural' / 'structural-index.config.json'
DEFAULT_OUTPUT = ROOT / '.agent' / 'structural' / 'STRUCTURAL-INDEX.json'


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--config', default=str(DEFAULT_CONFIG))
    p.add_argument('--output', default=str(DEFAULT_OUTPUT))
    args = p.parse_args()
    config_path = Path(args.config)
    data = json.loads(config_path.read_text(encoding='utf-8'))
    records = []
    for src in data.get('sources', []):
        path = src['path']
        exists = (ROOT / path).is_file()
        record = dict(src)
        record['state'] = 'PRESENT' if exists else 'MISSING_FROM_CHECKOUT'
        records.append(record)
    output = {
        'schema': 'HOMEFINDER-STRUCTURAL-INDEX-1.0',
        'derived': True,
        'authority': 'SOURCE_FILES_RETAIN_EXISTING_AUTHORITY',
        'config': str(config_path.relative_to(ROOT)).replace('\\', '/'),
        'sources': records,
        'relations': data.get('relations', []),
        'procedure_selection': {
            'Product / Requirements': ['PRODUCT','DATA','DOCUMENTATION'],
            'Architecture': ['UI_ROUTES_3D','FRONTEND','3D_SPATIAL','EXECUTION'],
            'Frontend / UI': ['FRONTEND','UI_3D','UI_ROUTES_3D'],
            '3D / Spatial': ['3D','3D_SPATIAL','UI_3D'],
            'GLB / Web Graphics': ['3D','3D_GLb','3D_SPATIAL'],
            'Browser / Runtime': ['3D_SPATIAL','EXECUTION'],
            'Testing / QA': ['3D','3D_SPATIAL','UI_ROUTES_3D'],
            'Documentation / Knowledge': ['DOCUMENTATION','DATA','CONTINUITY'],
            'Operations / Whole-Project Handover': ['CONTINUITY','EXECUTION','DOCUMENTATION']
        },
        'notes': [
            'This index is a derived navigation view, not a source of truth.',
            'The semantic dictionary remains owned by active_development/data/dictionary.json.',
            'The authored-model census remains owned by active_development/3d/docs/model-census.json.',
            'MASTER_SKILL.md remains the single execution authority.',
            'No full-repository counts are inferred from remote API views.'
        ]
    }
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(output, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'sources': len(records), 'output': str(out)}, indent=2))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
