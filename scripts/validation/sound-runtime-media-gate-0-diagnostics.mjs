#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredBlocks = [
  {
    file: "docs/sound-runtime-media-gate-0-runtime-tool-inventory.md",
    label: "sound-runtime-media-gate-0-runtime-tool-inventory"
  },
  {
    file: "docs/sound-runtime-media-gate-0-install-strategy.md",
    label: "sound-runtime-media-gate-0-install-strategy"
  },
  {
    file: "docs/sound-runtime-media-gate-0-model-weight-gpu-policy-plan.md",
    label: "sound-runtime-media-gate-0-model-weight-gpu-policy-plan"
  },
  {
    file: "docs/sound-runtime-media-gate-0-worker-gcp-readiness-plan.md",
    label: "sound-runtime-media-gate-0-worker-gcp-readiness-plan"
  },
  {
    file: "docs/sound-runtime-media-gate-0-media-runtime-policy-plan.md",
    label: "sound-runtime-media-gate-0-media-runtime-policy-plan"
  },
  {
    file: "docs/sound-runtime-media-gate-0-owner-handoff-map.md",
    label: "sound-runtime-media-gate-0-owner-handoff-map"
  },
  {
    file: "docs/implementation-prompts/prompt-sound-runtime-media-gate-1-cpu-worker-install-plan.md",
    label: "sound-runtime-media-gate-1-cpu-worker-install-plan"
  },
  {
    file: "docs/implementation-prompts/prompt-sound-runtime-media-gate-2-model-weight-owner-review.md",
    label: "sound-runtime-media-gate-2-model-weight-owner-review"
  },
  {
    file: "docs/implementation-prompts/prompt-sound-runtime-media-gate-3-media-policy-owner-handoff.md",
    label: "sound-runtime-media-gate-3-media-policy-owner-handoff"
  }
];

const sourceBlocks = [
  {
    file: "docs/sound-music-audio-open-source-tool-candidate-matrix.md",
    label: "sound-oss-tools-0-candidate-matrix"
  },
  {
    file: "docs/sound-music-audio-open-source-tool-approved-install-plan.md",
    label: "sound-oss-tools-2-approved-install-plan"
  },
  {
    file: "docs/sound-music-audio-open-source-tool-scoped-lane-completion-certificate.md",
    label: "sound-oss-tools-15-scoped-lane-completion-certificate"
  },
  {
    file: "docs/reeditpro-e2e-validation-queue-8-results.md",
    label: "reeditpro-e2e-validation-queue-8-results"
  }
];

const expectedDecision = "sound_runtime_media_gate_0_completed_with_warnings_ready_for_cpu_worker_install_plan";
const scopedStatus = "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings";
const scopedHumanStatus = "SOUND OSS scoped synthetic fixture validation passed with warnings";
const expectedScript = "node scripts/validation/sound-runtime-media-gate-0-diagnostics.mjs";
const requiredToolCoverage = [
  "ffmpeg",
  "ffprobe",
  "audioread",
  "pydub",
  "audioflux",
  "signalsmith_stretch",
  "essentia",
  "rubber_band",
  "demucs",
  "rnnoise",
  "lyria",
  "mirelo_sfx_v1_5",
  "mmaudio_v2"
];

function readFile(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function requireFile(file) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing required file: ${file}`);
  }
}

function parseBlock(file, label) {
  requireFile(file);
  const text = readFile(file);
  const pattern = new RegExp("```json\\s+" + label.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") + "\\n([\\s\\S]*?)```");
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Missing JSON block ${label} in ${file}`);
  }
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`Invalid JSON block ${label} in ${file}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function flatten(value, seen = new Set()) {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object") return [String(value)];
  if (seen.has(value)) return [];
  seen.add(value);
  if (Array.isArray(value)) return value.flatMap((item) => flatten(item, seen));
  return Object.values(value).flatMap((item) => flatten(item, seen));
}

function scanUnsafeContent(files) {
  const secretPatterns = [
    /https:\/\/[a-z0-9.-]+\.supabase\.co/i,
    /\bservice_role\b/i,
    /\bBearer\s+[A-Za-z0-9._-]{20,}/,
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
    /\b(sk|pk)_(live|test)_[A-Za-z0-9]{16,}\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/
  ];
  const unsafeTruePatterns = [
    /"(runtimeReady|mediaProcessingReady|supabaseReady|gcpReady|modelWeightsDownloaded|betaReady|productionReady|workerReady|routeReady|providerReady)"\s*:\s*true/,
    /"(runtime_ready|media_processing_ready|supabase_ready|beta_ready|production_ready)"\s*:\s*"?(true|ready|passed)"?/i
  ];
  const forbiddenClaimPatterns = [
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i,
    /runtime readiness\s+(enabled|passed|ready|unlocked)/i,
    /media processing readiness\s+(enabled|passed|ready|unlocked)/i,
    /production\s+(enabled|passed|ready|unlocked)/i,
    /external beta\s+(enabled|passed|ready|unlocked)/i
  ];
  for (const file of files) {
    const text = readFile(file);
    for (const pattern of [...secretPatterns, ...unsafeTruePatterns, ...forbiddenClaimPatterns]) {
      if (pattern.test(text)) {
        throw new Error(`Unsafe content pattern ${pattern} matched ${file}`);
      }
    }
  }
}

const parsed = new Map();
for (const block of [...requiredBlocks, ...sourceBlocks]) {
  parsed.set(block.label, parseBlock(block.file, block.label));
}

const packageJson = JSON.parse(readFile("package.json"));
assert(
  packageJson.scripts?.["sound-runtime-media-gate-0:diagnostics"] === expectedScript,
  "package.json missing sound-runtime-media-gate-0:diagnostics script"
);

const matrix = parsed.get("sound-oss-tools-0-candidate-matrix");
const approvedPlan = parsed.get("sound-oss-tools-2-approved-install-plan");
const completion = parsed.get("sound-oss-tools-15-scoped-lane-completion-certificate");
const queue8 = parsed.get("reeditpro-e2e-validation-queue-8-results");
const inventory = parsed.get("sound-runtime-media-gate-0-runtime-tool-inventory");
const installStrategy = parsed.get("sound-runtime-media-gate-0-install-strategy");
const modelPolicy = parsed.get("sound-runtime-media-gate-0-model-weight-gpu-policy-plan");
const workerPlan = parsed.get("sound-runtime-media-gate-0-worker-gcp-readiness-plan");
const mediaPolicy = parsed.get("sound-runtime-media-gate-0-media-runtime-policy-plan");
const handoff = parsed.get("sound-runtime-media-gate-0-owner-handoff-map");

assert(matrix.candidateCount === 65, "candidate matrix count must remain 65");
assert(matrix.candidates?.length === 65, "candidate matrix must list 65 tools");
assert(approvedPlan.approvedInstallPlanToolCount === 16, "approved install-plan count must remain 16");

const requirementLines = readFile("server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));
assert(requirementLines.length === 13, "pinned Python requirements count must remain 13");

assert(completion.finalScopedStatus === scopedStatus, "final SOUND scoped status changed");
assert(flatten(completion).includes(scopedHumanStatus), "human scoped status missing from SOUND completion certificate");
assert(
  queue8.decision === "reeditpro_e2e_validation_queue_8_completed_with_warnings_ready_for_merge_hygiene",
  "queue-8 source decision changed"
);
assert(flatten(queue8).includes("71"), "queue-8 source must preserve PR #71 validation evidence");

for (const doc of [inventory, installStrategy, modelPolicy, workerPlan, mediaPolicy, handoff]) {
  assert(doc.decision === expectedDecision, `unexpected decision in ${doc.milestone || "gate doc"}`);
}

const sourceToolIds = matrix.candidates.map((tool) => tool.toolId).sort();
const inventoryToolIds = [...inventory.candidateMatrix.toolIds].sort();
assert(JSON.stringify(sourceToolIds) === JSON.stringify(inventoryToolIds), "runtime inventory tool IDs must match candidate matrix");
assert(inventory.candidateMatrix.candidateCount === 65, "runtime inventory candidate count must be 65");
assert(inventory.sourceEvidence.soundScopedLane.status === scopedStatus, "inventory scoped status missing");
assert(inventory.sourceEvidence.soundScopedLane.humanStatus === scopedHumanStatus, "inventory human scoped status missing");
assert(inventory.sourceEvidence.pr630.mergeCommit === "2a68e506f79741cab3b16c76d34717a26ee19aa4", "PR #630 source evidence mismatch");
assert(inventory.sourceEvidence.pr71.mergeCommit === "d9b5ccfa9f7a2b4ffb4ad99e67eee8b145935d72", "PR #71 external evidence mismatch");

const coverageIds = new Set(inventory.requiredToolCoverage.map((item) => item.requiredTool));
for (const toolId of requiredToolCoverage) {
  assert(coverageIds.has(toolId), `missing required tool coverage for ${toolId}`);
}

assert(installStrategy.sourceEvidence.pinnedPythonRequirementCount === 13, "install strategy pinned requirement count mismatch");
assert(installStrategy.sourceEvidence.approvedInstallPlanToolCount === 16, "install strategy approved plan count mismatch");
assert(installStrategy.approvedInstallPlanTools.length === 16, "install strategy must list 16 approved plan tools");
assert(installStrategy.pinnedProvenCpuPythonRequirements.length === 13, "install strategy must list 13 pinned requirements");
assert(modelPolicy.blockedModelWeightTools.length >= 12, "model/GPU policy must preserve model-weight blockers");
assert(workerPlan.gcpPolicy.googleCloudApiCall === "blocked", "GCP API calls must remain blocked");
assert(mediaPolicy.mediaReadWriteGates.some((gate) => gate.gateId === "audioread_file_open"), "audioread file-open gate missing");
assert(mediaPolicy.mediaReadWriteGates.some((gate) => gate.gateId === "pydub_media_operations"), "pydub media-operation gate missing");
assert(handoff.supabaseClassification.updateRequired === "no", "Supabase update classification must remain no");

for (const [status, value] of Object.entries(inventory.runtimeClaims)) {
  assert(value === "blocked_unclaimed", `${status} must remain blocked_unclaimed`);
}
for (const [status, value] of Object.entries(handoff.forbiddenStatuses)) {
  assert(value === "blocked_unclaimed", `${status} must remain blocked_unclaimed`);
}

scanUnsafeContent(requiredBlocks.map((block) => block.file).concat([
  "scripts/validation/sound-runtime-media-gate-0-diagnostics.mjs",
  "package.json"
]));

const summary = {
  decision: expectedDecision,
  sourceHead: inventory.sourceBranchHead,
  candidateMatrixCount: matrix.candidateCount,
  pinnedRequirementCount: requirementLines.length,
  approvedInstallPlanToolCount: approvedPlan.approvedInstallPlanToolCount,
  runtimeToolInventoryCount: inventoryToolIds.length,
  modelWeightToolCount: modelPolicy.blockedModelWeightTools.length,
  systemBinaryToolCount: installStrategy.installGroups.systemBinaryOwnerHandoff.length,
  blockedEvaluationToolCount: installStrategy.installGroups.blockedEvaluationOnly.length,
  supabaseClassification: handoff.supabaseClassification,
  runtimeExecution: "not_run",
  mediaProcessing: "not_run",
  gcpTouched: "no",
  modelWeightsDownloaded: "no"
};

console.log(JSON.stringify(summary, null, 2));
