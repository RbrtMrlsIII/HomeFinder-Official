# HomeFinder Operating Guide

## Purpose
This is the first-read operating guide for future engineering, security, reconciliation, and 3D sessions.

## Authority order
1. `docs/md/` — what is true now.
2. `docs/json/` — machine-checkable boundaries.
3. Actual code, configuration, and deployed-state evidence — implementation reality.
4. `docs/reconciliation/` — active corrections and migrations.
5. `docs/evidence/` — fresh proof of checks.
6. `archive/` — historical material only; never authoritative.

## Non-negotiable workflow
Discover → Compare → Recover → Repair → Verify → Lock → Archive/Delete.

Never delete an artifact merely because it looks obsolete. First inspect it for unreconciled state and either recover useful differences or document the intentional discard.

Never create a second authority when an existing canonical boundary can be extended.

Never claim PASS from source inspection alone when deployed behavior is the actual requirement.

## Current project anchors
- Firebase project: `homefinder-official` (Firestore DB id: `homefinder`)
- Canonical roles: `owner`, `seeker`, `broker`, `staff`, `moderator`, `admin`
- Authorization role field: `canonicalRole`
- Legacy `agent` vocabulary: compatibility/legacy only; never a current authorization authority.
- Canonical property entities: `propertyListings` and `wantedListings`
- Supabase: critical integrated system; Firebase and Supabase authority must remain aligned.
- Philippine canonical phone representation: exactly 12 ASCII digits, `639XXXXXXXXX`.
- Canonical upload boundary: JPEG/JPG for stored image content.
- Intended 3D authority: `master/HomeFinder.sh3d`, and is now the sole remaining `.sh3d` authority after duplicate comparison and reconciliation. Future modifications require verification and hash update.

## Destructive-change rule
For any duplicate or apparently obsolete artifact:
1. Inventory it.
2. Compare it with the intended canonical artifact.
3. Identify meaningful differences.
4. Recover intentional differences into the canonical artifact.
5. Verify the repaired canonical state.
6. Record evidence and hash.
7. Lock the canonical state.
8. Only then archive or delete redundant copies.

## 3D rule
A physical camera is not automatically a canonical camera. A camera must be intentionally placed, spatially justified, visually verified, and bound to one logical POV before promotion.

Deployment copies are derived artifacts and must never become editing masters.

## Session closeout
Every material session should leave:
- updated canonical/contracts where applicable;
- reconciliation records for changes;
- fresh verification evidence;
- a clean checkpoint named `HomeFinder.zip`;
- no nested ZIPs in the checkpoint.

## Stop conditions
Stop and reconcile when:
- two artifacts claim authority;
- hashes disagree;
- role vocabulary conflicts;
- a deployment artifact contains state absent from the master;
- documentation and actual code/data disagree materially;
- a deletion could discard unreconciled information.
