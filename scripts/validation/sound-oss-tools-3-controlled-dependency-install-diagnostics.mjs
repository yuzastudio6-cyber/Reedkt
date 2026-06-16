#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "sound_oss_tools_3_controlled_dependency_install_completed_ready_for_binary_import_proof";

const REQUIRED_FILES = [
  "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "docs/sound-oss-tools-3-controlled-dependency-install-result.md",
  "docs/sound-music-audio-open-source-tool-controlled-install-change-log.md",
  "docs/sound-music-audio-open-source-tool-controlled-install-rollback-report.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-4-binary-import-proof.md",
  "scripts/validation/sound-oss-tools-3-controlled-dependency-install-diagnostics.mjs",
  "docs/sound-music-audio-open-source-tool-approved-install-plan.md",
  "docs/sound-music-audio-open-source-tool-install-exclusion-report.md",
  "docs/sound-oss-tools-2-approved-install-plan-validation-results.md",
  "docs/sound-music-audio-open-source-tool-license-provenance-approval.md",
  "docs/sound-music-audio-open-source-tool-approved-install-plan-subset.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
  "package.json"
];

const BLOCKS = {
  result: [
    "docs/sound-oss-tools-3-controlled-dependency-install-result.md",
    "sound-oss-tools-3-controlled-install-result"
  ],
  changeLog: [
    "docs/sound-music-audio-open-source-tool-controlled-install-change-log.md",
    "sound-oss-tools-3-controlled-install-change-log"
  ],
  rollback: [
    "docs/sound-music-audio-open-source-tool-controlled-install-rollback-report.md",
    "sound-oss-tools-3-controlled-install-rollback-report"
  ],
  sourcePlan: [
    "docs/sound-music-audio-open-source-tool-approved-install-plan.md",
    "sound-oss-tools-2-approved-install-plan"
  ],
  sourceExclusions: [
    "docs/sound-music-audio-open-source-tool-install-exclusion-report.md",
    "sound-oss-tools-2-install-exclusion-report"
  ],
  sourceValidation: [
    "docs/sound-oss-tools-2-approved-install-plan-validation-results.md",
    "sound-oss-tools-2-validation-results"
  ],
  sourceApproval: [
    "docs/sound-music-audio-open-source-tool-license-provenance-approval.md",
    "sound-oss-tools-1-license-provenance-approval"
  ],
  sourceSubset: [
    "docs/sound-music-audio-open-source-tool-approved-install-plan-subset.md",
    "sound-oss-tools-1-approved-install-plan-subset"
  ]
};

const EXPECTED_REQUIREMENTS = [
  "librosa==0.11.0",
  "audioread==3.1.0",
  "pydub==0.25.1",
  "scipy==1.17.1",
  "resampy==0.4.3",
  "pyloudnorm==0.2.0",
  "audioflux==0.1.9",
  "music21==10.3.0",
  "pretty_midi==0.2.11",
  "mido==1.3.3",
  "noisereduce==3.0.3",
  "pedalboard==0.9.23",
  "mir_eval==0.8.2"
];

const SOURCE_APPROVED_TOOLS = [
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

const REQUIRED_ALIAS_OR_SKIPPED = {
  pydub_effects: "alias_covered_by_manifest_package",
  ebu_r128_pyloudnorm: "alias_covered_by_manifest_package",
  signalsmith_stretch: "skipped_optional_source_binary_planning_only"
};

const FORBIDDEN_REQUIREMENT_NAMES = [
  "pydub_effects",
  "ebu_r128_pyloudnorm",
  "signalsmith",
  "signalsmith_stretch",
  "demucs",
  "rnnoise",
  "essentia",
  "pyrubberband",
  "rubberband",
  "rubberband_cli",
  "ffmpeg",
  "ffprobe"
];

const RUNTIME_FLAGS = [
  "toolExecutionAllowed",
  "audioProcessingAllowed",
  "mediaProcessingAllowed",
  "providerCallsAllowed",
  "modelCallsAllowed",
  "workerExecutionAllowed",
  "routeExecutionAllowed",
  "supabaseMutationAllowed",
  "sqlAllowed",
  "dockerCloudRunAllowed",
  "signedUrlCreationAllowed",
  "publicArtifactCreationAllowed",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "runtimeReadinessClaimed",
  "betaProductionUnlockClaimed"
];

const UNSAFE_PATTERNS = [
  ["tool execution claim", /\btoolExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["audio processing claim", /\baudioProcessingAllowed\b\s*[:=]\s*(true|"true")/i],
  ["media processing claim", /\bmediaProcessingAllowed\b\s*[:=]\s*(true|"true")/i],
  ["provider call claim", /\bproviderCallsAllowed\b\s*[:=]\s*(true|"true")/i],
  ["model call claim", /\bmodelCallsAllowed\b\s*[:=]\s*(true|"true")/i],
  ["worker execution claim", /\bworkerExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["route execution claim", /\brouteExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["Supabase mutation claim", /\bsupabaseMutationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["SQL claim", /\bsqlAllowed\b\s*[:=]\s*(true|"true")/i],
  ["Docker/Cloud Run claim", /\bdockerCloudRunAllowed\b\s*[:=]\s*(true|"true")/i],
  ["signed URL claim", /\bsignedUrlCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["public artifact claim", /\bpublicArtifactCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["dry run passed claim", /\bdryRunPassedClaimed\b\s*[:=]\s*(true|"true")/i],
  [
    "generated local fixture claim",
    /\bgeneratedLocalFixturePassedClaimed\b\s*[:=]\s*(true|"true")/i
  ],
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
  packageJson.scripts?.["sound-oss-tools-3:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-3-controlled-dependency-install-diagnostics.mjs",
  "package.json must expose sound-oss-tools-3:diagnostics"
);

const requirementsText = read("server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt");
const requirementLines = requirementsText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

sameSet(requirementLines, EXPECTED_REQUIREMENTS, "requirements direct pins");
for (const line of requirementLines) {
  assert(/^[A-Za-z0-9_.-]+==[0-9][A-Za-z0-9_.!+-]*$/.test(line), `Invalid exact pin: ${line}`);
}

const lowerRequirements = requirementsText.toLowerCase();
for (const forbidden of FORBIDDEN_REQUIREMENT_NAMES) {
  assert(!lowerRequirements.includes(forbidden), `Forbidden dependency in requirements: ${forbidden}`);
}

const result = parseBlock(...BLOCKS.result);
const changeLog = parseBlock(...BLOCKS.changeLog);
const rollback = parseBlock(...BLOCKS.rollback);
const sourcePlan = parseBlock(...BLOCKS.sourcePlan);
const sourceExclusions = parseBlock(...BLOCKS.sourceExclusions);
const sourceValidation = parseBlock(...BLOCKS.sourceValidation);
const sourceApproval = parseBlock(...BLOCKS.sourceApproval);
const sourceSubset = parseBlock(...BLOCKS.sourceSubset);

assert(result.decision === EXPECTED_DECISION, "Unexpected SOUND-OSS-TOOLS-3 decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(rollback.decision === EXPECTED_DECISION, "Rollback decision mismatch");
assert(result.sourceBase === "954c45c8d3cd9c028289b4a4f451e56c3909d08f", "Source base must be PR #436 merge");
assert(result.approvedSourceCandidateCount === 16, "SOUND-OSS-TOOLS-3 must consume 16 source candidates");
assert(result.directManifestPackageCount === 13, "SOUND-OSS-TOOLS-3 must manifest 13 direct packages");
assert(
  result.requirementsManifest ===
    "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "Unexpected requirements manifest path"
);
assert(
  result.pythonResolution?.controlledDependencyResolutionCompleted === true,
  "Controlled dependency resolution must be completed"
);
assert(result.pythonResolution?.importProofCommandsRun === false, "Import proof must not run");
assert(result.pythonResolution?.mediaProcessingCommandsRun === false, "Media processing must not run");
ensureFlagsClosed(result.runtimeFlags, "SOUND-OSS-TOOLS-3 result");

sameSet(
  result.directPackagePins.map((item) => item.manifestLine),
  EXPECTED_REQUIREMENTS,
  "result manifest pins"
);

sameSet(changeLog.manifestDirectPins, EXPECTED_REQUIREMENTS, "change log manifest pins");
assert(changeLog.packageLockChanged === false, "package-lock must remain unchanged");
assert(changeLog.nodePackageDependencyChanged === false, "node dependencies must not change");
assert(changeLog.runtimeFilesChanged === false, "runtime files must not change");
assert(changeLog.supabaseFilesChanged === false, "Supabase files must not change");
assert(changeLog.sqlFilesChanged === false, "SQL files must not change");
assert(changeLog.mediaArtifactsCreated === false, "media artifacts must not be created");

assert(rollback.packageLockRollbackRequired === false, "package-lock rollback must not be required");
assert(rollback.runtimeRollbackRequired === false, "runtime rollback must not be required");
assert(rollback.supabaseRollbackRequired === false, "Supabase rollback must not be required");
assert(rollback.sqlRollbackRequired === false, "SQL rollback must not be required");
assert(rollback.artifactRollbackRequired === false, "artifact rollback must not be required");

const aliasStatuses = Object.fromEntries(
  result.approvedButNotManifested.map((item) => [item.toolId, item.status])
);
for (const [toolId, status] of Object.entries(REQUIRED_ALIAS_OR_SKIPPED)) {
  assert(aliasStatuses[toolId] === status, `${toolId} status must be ${status}`);
}

const requiredBlocked = result.requiredExclusionsStillBlocked ?? {};
for (const toolId of [
  "demucs",
  "rnnoise",
  "essentia",
  "pyrubberband",
  "rubberband_cli",
  "ffmpeg",
  "ffprobe"
]) {
  assert(typeof requiredBlocked[toolId] === "string", `${toolId} must remain blocked or reference-only`);
}

assert(
  sourcePlan.decision === "sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install",
  "Source SOUND-OSS-TOOLS-2 decision drifted"
);
assert(sourcePlan.approvedInstallPlanToolCount === 16, "Source SOUND-OSS-TOOLS-2 approved count drifted");
sameSet(sourcePlan.approvedTools.map((tool) => tool.toolId), SOURCE_APPROVED_TOOLS, "source approved tools");
assert(sourceExclusions.excludedToolCount === 49, "Source exclusion count drifted");
assert(sourceValidation.approvedInstallPlanTools.length === 16, "Source validation approved tools drifted");
assert(sourceApproval.candidateCount === 65, "Source license/provenance candidate count drifted");
assert(sourceApproval.counts.approvedForInstallPlanning === 16, "Source approved planning count drifted");
assert(sourceApproval.counts.blockedDeferredRejected === 35, "Source blocked/deferred count drifted");
assert(sourceSubset.approvedForInstallPlanningCount === 16, "Source subset count drifted");

const promptText = read("docs/implementation-prompts/prompt-sound-oss-tools-4-binary-import-proof.md");
assert(promptText.includes("SOUND-OSS-TOOLS-4 Binary/Import Proof"), "Missing SOUND-OSS-TOOLS-4 prompt title");
assert(promptText.includes("no media processing"), "SOUND-OSS-TOOLS-4 prompt must keep media processing blocked");
assert(promptText.includes("generated_local_fixture_passed"), "SOUND-OSS-TOOLS-4 prompt must block generated local fixture pass claims");
assert(promptText.includes("dry_run_passed"), "SOUND-OSS-TOOLS-4 prompt must block dry run pass claims");

ensureSafeText([
  "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "docs/sound-oss-tools-3-controlled-dependency-install-result.md",
  "docs/sound-music-audio-open-source-tool-controlled-install-change-log.md",
  "docs/sound-music-audio-open-source-tool-controlled-install-rollback-report.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-4-binary-import-proof.md"
]);

console.log("SOUND-OSS-TOOLS-3 controlled dependency install diagnostics passed.");
