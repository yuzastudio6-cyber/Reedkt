#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install";

const REQUIRED_FILES = [
  "docs/sound-music-audio-open-source-tool-approved-install-plan.md",
  "docs/sound-music-audio-open-source-tool-dependency-change-forecast.md",
  "docs/sound-music-audio-open-source-tool-install-command-plan.md",
  "docs/sound-music-audio-open-source-tool-binary-import-proof-plan.md",
  "docs/sound-music-audio-open-source-tool-ci-rollback-plan.md",
  "docs/sound-music-audio-open-source-tool-install-exclusion-report.md",
  "docs/sound-oss-tools-2-approved-install-plan-validation-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-3-controlled-dependency-install.md",
  "docs/sound-music-audio-open-source-tool-approved-install-plan-subset.md",
  "docs/sound-music-audio-open-source-tool-license-provenance-approval.md",
  "docs/sound-music-audio-open-source-tool-license-blocked-deferred-register.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
  "package.json"
];

const BLOCKS = {
  plan: [
    "docs/sound-music-audio-open-source-tool-approved-install-plan.md",
    "sound-oss-tools-2-approved-install-plan"
  ],
  forecast: [
    "docs/sound-music-audio-open-source-tool-dependency-change-forecast.md",
    "sound-oss-tools-2-dependency-change-forecast"
  ],
  commands: [
    "docs/sound-music-audio-open-source-tool-install-command-plan.md",
    "sound-oss-tools-2-install-command-plan"
  ],
  proofs: [
    "docs/sound-music-audio-open-source-tool-binary-import-proof-plan.md",
    "sound-oss-tools-2-binary-import-proof-plan"
  ],
  rollback: [
    "docs/sound-music-audio-open-source-tool-ci-rollback-plan.md",
    "sound-oss-tools-2-ci-rollback-plan"
  ],
  exclusions: [
    "docs/sound-music-audio-open-source-tool-install-exclusion-report.md",
    "sound-oss-tools-2-install-exclusion-report"
  ],
  validation: [
    "docs/sound-oss-tools-2-approved-install-plan-validation-results.md",
    "sound-oss-tools-2-validation-results"
  ],
  sourceSubset: [
    "docs/sound-music-audio-open-source-tool-approved-install-plan-subset.md",
    "sound-oss-tools-1-approved-install-plan-subset"
  ],
  sourceApproval: [
    "docs/sound-music-audio-open-source-tool-license-provenance-approval.md",
    "sound-oss-tools-1-license-provenance-approval"
  ]
};

const EXPECTED_APPROVED = [
  "librosa",
  "audioread",
  "pydub",
  "scipy_signal",
  "resampy",
  "pyloudnorm",
  "audioflux",
  "music21",
  "pretty_midi",
  "mido",
  "noisereduce",
  "signalsmith_stretch",
  "pedalboard",
  "pydub_effects",
  "ebu_r128_pyloudnorm",
  "mir_eval"
];

const REQUIRED_EXCLUDED = [
  "demucs",
  "rnnoise",
  "essentia",
  "pyrubberband",
  "rubberband_cli",
  "ffmpeg",
  "ffprobe"
];

const RUNTIME_FLAGS = [
  "dependencyMutationAllowed",
  "toolExecutionAllowed",
  "audioProcessingAllowed",
  "mediaProcessingAllowed",
  "providerCallsAllowed",
  "workerExecutionAllowed",
  "routeExecutionAllowed",
  "supabaseMutationAllowed",
  "sqlAllowed",
  "signedUrlCreationAllowed",
  "publicArtifactCreationAllowed",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "installCompletionClaimed",
  "runtimeReadinessClaimed",
  "betaProductionUnlockClaimed"
];

const UNSAFE_PATTERNS = [
  ["dependency mutation claim", /\bdependencyMutationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["tool execution claim", /\btoolExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["audio processing claim", /\baudioProcessingAllowed\b\s*[:=]\s*(true|"true")/i],
  ["media processing claim", /\bmediaProcessingAllowed\b\s*[:=]\s*(true|"true")/i],
  ["provider call claim", /\bproviderCallsAllowed\b\s*[:=]\s*(true|"true")/i],
  ["worker execution claim", /\bworkerExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["route execution claim", /\brouteExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["Supabase mutation claim", /\bsupabaseMutationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["SQL claim", /\bsqlAllowed\b\s*[:=]\s*(true|"true")/i],
  ["signed URL claim", /\bsignedUrlCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["public artifact claim", /\bpublicArtifactCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["dry run passed claim", /\bdryRunPassedClaimed\b\s*[:=]\s*(true|"true")/i],
  [
    "generated local fixture claim",
    /\bgeneratedLocalFixturePassedClaimed\b\s*[:=]\s*(true|"true")/i
  ],
  ["install completion claim", /\binstallCompletionClaimed\b\s*[:=]\s*(true|"true")/i],
  ["runtime readiness claim", /\bruntimeReadinessClaimed\b\s*[:=]\s*(true|"true")/i],
  ["beta production claim", /\bbetaProductionUnlockClaimed\b\s*[:=]\s*(true|"true")/i],
  ["DB URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ["Authorization bearer", /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._-]+/i],
  ["Supabase project URL", /https:\/\/[a-z0-9]{20}\.supabase\.co/i]
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseBlock(relativePath, label) {
  const text = read(relativePath);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp("```json\\s+" + escaped + "\\n([\\s\\S]*?)\\n```"));
  assert(match, `Missing JSON block ${label} in ${relativePath}`);
  return JSON.parse(match[1]);
}

function sorted(values) {
  return [...values].sort();
}

function sameSet(actual, expected, label) {
  assert(
    JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected)),
    `${label} mismatch`
  );
}

function ensureFlagsClosed(flags, label) {
  for (const flag of RUNTIME_FLAGS) {
    assert(flags?.[flag] === false, `${label} must keep ${flag} false`);
  }
}

function ensureSafeText(files) {
  const findings = [];
  for (const file of files) {
    const text = read(file);
    for (const [name, pattern] of UNSAFE_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${name}: ${file}`);
      }
    }
  }
  assert(findings.length === 0, `Unsafe claims or secret-shaped text found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["sound-oss-tools-2:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-2-approved-install-plan-diagnostics.mjs",
  "package.json must expose sound-oss-tools-2:diagnostics"
);

const plan = parseBlock(...BLOCKS.plan);
const forecast = parseBlock(...BLOCKS.forecast);
const commands = parseBlock(...BLOCKS.commands);
const proofs = parseBlock(...BLOCKS.proofs);
const rollback = parseBlock(...BLOCKS.rollback);
const exclusions = parseBlock(...BLOCKS.exclusions);
const validation = parseBlock(...BLOCKS.validation);
const sourceSubset = parseBlock(...BLOCKS.sourceSubset);
const sourceApproval = parseBlock(...BLOCKS.sourceApproval);

assert(plan.decision === EXPECTED_DECISION, "Unexpected SOUND-OSS-TOOLS-2 decision");
assert(validation.decision === EXPECTED_DECISION, "Validation results decision mismatch");
assert(plan.sourceBase === "46353564d05ae7365a9463df441f9d49ad06b8f8", "Source base must be merged PR #431");
assert(plan.approvedInstallPlanToolCount === 16, "Plan must cover 16 approved install-plan tools");
sameSet(plan.approvedTools.map((tool) => tool.toolId), EXPECTED_APPROVED, "approved plan tools");
sameSet(
  sourceSubset.approvedTools.map((tool) => tool.toolId),
  EXPECTED_APPROVED,
  "SOUND-OSS-TOOLS-1 source subset"
);

assert(sourceApproval.candidateCount === 65, "SOUND-OSS-TOOLS-1 source must retain 65 candidates");
assert(sourceApproval.counts.approvedForInstallPlanning === 16, "SOUND-OSS-TOOLS-1 approved count drifted");
assert(sourceApproval.counts.referenceOnly === 14, "SOUND-OSS-TOOLS-1 reference/handoff count drifted");
assert(sourceApproval.counts.blockedDeferredRejected === 35, "SOUND-OSS-TOOLS-1 blocked/deferred count drifted");

assert(forecast.candidateCount === 16, "Forecast must cover 16 tools");
sameSet(forecast.forecast.map((item) => item.toolId), EXPECTED_APPROVED, "forecast tools");
assert(commands.commandCount === 16, "Command plan must cover 16 tools");
sameSet(commands.commands.map((item) => item.toolId), EXPECTED_APPROVED, "command plan tools");
assert(proofs.proofPlanCount === 16, "Proof plan must cover 16 tools");
sameSet(proofs.proofs.map((item) => item.toolId), EXPECTED_APPROVED, "proof plan tools");

for (const command of commands.commands) {
  assert(command.status === "proposed_not_executed", `${command.toolId} command must be proposed_not_executed`);
  assert(command.marker === "DO_NOT_RUN_IN_THIS_PROMPT", `${command.toolId} command must be marked DO_NOT_RUN`);
}
for (const proof of proofs.proofs) {
  for (const command of proof.proofCommands) {
    assert(command.status === "proposed_not_executed", `${proof.toolId} proof command must be proposed_not_executed`);
    assert(command.marker === "DO_NOT_RUN_IN_THIS_PROMPT", `${proof.toolId} proof command must be marked DO_NOT_RUN`);
  }
}

assert(exclusions.excludedToolCount === 49, "Exclusion report must cover 49 non-approved tools");
const excludedIds = exclusions.exclusions.map((item) => item.toolId);
for (const toolId of REQUIRED_EXCLUDED) {
  assert(excludedIds.includes(toolId), `${toolId} must remain excluded`);
}
assert(
  exclusions.exclusions.every((item) => item.canAppearInSOUNDInstallPlan === false),
  "Excluded tools must not appear in SOUND install plan"
);
assert(
  exclusions.referenceHandoffOnly.every((toolId) => excludedIds.includes(toolId)),
  "Reference/handoff-only tools must be excluded"
);
assert(
  !exclusions.exclusions.some(
    (item) =>
      (item.toolId === "ffmpeg" || item.toolId === "ffprobe") &&
      item.runtimeOwner === "SOUND_MUSIC_AUDIO"
  ),
  "FFmpeg/ffprobe must not become SOUND runtime-owned"
);

assert(rollback.packageLockReviewExpected.includes("No package-lock change"), "Rollback plan must keep package-lock unchanged in this phase");
assert(validation.packageLockStatus === "unchanged_required", "Validation must require unchanged package-lock");
assert(validation.noInstallStatus === "no_install_performed", "Validation must record no install");
assert(validation.noExecutionStatus === "no_execution_performed", "Validation must record no execution");
assert(validation.nextPrompt === "SOUND-OSS-TOOLS-3: controlled dependency install, no media processing", "Unexpected next prompt");

for (const block of [plan, forecast, commands, proofs, rollback, exclusions, validation]) {
  ensureFlagsClosed(block.runtimeFlags, block.phase);
}

const promptText = read("docs/implementation-prompts/prompt-sound-oss-tools-3-controlled-dependency-install.md");
assert(promptText.includes("explicit dependency mutation approval"), "Next prompt must require explicit mutation approval");
assert(promptText.includes("Do not process media"), "Next prompt must keep media processing blocked");
assert(promptText.includes("runtime readiness"), "Next prompt must keep runtime readiness blocked");
assert(promptText.includes("Supabase"), "Next prompt must keep Supabase blocked");

ensureSafeText(REQUIRED_FILES);

console.log(
  JSON.stringify(
    {
      status: "passed",
      phase: "SOUND-OSS-TOOLS-2",
      decision: plan.decision,
      approvedInstallPlanToolCount: plan.approvedInstallPlanToolCount,
      excludedToolCount: exclusions.excludedToolCount,
      commandCount: commands.commandCount,
      proofPlanCount: proofs.proofPlanCount,
      demucsExcluded: excludedIds.includes("demucs"),
      rnnoiseExcluded: excludedIds.includes("rnnoise"),
      essentiaExcluded: excludedIds.includes("essentia"),
      rubberBandExcluded:
        excludedIds.includes("pyrubberband") && excludedIds.includes("rubberband_cli"),
      referenceHandoffOnlyExcluded: true,
      commandsExecuted: false,
      dependencyMutationAllowed: false,
      packageLockChanged: false,
      runtimeClaimsClosed: true,
      nextPrompt: validation.nextPrompt
    },
    null,
    2
  )
);
