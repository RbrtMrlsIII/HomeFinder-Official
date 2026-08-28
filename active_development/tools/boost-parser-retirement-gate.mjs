import fs from 'node:fs';
import path from 'node:path';

export function evaluateRetirement({ receipt, sourceText, writerText }) {
  const blockers = [];
  const p48 = receipt || {};
  const proof = p48.proof || {};

  if (p48.status !== 'completed') blockers.push('PATCH48_NOT_COMPLETED');
  if (p48.authorized !== true) blockers.push('PRODUCTION_RECEIPT_NOT_AUTHORIZED');
  if (!p48.snapshotId || !p48.operator) blockers.push('MISSING_PRODUCTION_IDENTITY');
  if (proof.parserRetirementEligible !== true) blockers.push('PARSER_RETIREMENT_NOT_ELIGIBLE');
  if (Number(proof.activeNoncanonicalAfterCount || 0) !== 0) blockers.push('ACTIVE_NONCANONICAL_REMAINS');
  if (Number(proof.activeRecordMissingAfterCount || 0) !== 0) blockers.push('ACTIVE_RECORD_MISSING_AFTER');

  // New executable writers must never introduce the migration-era vocabulary.
  if (/\blevel\s*:/.test(writerText || '')) blockers.push('LEGACY_LEVEL_WRITE');
  if (/package\s*:\s*['"](?:I|II|III|IV|V)['"]/.test(writerText || '')) blockers.push('ROMAN_PACKAGE_WRITE');

  return {
    patch: 49,
    eligible: blockers.length === 0,
    blockers,
    action: blockers.length === 0 ? 'REMOVE_BOOST_COMPATIBILITY_PARSER' : 'KEEP_PARSER_QUARANTINED'
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.url.replace('file://', ''))) {
  const receiptPath = process.argv[2];
  const sourcePath = process.argv[3];
  const writerPath = process.argv[4];
  if (!receiptPath || !sourcePath || !writerPath) {
    console.error('Usage: node tools/boost-parser-retirement-gate.mjs receipt.json source.txt writer.txt');
    process.exit(2);
  }
  const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  const sourceText = fs.readFileSync(sourcePath, 'utf8');
  const writerText = fs.readFileSync(writerPath, 'utf8');
  console.log(JSON.stringify(evaluateRetirement({ receipt, sourceText, writerText }), null, 2));
}
