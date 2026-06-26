#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_revision_checksum_plan_ready_no_download";
const SOURCE_REVISION = "cc594898137f460bfe9f0759e9844b3ce807cfb5";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_2: controlled private Qwen2.5-VL model weight download manifest, no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-revision-checksum-plan.md",
  "docs/qwen2-5-vl-7b-stack-tool-integration.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-model-revision-checksum-plan.md",
  "server/model-weights/model-weight-manifest-templates.ts",
  "scripts/validation/qwen2-5-vl-7b-stack-tool-diagnostics.mjs",
  "scripts/validation/qwen2-5-vl-7b-revision-checksum-plan-diagnostics.mjs",
  "package.json"
];

const EXPECTED_FILES = [
  [".gitattributes", 1519],
  ["README.md", 18574],
  ["chat_template.json", 1050],
  ["config.json", 1374],
  ["generation_config.json", 216],
  ["merges.txt", 1671839],
  ["model-00001-of-00005.safetensors", 3900233256, "e97b877e47fde53a6c6e77aafb36e58e91ee9d95c4a3eeac6f1b5c0e6a1c986e"],
  ["model-00002-of-00005.safetensors", 3864726320, "a9a300a43b4724eee2abe7c18ceb26768d0ab011eb0cad19d9bfd2476a24d024"],
  ["model-00003-of-00005.safetensors", 3864726424, "111223d173e00bbee81cba1216fad28668df3476706b7fd26f4d5b50f8b3a507"],
  ["model-00004-of-00005.safetensors", 3864733680, "ef47f634fa57d46ee134edcc09f34085a47da1e16c12a2abe0d67118be6d72ed"],
  ["model-00005-of-00005.safetensors", 1089994880, "0c859795ad3a627a9b95bcb762e059d5b768a4a36fdd4affeff269d93fdecc67"],
  ["model.safetensors.index.json", 57619],
  ["preprocessor_config.json", 350],
  ["tokenizer.json", 7031645],
  ["tokenizer_config.json", 5702],
  ["vocab.json", 2776833]
];

const FALSE_FLAGS = [
  "modelWeightsDownloaded",
  "modelImportsRun",
  "modelInferenceRun",
  "generatedVideoCreated",
  "generatedAssetsCreated",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
  "gcpMutationCreated",
  "dockerRun",
  "publicArtifactsCreated",
  "signedUrlsCreated",
  "creditMutationCreated",
  "betaUnlocked",
  "productionUnlocked",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed"
];

const FORBIDDEN_PATTERNS = [
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ["credential assignment", /\b(api[_-]?key|service[_-]?role|secret|password|token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["storage URI", /\b(gs:\/\/|s3:\/\/|storage\.googleapis\.com\/)/i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["runtime-ready true claim", /\b(runtimeReadinessClaimed|productionReady|betaReady)\b\s*[:=]\s*(true|"true")/i],
  ["download true claim", /\b(downloadedNow|localCacheCreatedNow|localChecksumVerifiedNow|modelImportAllowed|modelInferenceAllowed)\b\s*[:=]\s*(true|"true")/i]
];

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function includesAll(text, values, label) {
  for (const value of values) {
    check(text.includes(value), `${label} missing ${value}`);
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseJsonBlock(text, blockName) {
  const pattern = new RegExp("```json " + escapeRegex(blockName) + "\\n([\\s\\S]*?)\\n```");
  const match = text.match(pattern);
  check(Boolean(match), `Missing JSON block ${blockName}`);
  return JSON.parse(match[1]);
}

function assertNoUnsafeClaims(relativePath) {
  const text = read(relativePath);
  const findings = [];
  for (const [name, pattern] of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(name);
    }
  }
  check(findings.length === 0, `Unsafe claim or forbidden value in ${relativePath}: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["qwen2-5-vl-7b-revision-checksum-plan:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-revision-checksum-plan-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-revision-checksum-plan:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-revision-checksum-plan.md");
const stackDoc = read("docs/qwen2-5-vl-7b-stack-tool-integration.md");
const nextPromptDoc = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-controlled-private-download-manifest.md");
const manifestTemplates = read("server/model-weights/model-weight-manifest-templates.ts");
const stackDiagnostic = read("scripts/validation/qwen2-5-vl-7b-stack-tool-diagnostics.mjs");

includesAll(doc, [
  DECISION,
  SOURCE_REVISION,
  "license:apache-2.0",
  "image-text-to-text",
  "Download performed now: false",
  "Local checksum coverage claimed now: false",
  "NVIDIA L4 / Google Cloud G2 first",
  NEXT_PROMPT
], "revision checksum doc");
includesAll(stackDoc, ["Qwen2.5-VL 7B Stack Tool Integration", "Selected first GPU target: `nvidia_l4`"], "stack doc");
includesAll(nextPromptDoc, [
  NEXT_PROMPT,
  "Do not run inference.",
  "Recompute local sha256 for every downloaded file.",
  "Private cache exists outside the repo."
], "next prompt doc");
includesAll(manifestTemplates, [
  "id: 'qwen2_5_vl_7b_model'",
  `Qwen/Qwen2.5-VL-7B-Instruct@${SOURCE_REVISION}`,
  "docs/qwen2-5-vl-7b-revision-checksum-plan.md",
  "must not claim local checksum coverage"
], "model weight template");
includesAll(stackDiagnostic, [
  `Qwen/Qwen2.5-VL-7B-Instruct@${SOURCE_REVISION}`,
  "qwen2-5-vl-7b-stack-tool:diagnostics"
], "updated stack diagnostic");

const plan = parseJsonBlock(doc, "qwen2-5-vl-7b-revision-checksum-plan");
check(plan.decision === DECISION, "Plan decision mismatch");
check(plan.modelId === "Qwen/Qwen2.5-VL-7B-Instruct", "Plan model id mismatch");
check(plan.sourceRevision === SOURCE_REVISION, "Plan source revision mismatch");
check(plan.licenseTag === "license:apache-2.0", "Plan license tag mismatch");
check(plan.pipelineTag === "image-text-to-text", "Plan pipeline tag mismatch");
check(plan.checksumAlgorithm === "sha256", "Plan checksum algorithm mismatch");
check(plan.downloadedNow === false, "Plan must not claim download");
check(plan.localCacheCreatedNow === false, "Plan must not claim local cache");
check(plan.localChecksumVerifiedNow === false, "Plan must not claim local checksum verification");
check(plan.modelImportAllowed === false, "Plan must block model import");
check(plan.modelInferenceAllowed === false, "Plan must block inference");
check(plan.weightShardCount === 5, "Plan must include five weight shards");
check(plan.files.length === EXPECTED_FILES.length, "Plan file count mismatch");

const total = EXPECTED_FILES.reduce((sum, [, bytes]) => sum + bytes, 0);
check(plan.plannedByteTotal === total, "Plan byte total mismatch");

const filesByPath = new Map(plan.files.map((file) => [file.relativePath, file]));
for (const [relativePath, bytes, lfsSha256] of EXPECTED_FILES) {
  const file = filesByPath.get(relativePath);
  check(Boolean(file), `Missing planned file ${relativePath}`);
  check(file.bytes === bytes, `Byte mismatch for ${relativePath}`);
  check(file.requiresLocalSha256AfterDownload === true, `Local sha256 requirement missing for ${relativePath}`);
  if (lfsSha256) {
    check(file.lfsSha256 === lfsSha256, `LFS sha256 mismatch for ${relativePath}`);
    check(file.role === "model_weight_shard", `Weight shard role mismatch for ${relativePath}`);
  }
}

for (const flag of FALSE_FLAGS) {
  check(plan.runtimeFlags?.[flag] === false, `runtimeFlags.${flag} must be false`);
}

assertNoUnsafeClaims("docs/qwen2-5-vl-7b-revision-checksum-plan.md");
assertNoUnsafeClaims("docs/implementation-prompts/prompt-qwen2-5-vl-7b-controlled-private-download-manifest.md");

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  modelId: plan.modelId,
  sourceRevision: plan.sourceRevision,
  licenseTag: plan.licenseTag,
  plannedFileCount: plan.files.length,
  weightShardCount: plan.weightShardCount,
  plannedByteTotal: plan.plannedByteTotal,
  modelWeightsDownloaded: false,
  localChecksumVerifiedNow: false,
  modelImportsRun: false,
  modelInferenceRun: false,
  generatedVideoCreated: false,
  generatedAssetsCreated: false,
  gcpMutationCreated: false,
  workersDispatched: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
