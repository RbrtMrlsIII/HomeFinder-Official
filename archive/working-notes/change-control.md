# HomeFinder — Change Control & Documentation Governance

## Mandatory propagation chain

For a material change:

```text
DISCOVER
→ CLASSIFY
→ UPDATE AUTHORITY
→ UPDATE WIRED PRODUCERS
→ UPDATE WIRED CONSUMERS
→ UPDATE TESTS
→ UPDATE DOCUMENTATION
→ REGRESSION
→ PACKAGE
```

## Required change record

Record:

- canonical concept;
- old state/shape, if changing;
- new state/shape;
- authoritative source;
- producers/writers;
- consumers/readers;
- adapter/normalization layer;
- security/role impact;
- integration impact;
- tests/readback oracle;
- migration/deprecation/quarantine decision.

## 3D change rule

An architectural change must update:

1. `master/HomeFinder.sh3d`;
2. model census/hash;
3. affected model-aware viewer configuration;
4. spatial reconciliation;
5. camera/door/object mappings;
6. relevant tests;
7. this documentation set if authority changes.

Never update a camera registry first and treat the model as an afterthought.

## Documentation rule

All human-readable documentation belongs under `docs/`, exactly 20 files. New documentation must merge into one of the existing canonical documents unless a deliberate replacement keeps the total at 20.

Logs and terminal transcripts are not canonical documentation.

## Packaging

The source ZIP used for a migration is an input artifact and remains unmodified. A merged ZIP is a derived release artifact.
