#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_controlled_private_download_verified_no_inference";
const SOURCE_REVISION = "cc594898137f460bfe9f0759e9844b3ce807cfb5";
const CACHE_PATH =
  "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_3: private Qwen2.5-VL model loader import gate, no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "docs/qwen2-5-vl-7b-revision-checksum-plan.md",
  "docs/qwen2-5-vl-7b-stack-tool-integration.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-private-loader-import-gate.md",
  "server/model-weights/qwen2-5-vl-controlled-private-download-manifest.ts",
  "server/model-weights/model-weight-manifest-templates.ts",
  "server/model-weights/index.ts",
  "scripts/validation/qwen2-5-vl-7b-controlled-private-download-manifest-diagnostics.mjs",
  "package.json"
];

const EXPECTED_FILES = [
  [".gitattributes", 1519, "11ad7efa24975ee4b0c3c3a38ed18737f0658a5f75a0a96787b576a78a023361"],
  ["README.md", 18574, "1fa65dbb08bc9ffe0b020409c8686f08b23008c5a68554353305fd2de6f2b81e"],
  ["chat_template.json", 1050, "ad60d90252ed0b0705ba14e2d0ad0fec0beac1ea955642b54059b36052d8bc96"],
  ["config.json", 1374, "77d9ec7321cc572e3579e2c84799c9cadaded63c49ce93b101733349fc330c43"],
  ["generation_config.json", 216, "0a3aea82869fe29f20dc95ccf3e2bcff380eca1f5ad6447a4a4b37110b08e43e"],
  ["merges.txt", 1671839, "599bab54075088774b1733fde865d5bd747cbcc7a547c5bc12610e874e26f5e3"],
  ["model-00001-of-00005.safetensors", 3900233256, "e97b877e47fde53a6c6e77aafb36e58e91ee9d95c4a3eeac6f1b5c0e6a1c986e", true],
  ["model-00002-of-00005.safetensors", 3864726320, "a9a300a43b4724eee2abe7c18ceb26768d0ab011eb0cad19d9bfd2476a24d024", true],
  ["model-00003-of-00005.safetensors", 3864726424, "111223d173e00bbee81cba1216fad28668df3476706b7fd26f4d5b50f8b3a507", true],
  ["model-00004-of-00005.safetensors", 3864733680, "ef47f634fa57d46ee134edcc09f34085a47da1e16c12a2abe0d67118be6d72ed", true],
  ["model-00005-of-00005.safetensors", 1089994880, "0c859795ad3a627a9b95bcb762e059d5b768a4a36fdd4affeff269d93fdecc67", true],
  ["model.safetensors.index.json", 57619, "73b333b0b16e5286ddba615d2caebcd495cf7e616f52eb217a81781393d79de9"],
  ["preprocessor_config.json", 350, "f2058c716eef96ccaed1cc1e2d0c08306b62586d535b28d9d08e691b2fab7ca0"],
  ["tokenizer.json", 7031645, "c0382117ea329cdf097041132f6d735924b697924d6f6fc3945713e96ce87539"],
  ["tokenizer_config.json", 5702, "4abd3520120e266da84c0864fee064d1fb10806f02225911a47253dd38dc5f56"],
  ["vocab.json", 2776833, "ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910"]
];

const FALSE_RUNTIME_FLAGS = [
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
  ["credential assignment", /\b(api[_-]?key|service[_-]?role|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["storage URI", /\b(gs:\/\/|s3:\/\/|storage\.googleapis\.com\/)/i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["runtime-ready true claim", /\b(runtimeReadinessClaimed|productionReady|betaReady)\b\s*[:=]\s*(true|"true")/i],
  ["inference true claim", /\b(modelImportsRun|modelInferenceRun|generatedVideoCreated|generatedAssetsCreated|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|gcpMutationCreated|dockerRun|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i]
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

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["qwen2-5-vl-7b-controlled-private-download-manifest:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-controlled-private-download-manifest-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-controlled-private-download-manifest:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-controlled-private-download-manifest.md");
const spec = read("server/model-weights/qwen2-5-vl-controlled-private-download-manifest.ts");
const templates = read("server/model-weights/model-weight-manifest-templates.ts");
const index = read("server/model-weights/index.ts");
const nextPromptDoc = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-private-loader-import-gate.md");

includesAll(doc, [
  DECISION,
  SOURCE_REVISION,
  "license:apache-2.0",
  CACHE_PATH,
  "File count: `16`",
  "Weight shard count: `5`",
  "Total size bytes: `16595981281`",
  "Checksum manifest aggregate SHA-256: `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b`",
  "modelWeightsDownloaded=true",
  "modelImportsRun=false",
  "modelInferenceRun=false",
  "First GPU target: `nvidia_l4_google_cloud_g2_first`",
  "Recommended initial VM shape: `g2-standard-8`",
  "Wan remains the primary generated B-roll route",
  NEXT_PROMPT
], "controlled download doc");

includesAll(spec, [
  "QWEN2_5_VL_7B_CONTROLLED_PRIVATE_DOWNLOAD_MANIFEST",
  DECISION,
  SOURCE_REVISION,
  CACHE_PATH,
  "modelWeightsDownloaded: true",
  "privateCacheVerified: true",
  "localChecksumVerified: true",
  "templateChecksumFieldAllowed: false",
  "firstCostFriendlyGpuTarget: 'nvidia_l4_google_cloud_g2_first'",
  "recommendedInitialVmShape: 'g2-standard-8'",
  NEXT_PROMPT
], "controlled download spec");

includesAll(templates, [
  "docs/qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "private cache weights are downloaded and checksummed",
  "no model import or inference is approved",
  "must not claim local checksum coverage in the template checksum field"
], "model weight template update");

includesAll(index, ["qwen2-5-vl-controlled-private-download-manifest"], "model weight export surface");
includesAll(nextPromptDoc, [
  NEXT_PROMPT,
  "Do not run inference.",
  "Auto-download remains blocked.",
  "Qwen remains ranked as visual understanding/planning/QA"
], "next prompt doc");

const relativePathCount = (spec.match(/relativePath: '/g) ?? []).length;
check(relativePathCount === EXPECTED_FILES.length, `Spec file count mismatch: ${relativePathCount}`);

const totalBytes = EXPECTED_FILES.reduce((sum, [, size]) => sum + size, 0);
check(totalBytes === 16595981281, "Expected byte total mismatch");

for (const [relativePath, size, sha256, isWeightShard] of EXPECTED_FILES) {
  includesAll(doc, [relativePath, String(size), sha256], `doc entry ${relativePath}`);
  includesAll(spec, [relativePath, `sizeBytes: ${size}`, sha256], `spec entry ${relativePath}`);
  if (isWeightShard) {
    includesAll(spec, [`remoteLfsSha256: '${sha256}'`, "remoteLfsSha256Matched: true"], `weight shard ${relativePath}`);
  }
}

for (const flag of FALSE_RUNTIME_FLAGS) {
  includesAll(doc, [`${flag}=false`], `doc false runtime flag ${flag}`);
  includesAll(spec, [`${flag}: false`], `spec false runtime flag ${flag}`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-private-loader-import-gate.md",
  "server/model-weights/qwen2-5-vl-controlled-private-download-manifest.ts"
]) {
  assertNoUnsafeClaims(file);
}

let privateCachePathAvailable = false;
let localCacheReverifiedNow = false;
if (fs.existsSync(CACHE_PATH)) {
  privateCachePathAvailable = true;
  for (const [relativePath, size, sha256] of EXPECTED_FILES) {
    const filePath = path.join(CACHE_PATH, relativePath);
    check(fs.existsSync(filePath), `Private cache missing ${relativePath}`);
    const stat = fs.statSync(filePath);
    check(stat.size === size, `Private cache size mismatch for ${relativePath}: ${stat.size}`);
    check(await sha256File(filePath) === sha256, `Private cache sha256 mismatch for ${relativePath}`);
  }
  localCacheReverifiedNow = true;
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  modelId: "Qwen/Qwen2.5-VL-7B-Instruct",
  sourceRevision: SOURCE_REVISION,
  plannedFileCount: EXPECTED_FILES.length,
  weightShardCount: 5,
  totalSizeBytes: totalBytes,
  checksumManifestSha256: "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b",
  modelWeightsDownloaded: true,
  privateCachePathAvailable,
  localCacheReverifiedNow,
  modelImportsRun: false,
  modelInferenceRun: false,
  generatedVideoCreated: false,
  generatedAssetsCreated: false,
  providerCallsMade: false,
  workersDispatched: false,
  selectedGpu: "nvidia_l4_google_cloud_g2_first",
  recommendedInitialVmShape: "g2-standard-8",
  nextPrompt: NEXT_PROMPT
}, null, 2));
