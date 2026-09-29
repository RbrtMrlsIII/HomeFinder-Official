#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const errors = [];

function read(rel) {
  const p = resolve(root, rel);
  if (!existsSync(p)) {
    errors.push(`missing required file: ${rel}`);
    return "";
  }
  return readFileSync(p, "utf8");
}

const required = [
  "Product_Law/PRODUCT_LAW.md",
  "Product_Law/WIRING.md",
  "Masterplan/MASTERPLAN.md",
  "Masterplan/NEXT_SLICES.md",
  "POLICY.md",
  "docs/SKILL_WIRING.md",
  "AI_ASSISTANT_READ_ME.md",
  "skills/orucaveam/SKILL.md",
  "skills/session-start/SKILL.md",
  ".github/pull_request_template.md",
  "master/HomeFinder.sh3d",
];

for (const rel of required) {
  if (!existsSync(resolve(root, rel))) errors.push(`missing required file: ${rel}`);
}

const law = read("Product_Law/PRODUCT_LAW.md");
if (law && !/highest product authority/i.test(law)) {
  errors.push("PRODUCT_LAW.md must declare itself the highest product authority");
}

const slices = read("Masterplan/NEXT_SLICES.md");
if (slices) {
  const sections = ["Role", "Current Slice", "Status", "Objective", "Dependencies", "Verification"];
  for (const name of sections) {
    const re = new RegExp(`^## ${name}\\b`, "m");
    if (!re.test(slices)) errors.push(`NEXT_SLICES.md missing required section: ${name}`);
  }
  const current = [...slices.matchAll(/^## Current Slice\b/gm)];
  if (current.length !== 1) {
    errors.push(`NEXT_SLICES.md must contain exactly one "## Current Slice" heading (found ${current.length})`);
  }
}

for (const forbidden of ["HandOver.md", "Endorsement.md", "OBSOLETE_FILES.md"]) {
  if (existsSync(resolve(root, forbidden))) {
    errors.push(`forbidden live instruction file at repository root: ${forbidden}`);
  }
}

for (const rel of ["project-guide/HandOver.md", "project-guide/Endorsement.md"]) {
  const text = read(rel);
  if (text && !/HISTORICAL/i.test(text.slice(0, 800))) {
    errors.push(`${rel} must open with a HISTORICAL banner (first 800 chars)`);
  }
}

if (existsSync(resolve(root, "docs/skills"))) {
  errors.push("parallel Skill namespace docs/skills/ is forbidden; use skills/**/SKILL.md");
}

if (errors.length) {
  console.error("HomeFinder authority-chain failed:");
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}

console.log("HomeFinder authority-chain: PASS");
