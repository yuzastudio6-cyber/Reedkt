#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "scripts/validation/sound-oss-tools-6-synthetic-fixture-validation-runner.py",
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-matrix.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-blocker-register.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-7-synthetic-fixture-owner-review.md",
  "docs/sound-oss-tools-5-synthetic-fixture-validation-plan.md",
  "docs/sound-oss-tools-4-binary-import-proof-result.md",
  "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
];

const expectedModules = [
  "librosa",
  "audioread",
  "pydub",
  "scipy",
  "scipy.signal",
  "resampy",
  "pyloudnorm",
  "audioflux",
  "music21",
  "pretty_midi",
  "mido",
  "noisereduce",
  "pedalboard",
  "mir_eval",
];

const falseFields = [
  "realUserDataUsed",
  "mediaFileRead",
  "mediaFileWritten",
  "generatedArtifactCreated",
  "runtimeExecutionRun",
  "supabaseMutationRun",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`);
  return readFileSync(path, "utf8");
}

function parseBlock(path, label) {
  const text = read(path);
  const pattern = new RegExp("```json " + label + "\\n([\\s\\S]*?)\\n```");
  const match = text.match(pattern);
  assert(match, `Missing JSON block ${label} in ${path}`);
  return JSON.parse(match[1]);
}

for (const file of requiredFiles) {
  assert(existsSync(file), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["sound-oss-tools-6:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-6-synthetic-fixture-validation-diagnostics.mjs",
  "package.json must include sound-oss-tools-6:diagnostics",
);

const result = parseBlock(
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "sound-oss-tools-6-synthetic-fixture-validation-result",
);
const matrix = parseBlock(
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-matrix.md",
  "sound-oss-tools-6-synthetic-fixture-validation-matrix",
);
const blockers = parseBlock(
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-blocker-register.md",
  "sound-oss-tools-6-synthetic-fixture-validation-blocker-register",
);

assert(result.phase === "SOUND-OSS-TOOLS-6", "Result phase must be SOUND-OSS-TOOLS-6");
assert(
  result.decision ===
    "sound_oss_tools_6_synthetic_fixture_validation_passed_with_warnings_ready_for_owner_review",
  "Unexpected SOUND-OSS-TOOLS-6 decision",
);
assert(result.sourcePullRequests?.pr453, "Result must reference merged PR #453");
assert(result.sourcePullRequests?.pr450, "Result must reference merged PR #450");
assert(result.sourceHead === "080513b8581909ff95f7c7ec1f51664940e41cd8", "Unexpected source head");
assert(result.packageLockChanged === false, "package-lock mutation must stay false");
assert(result.fixtureValidationSummary?.fixtureCount === 14, "Result must cover 14 fixtures");
assert(result.fixtureValidationSummary?.passedCount === 12, "Result must record 12 passed fixtures");
assert(result.fixtureValidationSummary?.skippedCount === 2, "Result must record 2 policy skips");
assert(result.fixtureValidationSummary?.failedCount === 0, "Result must record 0 failed fixtures");
assert(result.pydubWarningStatus?.warningPreserved === true, "pydub warning must be preserved");
assert(result.pydubWarningStatus?.mediaOperationsBlocked === true, "pydub media operations must be blocked");
assert(result.claimPolicy?.dryRunPassedClaimed === false, "dry-run pass claim must stay false");
assert(
  result.claimPolicy?.generatedLocalFixturePassedClaimed === false,
  "generated local fixture pass claim must stay false",
);
assert(result.claimPolicy?.runtimeReadinessClaimed === false, "runtime readiness claim must stay false");
assert(
  result.nextPrompt === "SOUND-OSS-TOOLS-7: synthetic fixture owner review, no media processing",
  "Unexpected next prompt",
);

assert(matrix.matrixCount === 14, "Matrix must cover 14 module rows");
assert(matrix.statusCounts?.passed === 12, "Matrix must record 12 passed fixtures");
assert(matrix.statusCounts?.skipped_blocked_by_policy === 2, "Matrix must record 2 policy skips");
assert(matrix.statusCounts?.failed === 0, "Matrix must record 0 failures");
const matrixModules = matrix.rows.map((row) => row.moduleName).sort();
assert(
  JSON.stringify(matrixModules) === JSON.stringify([...expectedModules].sort()),
  `Matrix modules mismatch: ${matrixModules.join(", ")}`,
);
for (const row of matrix.rows) {
  for (const field of falseFields) {
    assert(row[field] === false, `${row.fixtureId} must keep ${field}=false`);
  }
}

const pydub = matrix.rows.find((row) => row.moduleName === "pydub");
assert(pydub?.status === "skipped_blocked_by_policy", "pydub must be skipped by policy");
assert(/FFmpeg\/avconv/.test(pydub.reason), "pydub reason must preserve FFmpeg/avconv warning");
const audioread = matrix.rows.find((row) => row.moduleName === "audioread");
assert(audioread?.status === "skipped_blocked_by_policy", "audioread must be skipped by policy");

assert(blockers.blockerCount >= 9, "Blocker register must preserve closed runtime surfaces");
const blockerText = JSON.stringify(blockers);
for (const expected of [
  "pydub",
  "audioread",
  "FFmpeg/ffprobe",
  "Demucs/RNNoise",
  "Essentia/Rubber Band",
  "Signalsmith Stretch",
  "Supabase/storage/signed URLs/public artifacts",
]) {
  assert(blockerText.includes(expected), `Missing blocker entry for ${expected}`);
}
for (const blocker of blockers.blockers) {
  assert(blocker.mayExecuteNow === false, `${blocker.blockerId} must remain non-executable`);
}

const docsToScan = [
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-matrix.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-blocker-register.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-7-synthetic-fixture-owner-review.md",
].map(read).join("\n");

const unsafeTrue = [
  "realUserDataUsed",
  "mediaFileRead",
  "mediaFileWritten",
  "generatedArtifactCreated",
  "runtimeExecutionRun",
  "supabaseMutationRun",
  "mediaProcessingRun",
  "runtimeReadinessClaimed",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "signedUrlCreated",
  "publicArtifactCreated",
  "packageLockChanged",
];
for (const field of unsafeTrue) {
  assert(!new RegExp(`"${field}"\\s*:\\s*true`).test(docsToScan), `${field} must not be true`);
}

const generatedLocal = "generated" + "_local" + "_fixture" + "_passed";
const dryRun = "dry" + "_run" + "_passed";
assert(!new RegExp(`${generatedLocal}\\s*[:=]\\s*true`, "i").test(docsToScan), "project-wide generated fixture claim must not be true");
assert(!new RegExp(`${dryRun}\\s*[:=]\\s*true`, "i").test(docsToScan), "dry run pass claim must not be true");
assert(!/https?:\/\/[a-z0-9-]+\.supabase\.co/i.test(docsToScan), "Supabase URL must not appear");
assert(!/\b(Authorization\s*:\s*Bearer|Bearer\s+[A-Za-z0-9._~+/=-]{24,})/i.test(docsToScan), "Bearer token must not appear");
assert(!/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(docsToScan), "JWT must not appear");

console.log(
  JSON.stringify(
    {
      status: "passed",
      decision: result.decision,
      fixtureCount: matrix.matrixCount,
      passed: matrix.statusCounts.passed,
      skipped: matrix.statusCounts.skipped_blocked_by_policy,
      failed: matrix.statusCounts.failed,
      pydubWarningPreserved: result.pydubWarningStatus.warningPreserved,
      generatedLocalFixturePassedClaimed: result.claimPolicy.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
);
