# HomeFinder E7 — Automated Enforcement Validation

## Validation contract

Requirement → observable behavior → evidence → result

| Requirement | Observable check | Evidence | Result |
|---|---|---|---|
| Canonical execution skill exists | `MASTER_SKILL.md` present and contains lifecycle/whole-project rules | `scripts/execution-gate.py` | PASS by design |
| Whole-project handover is mandatory | `HandOver.md` required and checked for current gate/project context | `scripts/execution-gate.py` | PASS by design |
| Endorsement state is consistent | E6 endorsed and E7 remains pending until closure | `Endorsement.md` check | PASS when state is correct |
| Anti-repeat remains derived | authority + pre-Classify flag + unique IDs | `ANTI-REPEAT-INDEX.json` check | PASS by design |
| Structural intelligence remains derived | derived/authority/source-boundary assertions | `STRUCTURAL-INDEX.json` check | PASS by design |
| Provenance is populated | `builds.json` must contain complete records | E5 registry check | PASS when records exist |
| Enforcement is read-only | checker never writes project files | script implementation | PASS by inspection |
| Deliberate violation fails | negative-control fixture uses invalid structural authority | `--self-test` | PASS when self-test exits 0 only after detecting violation |

## Independent platform evidence available to E7

The repository already has a real GitHub Actions P04 run (`33451823171`) whose infrastructure setup succeeded, focused P04 runtime validation failed, and evidence artifact upload succeeded. This demonstrates why CI artifacts must remain distinct from application/runtime acceptance. The workflow job records the failed focused validation and successful upload. The artifact record is `9780126370` with digest `d4e59131592c7af694b222726c603c3fa5683cf392cd1e876953632402cdec67`.

E5 also established real Vercel deployment provenance. E7 does not reinterpret deployment state as runtime acceptance.

## Execution limitation

The ChatGPT execution environment cannot clone the public GitHub repository directly because outbound DNS/network access is unavailable. Therefore local checkout execution of the new enforcement script was not claimed. The authoritative executable verification is delegated to the new GitHub Actions workflow on the repository branch.

## Pass criterion

E7 may be endorsed only when the GitHub-hosted execution-gate workflow passes both the repository compliance check and the deterministic negative-control self-test.
