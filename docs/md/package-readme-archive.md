# HomeFinder — 3D authority package

## Physical source of truth

`master/HomeFinder.sh3d` — sole operational SH3D.  
Hash must be verified with `sha256sum` before trusting any manifest.

## Layout (no numbered folder prefixes)

| Path | Role |
|------|------|
| `master/` | Canonical SH3D binary |
| `active_development/` | App HTML/CSS/JS, tests, tools, spatial data |
| `reconciliation/` | Historical reconciliation CSVs/reports |
| `archive/checkpoints/` | Visual/audit evidence |
| `docs/` | Project docs and archive |
| `verify/` | Top-level verification runners (legacy) |

## Application root

Work from `active_development/` for hosting and UI.

## Tests

All contract tests live under `active_development/tests/`.

```bash
cd active_development
node --test tests/
```

## Tools

`active_development/tools/` — migration and audit **CLI** scripts (not browser pages).

## Authority policy

See `PROJECT_AUTHORITY.json` and `CHECKPOINT_POLICY.md`.  
Do not restore a second SH3D master. Production must not load WebGL/Three as an app dependency.
