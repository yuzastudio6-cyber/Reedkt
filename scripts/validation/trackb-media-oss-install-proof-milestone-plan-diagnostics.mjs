#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..", "..");
const reportDir = "docs/open-source-tool-stack/trackb-media-oss-install-proof-milestone-plan";
const decision = "trackb_media_oss_install_proof_milestone_plan_passed_ready_for_milestone_1_execution";
const ownerDecision = "trackb_media_oss_steward_registry_passed_ready_for_install_proof_milestone_plan";
const nextPrompt = "TRACKB_MEDIA_OSS_MILESTONE_1_LOW_RISK_METADATA_TOOLING_EXECUTION";

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
const acceptedStatusTools = [
  "ffmpeg",
  "ffprobe",
  "sharp_libvips",
  "duckdb",
  "polars_nodejs_polars",
  "mediainfo",
  "exiftool",
  "imagemagick",
  "tesseract",
];
const blockedTools = [
  "opencv",
  "pyav",
  "pyscenedetect",
  "paddleocr",
  "paddlepaddle",
  "opencolorio",
  "openimageio",
];
const milestone1Tools = ["exiftool", "mediainfo", "tesseract", "imagemagick_graphicsmagick"];
const computeFields = [
  "compute_default",
  "proof_compute",
  "future_runtime_compute",
  "cost_tier",
  "latency_risk",
  "beta_impact",
  "fallback",
];

const requiredFiles = [
  "source-of-truth-audit.json",
  "source-of-truth-audit.md",
  "owned-tool-install-proof-matrix.json",
  "owned-tool-install-proof-matrix.md",
  "cpu-gpu-compute-policy.json",
  "cpu-gpu-compute-policy.md",
  "milestone-roadmap.json",
  "milestone-roadmap.md",
  "milestone-1-approval.json",
  "milestone-1-approval.md",
  "cloud-runtime-cost-performance-policy.json",
  "cloud-runtime-cost-performance-policy.md",
  "trackb-media-oss-install-proof-milestone-plan-decision.json",
  "trackb-media-oss-install-proof-milestone-plan-decision.md",
  "readiness-report.json",
  "private-artifact-manifest.json",
  "validation-results.md",
].map((file) => `${reportDir}/${file}`);

const requiredPrompts = [
  "docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-low-risk-metadata-tooling-execution.md",
  "docs/implementation-prompts/prompt-trackb-media-oss-milestone-2-video-analysis-approval.md",
  "docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review.md",
  "docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-review.md",
  "docs/implementation-prompts/prompt-trackb-media-oss-cloud-runtime-packaging-plan.md",
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function readText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`missing_file:${relativePath}`);
    return "";
  }
  return fs.readFileSync(fullPath, "utf8");
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`invalid_json:${relativePath}:${error.message}`);
    return {};
  }
}

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
    encoding: "utf8",
  }).trim();
}

function sameSet(actual, expected, label) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  if (actualSet.size !== expectedSet.size) fail(`${label}_count:${actualSet.size}`);
  for (const item of expectedSet) {
    if (!actualSet.has(item)) fail(`${label}_missing:${item}`);
  }
  for (const item of actualSet) {
    if (!expectedSet.has(item)) fail(`${label}_unexpected:${item}`);
  }
}

for (const file of [...requiredFiles, ...requiredPrompts]) readText(file);

const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`);
const matrix = readJson(`${reportDir}/owned-tool-install-proof-matrix.json`);
const compute = readJson(`${reportDir}/cpu-gpu-compute-policy.json`);
const roadmap = readJson(`${reportDir}/milestone-roadmap.json`);
const milestone1 = readJson(`${reportDir}/milestone-1-approval.json`);
const cost = readJson(`${reportDir}/cloud-runtime-cost-performance-policy.json`);
const decisionReport = readJson(`${reportDir}/trackb-media-oss-install-proof-milestone-plan-decision.json`);
const readiness = readJson(`${reportDir}/readiness-report.json`);
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`);
const ownerRegistry = readJson("docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json");
const ownerStatus = readJson("docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json");
const packageJson = readJson("package.json");

for (const [label, report] of Object.entries({ sourceAudit, matrix, compute, roadmap, milestone1, cost, decisionReport, readiness, manifest })) {
  if (label !== "sourceAudit" && report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`);
}
if (sourceAudit.sourceSha !== "a66a1c0b72263e5e113d95216c373e0fad1071bb") fail(`source_sha:${sourceAudit.sourceSha}`);
if (sourceAudit.requiredMergedPr?.number !== 542 || sourceAudit.requiredMergedPr?.state !== "MERGED") fail("pr542_source_review_missing");
if (sourceAudit.owner?.ownerId !== "TRACK_B_MEDIA_OSS_STEWARD") fail("owner_id_missing");
if (ownerRegistry.decision !== ownerDecision || ownerStatus.decision !== ownerDecision) fail("owner_registry_source_decision_drift");
if (decisionReport.nextPrompt !== nextPrompt || milestone1.approvedFutureExecutionPrompt !== nextPrompt) fail("next_prompt_drift");
if (readiness.readiness !== true) fail("readiness_not_true");

sameSet((matrix.tools || []).map((tool) => tool.id), expectedTools, "matrix_tools");
sameSet((compute.tools || []).map((tool) => tool.id), expectedTools, "compute_tools");
const milestone2QaAccepted =
  ownerStatus.milestone2QaReview?.decision ===
  "trackb_media_oss_milestone2_qa_passed_ready_for_milestone3_ocr_ml_cpu_gpu_review";
sameSet(
  ownerStatus.blockedNotInstalledProven || [],
  milestone2QaAccepted ? ["paddleocr", "paddlepaddle", "opencolorio", "openimageio"] : blockedTools,
  "blocked_tools",
);
sameSet(
  ownerStatus.acceptedProvenBounded?.map((tool) => tool.id) || [],
  milestone2QaAccepted
    ? [...acceptedStatusTools, "opencv", "pyav", "pyscenedetect"]
    : acceptedStatusTools,
  "accepted_tools",
);

for (const entry of compute.tools || []) {
  for (const field of computeFields) {
    if (!entry[field]) fail(`missing_compute_field:${entry.id}:${field}`);
  }
}

const m1 = (roadmap.milestones || []).find((entry) => entry.id === "M1");
if (!m1) fail("missing_milestone_1");
else {
  sameSet(m1.tools || [], milestone1Tools, "roadmap_m1_tools");
  if (m1.status !== "future_execution_approved" || m1.approvedNow !== true) fail("milestone_1_not_future_approved");
}
sameSet((milestone1.tools || []).map((tool) => tool.id), milestone1Tools, "milestone_1_approval_tools");
for (const tool of milestone1.tools || []) {
  if (!/^cpu_(only|default)$/.test(tool.compute)) fail(`milestone_1_not_cpu_only_or_default:${tool.id}:${tool.compute}`);
}
if (milestone1.futureExecutionOnly !== true || milestone1.executionRunInThisPhase !== false) fail("milestone_1_execution_boundary_invalid");

for (const [key, value] of Object.entries(decisionReport)) {
  if (/(RunInThisPhase|Accepted|Unlocked|Created|Allowed)$/.test(key) && key !== "milestone1FutureExecutionApproved") {
    if (value !== false) fail(`decision_flag_not_false:${key}`);
  }
}
for (const [key, value] of Object.entries(manifest)) {
  if (key !== "schema" && key !== "decision" && key !== "supabaseClassification" && value !== false) {
    fail(`manifest_flag_not_false:${key}`);
  }
}
if (decisionReport.endToEndProductReady !== 0) fail("product_ready_not_zero");
if (decisionReport.fortyPlusEndToEndClaimAllowed !== false) fail("forty_plus_claim_allowed");
if (cost.currentPhaseRuntimeApproval?.workerExecutionApproved !== false) fail("cost_policy_worker_runtime_approved");
if (packageJson.scripts?.["trackb-media-oss:install-proof-milestone-plan:diagnostics"] !== "node scripts/validation/trackb-media-oss-install-proof-milestone-plan-diagnostics.mjs") {
  fail("missing_package_script");
}

const scanFiles = [
  ...requiredFiles,
  ...requiredPrompts,
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md",
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json",
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md",
  "docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json",
  "docs/open-source-tool-stack/open-source-tool-stack-decision.md",
  "docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md",
  "docs/cross-chat/CURRENT_HANDOFF.md",
  "docs/cross-chat/NEXT_UNLOCK_LANES.md",
  "docs/cross-chat/BLOCKED_SCOPES.md",
];
const forbidden = [
  /40\+\s+tools\s+(are\s+)?(installed|proven).{0,60}end-to-end/i,
  /end-to-end product-ready (?:Track B )?tools:\s*[1-9]/i,
  /\bmedia processing\s+(is\s+)?(approved|enabled|accepted|unblocked)\b/i,
  /\brender\/export\s+(is\s+)?(approved|enabled|accepted|unblocked)\b/i,
  /\b(worker|provider|route).*runtime\s+(is\s+)?(approved|enabled|accepted|unblocked)\b/i,
  /\b(Supabase|GCS|public artifact|signed URL|raw prompt|beta|production)\s+(is\s+)?(approved|enabled|accepted|unblocked)\b/i,
  /\b(sk-proj-|sk-live-|postgres:\/\/|BEGIN [A-Z ]*PRIVATE KEY|X-Amz-Signature=)\b/i,
];
for (const file of scanFiles) {
  const text = readText(file);
  for (const line of text.split(/\r?\n/)) {
    const negative = /\b(no|not|do not|must not|remain blocked|blocked|false|without claiming|does not)\b/i.test(line);
    for (const pattern of forbidden) {
      if (!negative && pattern.test(line)) fail(`forbidden_claim:${file}:${line.trim()}`);
    }
  }
}

for (const broadDoc of ["docs/beta-readiness-scorecard.md", "docs/production-beta-blocker-inventory.md", "PRODUCTION_FOUNDATION_STATUS.md"]) {
  if (fs.existsSync(path.join(repoRoot, broadDoc))) fail(`broad_doc_created:${broadDoc}`);
}
for (const generated of ["dist", "dist-server", "dist-remotion-worker", "dist-staging-fixture-worker", "dist-staging-real-video-export-worker", "node_modules"]) {
  if (fs.existsSync(path.join(repoRoot, generated))) fail(`forbidden_output_present:${generated}`);
}
const protectedDiff = git(["diff", "--name-only", "--", "package-lock.json", ".dockerignore", "docker/prod/render-worker/Dockerfile"]);
const protectedCachedDiff = git(["diff", "--cached", "--name-only", "--", "package-lock.json", ".dockerignore", "docker/prod/render-worker/Dockerfile"]);
if (protectedDiff || protectedCachedDiff) fail("protected_file_mutation");
const forbiddenStatus = git(["status", "--short"])
  .split("\n")
  .filter(Boolean)
  .filter((line) => /(^|\/)(dist|dist-[^/]+|node_modules)(\/|$)/.test(line.slice(3)));
if (forbiddenStatus.length) fail(`forbidden_output_status:${forbiddenStatus.join(",")}`);

if (failures.length) {
  console.error("Track B media OSS install/proof milestone plan diagnostics failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      ownedTools: expectedTools.length,
      acceptedProvenBounded: acceptedStatusTools.length,
      blockedNotInstalledProven: blockedTools.length,
      milestone1Tools,
      nextPrompt,
      supabaseClassification: "no write / environment none / SQL none / migration no"
    },
    null,
    2
  )
);
