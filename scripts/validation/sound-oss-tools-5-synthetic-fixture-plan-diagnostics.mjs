#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISIONS = [
  "sound_oss_tools_5_synthetic_fixture_validation_plan_ready",
  "sound_oss_tools_5_synthetic_fixture_validation_plan_ready_with_warnings"
];

const EXPECTED_MODULES = [
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
  "mir_eval"
];

const EXCLUDED_TOOLS = [
  "demucs",
  "rnnoise",
  "essentia",
  "pyrubberband",
  "rubberband",
  "rubberband-cli",
  "ffmpeg",
  "ffprobe",
  "signalsmith_stretch"
];

const REQUIRED_FILES = [
  "docs/sound-oss-tools-5-synthetic-fixture-validation-plan.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-schema.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-matrix.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-safety-policy.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-exclusion-guard.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-handoff-plan.md",
  "docs/sound-oss-tools-5-synthetic-fixture-validation-plan-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-6-synthetic-fixture-validation.md",
  "scripts/validation/sound-oss-tools-5-synthetic-fixture-plan-diagnostics.mjs",
  "docs/sound-oss-tools-4-binary-import-proof-result.md",
  "docs/sound-music-audio-open-source-tool-binary-import-proof-matrix.md",
  "docs/sound-music-audio-open-source-tool-binary-import-proof-blocker-register.md",
  "package.json"
];

const BLOCKS = {
  plan: [
    "docs/sound-oss-tools-5-synthetic-fixture-validation-plan.md",
    "sound-oss-tools-5-synthetic-fixture-validation-plan"
  ],
  schema: [
    "docs/sound-music-audio-open-source-tool-synthetic-fixture-schema.md",
    "sound-oss-tools-5-synthetic-fixture-schema"
  ],
  matrix: [
    "docs/sound-music-audio-open-source-tool-synthetic-fixture-matrix.md",
    "sound-oss-tools-5-synthetic-fixture-matrix"
  ],
  safety: [
    "docs/sound-music-audio-open-source-tool-synthetic-fixture-safety-policy.md",
    "sound-oss-tools-5-synthetic-fixture-safety-policy"
  ],
  exclusion: [
    "docs/sound-music-audio-open-source-tool-synthetic-fixture-exclusion-guard.md",
    "sound-oss-tools-5-synthetic-fixture-exclusion-guard"
  ],
  handoff: [
    "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-handoff-plan.md",
    "sound-oss-tools-5-synthetic-fixture-owner-handoff-plan"
  ],
  results: [
    "docs/sound-oss-tools-5-synthetic-fixture-validation-plan-results.md",
    "sound-oss-tools-5-synthetic-fixture-validation-plan-results"
  ],
  proofResult: [
    "docs/sound-oss-tools-4-binary-import-proof-result.md",
    "sound-oss-tools-4-binary-import-proof-result"
  ]
};

const FALSE_FLAGS = [
  "realUserDataAllowed",
  "mediaFileAllowed",
  "generatedFileAllowed",
  "runtimeExecutionAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "routeExecutionAllowed",
  "providerCallsAllowed",
  "modelCallsAllowed",
  "supabaseMutationAllowed",
  "sqlAllowed",
  "artifactCreationAllowed",
  "signedUrlAllowed",
  "publicArtifactAllowed",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "runtimeReadinessClaimed",
  "betaProductionUnlockClaimed"
];

const unsafeFlagPattern = new RegExp(
  "\\b(?:" + FALSE_FLAGS.join("|") + ")\\b\\s*[:=]\\s*(true|\"true\")",
  "i"
);

const UNSAFE_PATTERNS = [
  ["unsafe true flag", unsafeFlagPattern],
  ["DB URL", /\b(?:postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  [
    "JWT",
    new RegExp("\\b" + "e" + "yJ" + "[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\b")
  ],
  ["Authorization bearer", /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._-]+/i],
  ["Supabase project URL", /https:\/\/[a-z0-9]{20}\.supabase\.co/i],
  ["service role key", /\bservice[_-]?role\b.{0,40}\b[A-Za-z0-9_-]{20,}/i],
  [
    "raw provider output claim",
    new RegExp("\\braw" + "Provider" + "Output\\b\\s*[:=]\\s*(?!false|null)", "i")
  ]
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
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

function ensureFalseFlags(record, label, flags = FALSE_FLAGS) {
  for (const flag of flags) {
    if (Object.prototype.hasOwnProperty.call(record ?? {}, flag)) {
      assert(record[flag] === false, `${label} must keep ${flag} false`);
    }
  }
}

function ensureSafeText(files) {
  const findings = [];
  for (const file of files) {
    const text = read(file);
    for (const [label, pattern] of UNSAFE_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${label}: ${file}`);
      }
    }
  }
  assert(findings.length === 0, `Unsafe text found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  assert(exists(file), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["sound-oss-tools-5:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-5-synthetic-fixture-plan-diagnostics.mjs",
  "package.json must expose sound-oss-tools-5:diagnostics"
);

const plan = parseBlock(...BLOCKS.plan);
const schema = parseBlock(...BLOCKS.schema);
const matrix = parseBlock(...BLOCKS.matrix);
const safety = parseBlock(...BLOCKS.safety);
const exclusion = parseBlock(...BLOCKS.exclusion);
const handoff = parseBlock(...BLOCKS.handoff);
const results = parseBlock(...BLOCKS.results);
const proofResult = parseBlock(...BLOCKS.proofResult);

assert(EXPECTED_DECISIONS.includes(plan.decision), "Unexpected SOUND-OSS-TOOLS-5 decision");
assert(plan.sourceBase === "a0abed62c23f9118f955051042b385650ff956cd", "Plan must reference merged PR #450 base");
assert(plan.sourcePullRequests?.pr450, "Plan must reference PR #450");
assert(plan.pydubWarningPolicy?.handled === true, "pydub warning policy must be handled");
assert(plan.pydubWarningPolicy?.mediaOperationsAllowed === false, "pydub media operations must stay blocked");
assert(plan.nextPrompt === "SOUND-OSS-TOOLS-6: synthetic fixture validation, no real user data", "Unexpected next prompt");
ensureFalseFlags(plan.runtimeFlags, "plan runtime flags");

assert(proofResult.decision === "sound_oss_tools_4_binary_import_proof_passed_with_warnings_ready_for_synthetic_fixture_validation_plan", "PR #450 proof decision must be consumed");
assert(proofResult.importValidation?.failedImportCount === 0, "PR #450 proof must have no failed imports");
assert(proofResult.importValidation?.mediaProcessingRun === false, "PR #450 proof must not process media");

for (const flag of ["realUserDataAllowed", "mediaFileAllowed", "generatedFileAllowed", "runtimeExecutionAllowed", "supabaseMutationAllowed", "artifactCreationAllowed", "signedUrlAllowed"]) {
  assert(schema.requiredFalseFlags?.[flag] === false, `Schema must require ${flag} false`);
}

assert(matrix.matrixCount === EXPECTED_MODULES.length, "Fixture matrix must have 14 rows");
sameSet(
  matrix.rows.map((row) => row.moduleName),
  EXPECTED_MODULES,
  "Fixture matrix modules"
);
for (const row of matrix.rows) {
  ensureFalseFlags(row, `matrix row ${row.fixtureId}`, [
    "realUserDataAllowed",
    "mediaFileAllowed",
    "generatedFileAllowed",
    "artifactCreationAllowed",
    "signedUrlAllowed",
    "runtimeExecutionAllowed",
    "supabaseMutationAllowed"
  ]);
}

assert(safety.policy?.realUserDataAllowed === false, "Safety policy must block real user data");
assert(safety.policy?.mediaFileAllowed === false, "Safety policy must block media files");
assert(safety.policy?.pydubMediaOperationsAllowed === false, "Safety policy must block pydub media operations");
assert(safety.policy?.generatedLocalFixturePassedClaimed === false, "Safety policy must not claim generated fixture pass");

for (const tool of EXCLUDED_TOOLS) {
  assert(
    exclusion.excludedTools.some((entry) => entry.toolId === tool && entry.mayBeExecuted === false),
    `Excluded tool ${tool} must be listed and non-executable`
  );
}

for (const item of handoff.handoffs) {
  assert(item.runtimeApprovalGranted === false, `${item.owner} must not receive runtime approval`);
}

assert(results.proofEvidenceConsumed?.pydubWarningPreserved === true, "Results must preserve pydub warning");
assert(results.statuses?.realUserDataUsed === false, "Results must report no real user data");
assert(results.statuses?.mediaProcessingRun === false, "Results must report no media processing");
assert(results.statuses?.syntheticFixtureValidationRun === false, "Results must report no fixture validation run");
assert(results.statuses?.packageLockChanged === false, "Results must report package-lock unchanged");

ensureSafeText([
  "docs/sound-oss-tools-5-synthetic-fixture-validation-plan.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-schema.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-matrix.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-safety-policy.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-exclusion-guard.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-handoff-plan.md",
  "docs/sound-oss-tools-5-synthetic-fixture-validation-plan-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-6-synthetic-fixture-validation.md",
  "scripts/validation/sound-oss-tools-5-synthetic-fixture-plan-diagnostics.mjs"
]);

console.log(
  JSON.stringify(
    {
      status: "passed",
      decision: plan.decision,
      fixtureRows: matrix.matrixCount,
      pydubWarningHandled: plan.pydubWarningPolicy.handled,
      realUserDataAllowed: false,
      mediaProcessingAllowed: false,
      nextPrompt: plan.nextPrompt
    },
    null,
    2
  )
);
