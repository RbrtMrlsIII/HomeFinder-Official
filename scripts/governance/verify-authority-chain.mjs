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
  "tools.md",
  "docs/SKILL_WIRING.md",
  "AI_ASSISTANT_READ_ME.md",
  "skills/orucaveam/SKILL.md",
  "skills/session-start/SKILL.md",
  ".github/pull_request_template.md",
  ".github/workflows/github-pages.yml",
  "master/HomeFinder.sh3d",
  "index.html",
  "404.html",
  "docs/evidence/2026-09-29-revival-unfreeze.md",
];

for (const rel of required) {
  if (!existsSync(resolve(root, rel))) errors.push(`missing required file: ${rel}`);
}

if (existsSync(resolve(root, "vercel.json")) || existsSync(resolve(root, ".vercel"))) {
  errors.push("Vercel production config is forbidden (vercel.json / .vercel)");
}

const law = read("Product_Law/PRODUCT_LAW.md");
if (law && !/highest product authority/i.test(law)) {
  errors.push("PRODUCT_LAW.md must declare itself the highest product authority");
}
if (law && !/github\.io\/HomeFinder-Official/i.test(law)) {
  errors.push("PRODUCT_LAW.md must name GitHub Pages as the canonical public live site");
}
if (law && !/Vercel is not a production/i.test(law)) {
  errors.push("PRODUCT_LAW.md must retire Vercel as a production acceptance target");
}

const pages = read(".github/workflows/github-pages.yml");
if (pages && /preset:\s*vercel|vercel\.app/i.test(pages) && !/not Vercel/i.test(pages)) {
  errors.push("github-pages.yml must not deploy HomeFinder production to Vercel");
}

const index = read("index.html");
if (index) {
  if (!/GitHub Pages/i.test(index)) {
    errors.push("index.html must identify GitHub Pages as the public live site");
  }
  if (!/Vercel is not a production/i.test(index)) {
    errors.push("index.html must state that Vercel is not production");
  }
  if (/http-equiv=["']refresh["'][^>]*vercel/i.test(index)) {
    errors.push("index.html must not meta-refresh to Vercel");
  }
}

const plan = read("Masterplan/MASTERPLAN.md");
if (plan) {
  if (!/Backend · identity/i.test(plan)) {
    errors.push("MASTERPLAN.md must keep chronological backend identity section");
  }
  if (!/Frontend · public product/i.test(plan)) {
    errors.push("MASTERPLAN.md must keep frontend public product after backend");
  }
  if (!/Validation unfreeze/i.test(plan)) {
    errors.push("MASTERPLAN.md must record the validation unfreeze");
  }
}

const tools = read("tools.md");
if (tools && !/RETIRED as HomeFinder production/i.test(tools)) {
  errors.push("tools.md must retire Vercel as HomeFinder production");
}
if (tools && !/Firebase Authentication/i.test(tools)) {
  errors.push("tools.md must name Firebase Authentication as identity authority");
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
