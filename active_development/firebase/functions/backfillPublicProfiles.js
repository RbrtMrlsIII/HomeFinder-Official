// One-time operational backfill for publicProfiles/{uid}. Run with Admin SDK credentials.
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const { publicProfileFromUserData } = require("./publicProfileProjection");

admin.initializeApp();
const db = getFirestore(admin.app(), "homefinder");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const pruneOrphans = process.argv.includes("--prune-orphans");
  const snap = await db.collection("users").get();
  let batch = db.batch();
  let count = 0;
  let pruned = 0;
  for (const doc of snap.docs) {
    const data = publicProfileFromUserData(doc.data() || {});
    const ref = db.collection("publicProfiles").doc(doc.id);
    if (!dryRun) batch.set(ref, { uid: doc.id, ...data }, { merge: false });
    count++;
    if (!dryRun && count % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  if (!dryRun) await batch.commit();

  if (pruneOrphans) {
    const usersById = new Set(snap.docs.map((d) => d.id));
    const publicSnap = await db.collection("publicProfiles").get();
    let pruneBatch = db.batch();
    for (const doc of publicSnap.docs) {
      if (!usersById.has(doc.id)) {
        if (!dryRun) pruneBatch.delete(doc.ref);
        pruned += 1;
        if (!dryRun && pruned % 400 === 0) {
          await pruneBatch.commit();
          pruneBatch = db.batch();
        }
      }
    }
    if (!dryRun) await pruneBatch.commit();
  }

  console.log(`${dryRun ? "Validated" : "Backfilled"} ${count} public profile projections${pruneOrphans ? `; ${dryRun ? "would prune" : "pruned"} ${pruned} orphaned projections` : ""}.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
