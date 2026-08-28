# HomeFinder — Legacy, Compatibility & Retirement Policy

## Safe cleanup sequence

```text
inventory → dependency audit → quarantine → migration → proof → retirement → regression
```

Never delete because a filename contains `legacy`, `old`, `TODO`, `backup`, or similar wording.

## Known legacy surfaces

- `properties` — migration-only inventory.
- `marketplace.html` — not canonical; do not restore.
- old `.sh3x` architectural model — retired.
- Sweet Home 3D vendor demo SH3D — removed; not part of HomeFinder authority.
- Meshy — deprecated/not required for the current pipeline.
- legacy Boost vocabulary/parser forms — retired after migration proof.
- historical WalkMyPlan logs/checkpoints — consolidated into canonical docs rather than retained as active documentation.

## Compatibility rule

Compatibility code may remain only when an active producer/consumer or migration proof requires it. It must have a named owner and retirement condition.

## Quarantine principle

When ownership is uncertain, isolate the item and document the reason. Do not silently delete it.

## Documentation-specific retirement

Patch notes, receipts, duplicate manifests, phase notes, and terminal-style development logs have been merged into the 20-document SoT. Their useful decisions are not lost; their redundant file-level history is no longer treated as project authority.

## Legal caution

Legal pages remain subject to human/legal review before production use. Missing or draft legal surfaces must not be "fixed" by inventing legal content.
