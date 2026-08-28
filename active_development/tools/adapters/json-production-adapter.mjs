/**
 * Patch 48 fixture adapter only.
 * This emulates the production adapter contract without touching Firebase.
 * It is used by automated tests to exercise the complete execution gate.
 */
import fs from 'node:fs/promises';

export function createJsonAdapter(file) {
  return {
    async readSnapshot() {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    },
    async writeCanonical(changes) {
      const snapshot = JSON.parse(await fs.readFile(file, 'utf8'));
      for (const change of changes) {
        snapshot[change.uid] ??= {};
        snapshot[change.uid][change.role] = {
          ...(snapshot[change.uid][change.role] || {}),
          active: true,
          package: change.package,
        };
        delete snapshot[change.uid][change.role].level;
      }
      await fs.writeFile(file, JSON.stringify(snapshot, null, 2) + '\n');
    }
  };
}
