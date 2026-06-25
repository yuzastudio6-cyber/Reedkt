#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RUNNER = "server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py";
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_runner_author_fail_closed_runner_authored_blocked_cache_layout_reconciliation";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-CACHE-LAYOUT: reconcile private Wan cache layout for approved runner, no VM/no inference";

const REQUIRED_FILES = [
  RUNNER,
  "docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md",
  "docs/ai-video-broll-generation-gcp-private-proof-runner-author-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-cache-layout.md",
  "scripts/validation/ai-video-broll-gen-9j-runner-author-diagnostics.mjs",
  "docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md",
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-result.md",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "package.json"
];

const UNSAFE_DOC_PATTERNS = [
  ["service account email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["generated local fixture wording claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
  ["dry run wording claim", /\bdry_run_passed\s+(claimed|true|passed)/i],
  ["signed URL query", /\b(X-Amz-Signature|X-Amz-Credential|Expires=|Signature=|Policy=|Key-Pair-Id=)/],
  ["DB URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ["Authorization bearer", /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._-]+/i],
  ["Supabase project URL", /https:\/\/[a-z0-9]{20}\.supabase\.co/i],
  ["API key assignment", /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
  ["service role assignment", /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
  ["secret assignment", /\bsecret\s*[:=]\s*['"][^'"]+/i],
  ["Google credential env", /\bGOOGLE_APPLICATION_CREDENTIALS\b/]
];

const FORBIDDEN_RUNNER_SNIPPETS = [
  "subprocess",
  "requests",
  "urllib",
  "boto3",
  "google.cloud",
  "supabase",
  "psycopg",
  "psql",
  "gcloud",
  "gsutil",
  "export_to_video",
  "imageio",
  "cv2",
  "open(",
  "Path.home()"
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

function ensureSafeDocs(files) {
  const findings = [];
  for (const file of files) {
    const text = read(file);
    for (const [name, pattern] of UNSAFE_DOC_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${name}: ${file}`);
      }
    }
  }
  assert(findings.length === 0, `Unsafe doc text found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["ai-video-broll-gen-9j-runner-author:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-runner-author-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-runner-author:diagnostics"
);

const runnerText = read(RUNNER);
for (const expected of [
  "RUNNER_VERSION",
  "APPROVED_MODEL_ID = \"Wan-AI/Wan2.1-T2V-1.3B\"",
  "APPROVED_MODEL_REVISION = \"37ec512624d61f7aa208f7ea8140a131f93afc9a\"",
  "APPROVED_FIXTURE = \"non-user-media-tabletop\"",
  "MODEL_CACHE_PREFIX = Path(\"/tmp/reeditpro-private-model-cache\")",
  "OUTPUT_PREFIX = Path(\"/tmp/reeditpro-private-proof-output\")",
  "HF_HUB_OFFLINE",
  "TRANSFORMERS_OFFLINE",
  "DIFFUSERS_OFFLINE",
  "--offline-model-cache",
  "--fixture",
  "--max-runtime-minutes",
  "--output-dir",
  "--evidence-json",
  "--allow-approved-local-proof-execution",
  "--validate-only",
  "validated_but_execution_refused_fail_closed",
  "blocked_cache_layout_not_runnable",
  "original_wan_runtime_essential_cache",
  "diffusers_cache_layout",
  "local_files_only=True",
  "enable_model_cpu_offload",
  "return 78"
]) {
  assert(runnerText.includes(expected), `Runner missing ${expected}`);
}

const lines = runnerText.split("\n");
const topLevelImportFindings = lines
  .map((line, index) => ({ line, index: index + 1 }))
  .filter(({ line }) => /^(import torch|from diffusers|from transformers)/.test(line));
assert(topLevelImportFindings.length === 0, `Runner has top-level model imports: ${JSON.stringify(topLevelImportFindings)}`);

for (const forbidden of FORBIDDEN_RUNNER_SNIPPETS) {
  assert(!runnerText.includes(forbidden), `Runner must not include forbidden snippet ${forbidden}`);
}

assert(!/write_bytes|\.save\(|export_to_video|VideoWriter|ffmpeg\s|ffprobe\s/i.test(runnerText), "Runner must not write generated media");
assert(!/pip\s+install|python\s+-m\s+pip|huggingface-cli|snapshot_download/i.test(runnerText), "Runner must not install or download");
assert(!/service[_-]?account.*\.json/i.test(runnerText), "Runner must not reference service account key files");

const result = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md",
  "ai-video-broll-gen-9j-runner-author-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-runner-author-change-log.md",
  "ai-video-broll-gen-9j-runner-author-change-log"
);
const approval = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md",
  "ai-video-broll-gen-9j-runtime-setup-private-runner-dependency-approval"
);

assert(result.decision === EXPECTED_DECISION, "Runner author decision mismatch");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(result.runner?.path === RUNNER, "Runner path mismatch");
assert(result.runner?.created === true, "Runner must be marked created");
assert(result.runner?.failClosedDefault === true, "Runner must be fail-closed");
assert(result.runner?.topLevelTorchImport === false, "Top-level torch import must be false");
assert(result.runner?.topLevelDiffusersImport === false, "Top-level diffusers import must be false");
assert(result.runner?.networkDownloadCodePresent === false, "Network download code must be false");
assert(result.runner?.ffmpegCodePresent === false, "FFmpeg code must be false");
assert(result.cacheLayout?.diffusersCacheLayoutProven === false, "Diffusers cache layout must not be claimed proven");
assert(result.cacheLayout?.runnerCanExecuteCurrentCacheNow === false, "Runner must not execute current cache now");
assert(result.cacheLayout?.cacheLayoutReconciliationRequired === true, "Cache reconciliation must be required");
assert(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Next prompt mismatch");

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  assert(value === false, `Runtime flag ${flag} must be false`);
}

assert(changeLog.runnerCreated === true, "Change log must record runner creation");
assert(changeLog.modelInferenceRun === false, "Change log must keep inference false");
assert(changeLog.generatedVideoCreated === false, "Change log must keep generated video false");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");
assert(approval.runnerApproval?.approvedFutureRunnerPath === RUNNER, "Approval source runner path mismatch");

const cachePrompt = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-cache-layout.md");
for (const expected of [
  "no VM/no inference",
  "approve an adapter",
  "Diffusers-format cache",
  "AI-VIDEO-BROLL-GEN-9J-RETRY-2"
]) {
  assert(cachePrompt.includes(expected), `Cache layout prompt missing ${expected}`);
}

ensureSafeDocs([
  "docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md",
  "docs/ai-video-broll-generation-gcp-private-proof-runner-author-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-cache-layout.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  runnerPath: RUNNER,
  runnerCreated: true,
  failClosedDefault: true,
  runnerCanExecuteCurrentCacheNow: false,
  cacheLayoutReconciliationRequired: true,
  vmCreated: false,
  dependencyInstallRun: false,
  modelImportRun: false,
  modelInferenceRun: false,
  generatedFramesCreated: false,
  generatedVideoCreated: false,
  mediaProcessingRun: false,
  ffmpegRun: false,
  supabaseTouched: false,
  sqlExecuted: false,
  providerCalled: false,
  workerDispatched: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: EXPECTED_NEXT_PROMPT
}, null, 2));
