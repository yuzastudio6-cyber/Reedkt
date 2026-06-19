#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const decision =
  "trackb_media_oss_steward_registry_passed_ready_for_install_proof_milestone_plan";
const ownerId = "TRACK_B_MEDIA_OSS_STEWARD";
const expectedTools = [
  "ffmpeg",
  "ffprobe",
  "sharp_libvips",
  "duckdb",
  "polars_nodejs_polars",
  "opencv",
  "pyav",
  "pyscenedetect",
  "paddleocr",
  "paddlepaddle",
  "mediainfo",
  "exiftool",
  "imagemagick_graphicsmagick",
  "tesseract",
  "opencolorio",
  "openimageio",
];
const acceptedTools = [
  "ffmpeg",
  "ffprobe",
  "sharp_libvips",
  "duckdb",
  "polars_nodejs_polars",
];
const blockedTools = expectedTools.filter((tool) => !acceptedTools.includes(tool));

const requiredFiles = [
  "docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.md",
  "docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json",
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md",
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json",
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md",
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json",
  "docs/implementation-prompts/prompt-trackb-media-oss-install-proof-milestone-plan.md",
  "scripts/validation/open-source-tool-owner-registry-trackb-media-oss-steward-diagnostics.mjs",
  "package.json",
];

function fail(message) {
  console.error(`[trackb-media-oss-steward] ${message}`);
  process.exit(1);
}

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function readJson(relativePath) {
  try {
    return JSON.parse(readText(relativePath));
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      DEVELOPER_DIR: "/Library/Developer/CommandLineTools",
    },
    encoding: "utf8",
  }).trim();
}

function ensureSameSet(actual, expected, label) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  if (actualSet.size !== expectedSet.size) {
    fail(`${label} count mismatch: expected ${expectedSet.size}, got ${actualSet.size}`);
  }
  for (const item of expectedSet) {
    if (!actualSet.has(item)) {
      fail(`${label} missing ${item}`);
    }
  }
}

for (const relativePath of requiredFiles) {
  readText(relativePath);
}

const registry = readJson(
  "docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json",
);
const steward = readJson(
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json",
);
const status = readJson(
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json",
);
const packageJson = readJson("package.json");

if (registry.decision !== decision || steward.decision !== decision || status.decision !== decision) {
  fail("Decision drift detected in owner registry artifacts.");
}

const owner = registry.owners.find((candidate) => candidate.ownerId === ownerId);
if (!owner) {
  fail(`Missing owner ${ownerId} in owner registry.`);
}
if (owner.ownerName !== "Track B Media OSS Steward") {
  fail("Unexpected Track B steward owner name.");
}
if (owner.lane !== "TRACK_B_MEDIA_PROCESSING" || steward.lane !== "TRACK_B_MEDIA_PROCESSING") {
  fail("Unexpected Track B steward lane.");
}

ensureSameSet(owner.ownedTools, expectedTools, "registry owned tools");
ensureSameSet(steward.ownedTools.map((tool) => tool.id), expectedTools, "steward owned tools");
ensureSameSet(
  status.acceptedProvenBounded.map((tool) => tool.id),
  acceptedTools,
  "accepted/proven bounded tools",
);
ensureSameSet(status.blockedNotInstalledProven, blockedTools, "blocked/not installed-proven tools");

if (owner.ownedToolCount !== 16 || steward.statusCounts.ownedTools !== 16 || status.counts.ownedTools !== 16) {
  fail("Owned tool count must be exactly 16.");
}
if (
  owner.acceptedProvenBoundedCount !== 5 ||
  steward.statusCounts.acceptedProvenBounded !== 5 ||
  status.counts.acceptedProvenBounded !== 5
) {
  fail("Accepted/proven bounded count must be exactly 5.");
}
if (
  owner.blockedNotInstalledProvenCount !== 11 ||
  steward.statusCounts.blockedNotInstalledProven !== 11 ||
  status.counts.blockedNotInstalledProven !== 11
) {
  fail("Blocked/not installed-proven count must be exactly 11.");
}
if (
  owner.endToEndProductReadyToolCount !== 0 ||
  steward.statusCounts.endToEndProductReady !== 0 ||
  status.counts.endToEndProductReady !== 0
) {
  fail("End-to-end product-ready Track B tool count must remain 0.");
}

for (const tool of steward.ownedTools) {
  if (tool.endToEndProductReady !== false) {
    fail(`${tool.id} must not be product-ready.`);
  }
  if (acceptedTools.includes(tool.id) && tool.status !== "accepted_proven_bounded_batch1") {
    fail(`${tool.id} must be accepted only as bounded Batch 1 proof.`);
  }
  if (blockedTools.includes(tool.id) && tool.status !== "blocked_not_installed_proven") {
    fail(`${tool.id} must remain blocked/not installed-proven.`);
  }
}

for (const [key, value] of Object.entries(registry.blockedScopes)) {
  if (value !== false) {
    fail(`Blocked scope ${key} must remain false.`);
  }
}
for (const [key, value] of Object.entries(status.blockedScopes)) {
  if (value !== false) {
    fail(`Blocked status scope ${key} must remain false.`);
  }
}

const scriptName =
  "open-source-tool-owner-registry:trackb-media-oss-steward:diagnostics";
if (
  packageJson.scripts?.[scriptName] !==
  "node scripts/validation/open-source-tool-owner-registry-trackb-media-oss-steward-diagnostics.mjs"
) {
  fail(`Missing package script ${scriptName}.`);
}

const textScanFiles = [
  "docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.md",
  "docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json",
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md",
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json",
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md",
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json",
  "docs/implementation-prompts/prompt-trackb-media-oss-install-proof-milestone-plan.md",
  "docs/open-source-tool-stack/open-source-tool-stack-decision.md",
  "docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md",
  "docs/cross-chat/CURRENT_HANDOFF.md",
  "docs/cross-chat/NEXT_UNLOCK_LANES.md",
  "docs/cross-chat/BLOCKED_SCOPES.md",
];

const forbiddenPositivePatterns = [
  /40\+\s+tools\s+(are\s+)?(installed|proven).{0,40}end-to-end/i,
  /all\s+16\s+.*(product-ready|end-to-end\s+ready|ready\s+for\s+production)/i,
  /media\s+processing\s+(is\s+)?(approved|enabled|accepted|unblocked)/i,
  /render\/export\s+(is\s+)?(approved|enabled|accepted|unblocked)/i,
  /beta\s+(is\s+)?(approved|enabled|accepted|unblocked)/i,
  /production\s+(is\s+)?(approved|enabled|accepted|unblocked)/i,
  /Supabase\s+(write|mutation)\s+(is\s+)?(approved|enabled|accepted|unblocked)/i,
  /signed\s+URL\s+(delivery\s+)?(is\s+)?(approved|enabled|accepted|unblocked)/i,
];

for (const relativePath of textScanFiles) {
  const text = readText(relativePath);
  if (/sk-[A-Za-z0-9_-]{20,}/.test(text) || /postgres:\/\/[^ \n]+/i.test(text)) {
    fail(`Potential secret material detected in ${relativePath}.`);
  }
  for (const line of text.split(/\r?\n/)) {
    const negativeWarning = /\b(do not|must not|not allowed|remain blocked|blocked|false)\b/i.test(line);
    for (const pattern of forbiddenPositivePatterns) {
      if (!negativeWarning && pattern.test(line)) {
        fail(`Forbidden positive scope claim in ${relativePath}: ${line.trim()}`);
      }
    }
  }
}

for (const broadDoc of [
  "docs/beta-readiness-scorecard.md",
  "docs/production-beta-blocker-inventory.md",
  "PRODUCTION_FOUNDATION_STATUS.md",
]) {
  if (fs.existsSync(path.join(repoRoot, broadDoc))) {
    fail(`Broad production doc should not be created by this phase: ${broadDoc}`);
  }
}

for (const forbiddenDir of ["dist", "dist-server", "dist-remotion-worker", "dist-staging-fixture-worker", "dist-staging-real-video-export-worker", "node_modules"]) {
  if (fs.existsSync(path.join(repoRoot, forbiddenDir))) {
    fail(`Forbidden generated/local directory present: ${forbiddenDir}`);
  }
}

const protectedDiff = git([
  "diff",
  "--name-only",
  "--",
  "package-lock.json",
  ".dockerignore",
  "docker/prod/render-worker/Dockerfile",
]);
const protectedCachedDiff = git([
  "diff",
  "--cached",
  "--name-only",
  "--",
  "package-lock.json",
  ".dockerignore",
  "docker/prod/render-worker/Dockerfile",
]);
if (protectedDiff || protectedCachedDiff) {
  fail("Protected package-lock/Docker/.dockerignore files must not mutate.");
}

const trackedForbidden = git(["status", "--short"]).split("\n").filter(Boolean).filter((line) => {
  const file = line.slice(3);
  return /(^|\/)(dist|dist-[^/]+|node_modules)(\/|$)/.test(file);
});
if (trackedForbidden.length > 0) {
  fail(`Forbidden generated artifacts in git status: ${trackedForbidden.join(", ")}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      ownerId,
      ownedTools: expectedTools.length,
      acceptedProvenBounded: acceptedTools.length,
      blockedNotInstalledProven: blockedTools.length,
      endToEndProductReady: 0,
      supabaseClassification: "no write / environment none / SQL none / migration no",
    },
    null,
    2,
  ),
);
