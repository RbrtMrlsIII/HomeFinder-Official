/**
 * Patch 48 production Firebase adapter.
 *
 * This module is deliberately inert until imported by an operator-run process.
 * It never contains credentials. Authentication is delegated to Firebase Admin
 * SDK application-default credentials / GOOGLE_APPLICATION_CREDENTIALS.
 * The target database is the canonical HomeFinder named database: `homefinder`.
 */
import admin from 'firebase-admin';

const DATABASE_ID = 'homefinder';
const COLLECTION = 'boosts';

function serialise(value) {
  if (value == null) return value;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialise);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialise(v);
    return out;
  }
  return value;
}

export function createFirebaseAdminAdapter({ app = null } = {}) {
  const firebaseApp = app || (admin.apps.length ? admin.app() : admin.initializeApp());
  const db = admin.firestore(firebaseApp, DATABASE_ID);
  const collection = db.collection(COLLECTION);

  return {
    async readSnapshot() {
      const snap = await collection.get();
      const out = {};
      for (const doc of snap.docs) out[doc.id] = serialise(doc.data());
      return out;
    },

    async writeCanonical(changes, receipt) {
      if (!receipt?.authorized || !receipt?.snapshotId || !receipt?.operator) {
        throw new Error('Production write requires an authorized Patch 48 receipt.');
      }
      if (!changes.length) return;

      const batch = db.batch();
      for (const change of changes) {
        const ref = collection.doc(change.uid);
        batch.set(ref, {
          [change.role]: {
            active: true,
            package: change.package,
            level: admin.firestore.FieldValue.delete()
          }
        }, { merge: true });
      }
      await batch.commit();
    }
  };
}
