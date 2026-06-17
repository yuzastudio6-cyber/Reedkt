#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISIONS = [
  "sound_oss_tools_4_binary_import_proof_passed_ready_for_synthetic_fixture_validation_plan",
  "sound_oss_tools_4_binary_import_proof_passed_with_warnings_ready_for_synthetic_fixture_validation_plan"
];

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

const EXPECTED_PACKAGES = EXPECTED_REQUIREMENTS.map((line) => line.split("==")[0]);

const EXPECTED_IMPORTS = [
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
  "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "scripts/validation/sound-oss-tools-4-binary-import-proof-runner.py",
  "scripts/validation/sound-oss-tools-4-binary-import-proof-diagnostics.mjs",
  "docs/sound-oss-tools-4-binary-import-proof-result.md",
  "docs/sound-music-audio-open-source-tool-binary-import-proof-matrix.md",
  "docs/sound-music-audio-open-source-tool-binary-import-proof-blocker-register.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-5-synthetic-fixture-validation-plan.md",
  "docs/sound-oss-tools-3-controlled-dependency-install-result.md",
  "docs/sound-music-audio-open-source-tool-approved-install-plan.md",
  "docs/sound-music-audio-open-source-tool-license-provenance-approval.md",
  "docs/sound-music-audio-open-source-tool-stack-inventory.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "package.json"
];

const BLOCKS = {
  result: [
    "docs/sound-oss-tools-4-binary-import-proof-result.md",
    "sound-oss-tools-4-binary-import-proof-result"
  ],
  matrix: [
    "docs/sound-music-audio-open-source-tool-binary-import-proof-matrix.md",
    "sound-oss-tools-4-binary-import-proof-matrix"
  ],
  blockerRegister: [
    "docs/sound-music-audio-open-source-tool-binary-import-proof-blocker-register.md",
    "sound-oss-tools-4-binary-import-proof-blocker-register"
  ]
};

const FALSE_RUNTIME_FLAGS = [
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
  ["runtime true flag", /\b(?:toolExecutionAllowed|audioProcessingAllowed|mediaProcessingAllowed|providerCallsAllowed|modelCallsAllowed|workerExecutionAllowed|routeExecutionAllowed|supabaseMutationAllowed|sqlAllowed|dockerCloudRunAllowed|signedUrlCreationAllowed|publicArtifactCreationAllowed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed|runtimeReadinessClaimed|betaProductionUnlockClaimed)\b\s*[:=]\s*(true|"true")/i],
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

function ensureRuntimeFlagsClosed(flags, label) {
  for (const flag of FALSE_RUNTIME_FLAGS) {
    assert(flags?.[flag] === false, `${label} must keep ${flag} false`);
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
  packageJson.scripts?.["sound-oss-tools-4:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-4-binary-import-proof-diagnostics.mjs",
  "package.json must expose sound-oss-tools-4:diagnostics"
);

const requirements = read(
  "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt"
)
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);
assert(
  JSON.stringify(requirements) === JSON.stringify(EXPECTED_REQUIREMENTS),
  "requirements manifest must keep exactly the 13 SOUND-OSS-TOOLS-3 direct pins"
);

const result = parseBlock(...BLOCKS.result);
const matrix = parseBlock(...BLOCKS.matrix);
const blockerRegister = parseBlock(...BLOCKS.blockerRegister);

assert(EXPECTED_DECISIONS.includes(result.decision), "Unexpected SOUND-OSS-TOOLS-4 decision");
assert(result.packageInstallValidation?.status === "passed", "Package install validation must pass");
assert(result.packageMetadataValidation?.status === "passed", "Metadata validation must pass");
assert(result.importValidation?.status === "passed", "Import validation must pass");
assert(result.tempVenv?.createdOutsideRepo === true, "Temp venv must be outside repo");
assert(result.tempVenv?.removedAfterProof === true, "Temp venv must be removed after proof");
assert(result.tempVenv?.staged === false, "Temp venv must not be staged");
assert(result.packageInstallValidation?.packageLockChanged === false, "package-lock must not change");
assert(result.nextPrompt === "SOUND-OSS-TOOLS-5: synthetic fixture validation plan, no real user data", "Unexpected next prompt");
ensureRuntimeFlagsClosed(result.runtimeFlags, "result runtime flags");

sameSet(result.excludedToolsConfirmed, EXCLUDED_TOOLS, "Excluded tools");

assert(matrix.matrixCount === EXPECTED_IMPORTS.length, "Proof matrix must have 14 import rows");
sameSet(
  matrix.proofRows.map((row) => row.moduleName),
  EXPECTED_IMPORTS,
  "Proof imports"
);
sameSet(
  matrix.proofRows.map((row) => row.packageName),
  [...EXPECTED_PACKAGES, "scipy"],
  "Proof package rows"
);
for (const row of matrix.proofRows) {
  assert(row.importStatus === "passed", `${row.moduleName} import must pass`);
  assert(row.metadataStatus === "passed", `${row.packageName} metadata must pass`);
  assert(row.mediaProcessingRun === false, `${row.moduleName} must not process media`);
  assert(row.runtimeExecutionRun === false, `${row.moduleName} must not run runtime execution`);
}

assert(blockerRegister.blockingFailureCount === 0, "No blocking failures expected");
for (const tool of EXCLUDED_TOOLS) {
  assert(
    blockerRegister.register.some((entry) => entry.toolId === tool),
    `Missing excluded tool register row for ${tool}`
  );
}

const runner = read("scripts/validation/sound-oss-tools-4-binary-import-proof-runner.py");
for (const moduleName of EXPECTED_IMPORTS) {
  assert(runner.includes(`"${moduleName}"`), `Runner must include expected import ${moduleName}`);
}
for (const forbiddenSnippet of ["subprocess", "os.system", "socket", "urllib.request", "requests."]) {
  assert(!runner.includes(forbiddenSnippet), `Runner must not use ${forbiddenSnippet}`);
}

ensureSafeText([
  "docs/sound-oss-tools-4-binary-import-proof-result.md",
  "docs/sound-music-audio-open-source-tool-binary-import-proof-matrix.md",
  "docs/sound-music-audio-open-source-tool-binary-import-proof-blocker-register.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-5-synthetic-fixture-validation-plan.md",
  "scripts/validation/sound-oss-tools-4-binary-import-proof-runner.py"
]);

console.log(
  JSON.stringify(
    {
      status: "passed",
      decision: result.decision,
      requirementsCount: requirements.length,
      importCount: matrix.matrixCount,
      excludedTools: EXCLUDED_TOOLS.length,
      nextPrompt: result.nextPrompt
    },
    null,
    2
  )
);
