#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION =
  "ai_video_broll_wan_model_mount_source_install_plan_ready_no_inference";
const NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-4: author no-inference Wan mount validator, no model import";
const WAN_REVISION = "37ec512624d61f7aa208f7ea8140a131f93afc9a";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-wan-model-mount-source-install-plan.md",
  "docs/ai-video-broll-generation-model-weight-evidence-alignment.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "server/model-weights/model-weight-manifest-templates.ts",
  "scripts/validation/ai-video-broll-wan-mount-source-install-plan-diagnostics.mjs",
  "package.json"
];

const REQUIRED_REQUIREMENTS = [
  "torch==2.12.1",
  "torchvision==0.27.1",
  "diffusers==0.38.0",
  "transformers==5.12.1",
  "accelerate==1.14.0",
  "safetensors==0.8.0",
  "huggingface-hub==1.21.0",
  "sentencepiece==0.2.1",
  "protobuf==7.35.1",
  "einops==0.8.2",
  "numpy==2.5.0",
  "pillow==12.2.0"
];

const UNSAFE_DOC_PATTERNS = [
  ["copy/install true claim", /\b(modelWeightsCopiedNow|modelMountCreatedNow|dependencyInstalledNow|sourceRepositoryClonedNow)\b\s*[:=]\s*(true|"true")/i],
  ["runtime true claim", /\b(modelImportsRun|modelInferenceRun|generatedVideoCreated|generatedAssetsCreated|vmCreated|dockerRun|gcpMutationCreated|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|storageUploaded|signedUrlsCreated|publicArtifactsCreated|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i],
  ["generated local fixture claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
  ["dry run passed claim", /\bdry_run_passed\s+(claimed|true|passed)/i],
  ["secret assignment", /\b(api[_-]?key|service[_-]?role|secret|password)\s*[:=]\s*['"][^'"]+/i],
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|Expires=|Signature=|Policy=|Key-Pair-Id=)/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i]
];

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-wan-mount-source-install-plan:diagnostics"] ===
    "node scripts/validation/ai-video-broll-wan-mount-source-install-plan-diagnostics.mjs",
  "package.json must expose ai-video-broll-wan-mount-source-install-plan:diagnostics"
);

const doc = read("docs/ai-video-broll-generation-wan-model-mount-source-install-plan.md");
const evidence = read("docs/ai-video-broll-generation-model-weight-evidence-alignment.md");
const manifest = read("docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md");
const runner = read("server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py");
const requirements = read("server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt");
const templates = read("server/model-weights/model-weight-manifest-templates.ts");

check(doc.includes(DECISION), "Mount/source-install plan decision mismatch");
check(doc.includes(NEXT_PROMPT), "Mount/source-install plan next prompt mismatch");
check(doc.includes("/opt/reeditpro/model-weights/ai-video-broll/wan2.1-t2v-1.3b/"), "Plan must define canonical /opt mount path");
check(doc.includes("/tmp/reeditpro-private-model-cache/"), "Plan must preserve proof runner cache prefix");
check(doc.includes("No copy, mount, symlink, upload, VM transfer, or cache mutation occurs"), "Plan must forbid copy/mount operations now");
check(doc.includes("No dependency is installed now"), "Plan must forbid dependency install now");
check(doc.includes("GPUS_ALL_REGIONS"), "Plan must preserve global GPU quota blocker");
check(doc.includes("original Wan runtime-essential layout"), "Plan must record current cache layout blocker");

check(evidence.includes(WAN_REVISION), "Evidence alignment doc must include Wan revision");
check(manifest.includes(WAN_REVISION), "Controlled manifest must include Wan revision");
check(templates.includes(`Wan-AI/Wan2.1-T2V-1.3B@${WAN_REVISION}`), "Template must remain aligned to Wan revision");

check(runner.includes('MODEL_CACHE_PREFIX = Path("/tmp/reeditpro-private-model-cache")'), "Runner must still use private proof cache prefix");
check(runner.includes('HF_HOME_PREFIX = Path("/tmp/reeditpro-private-hf-home")'), "Runner must still require private HF home");
check(runner.includes('"HF_HUB_OFFLINE": "1"'), "Runner must require HF offline env");
check(runner.includes('"TRANSFORMERS_OFFLINE": "1"'), "Runner must require transformers offline env");
check(runner.includes('"DIFFUSERS_OFFLINE": "1"'), "Runner must require diffusers offline env");
check(runner.includes("future_execution_flag_present=bool(args.allow_approved_local_proof_execution)"), "Runner must expose explicit future execution flag metadata");
check(runner.includes("proof_execution_allowed_by_this_source=("), "Runner must calculate proof execution allowance from validated guards");
check(runner.includes("if not validation.proof_execution_allowed_by_this_source"), "Runner must block execution when allowance is false");

for (const requirement of REQUIRED_REQUIREMENTS) {
  check(requirements.includes(requirement), `Missing pinned requirement: ${requirement}`);
  check(doc.includes(requirement), `Plan must document pinned requirement: ${requirement}`);
}

const findings = [];
for (const file of ["docs/ai-video-broll-generation-wan-model-mount-source-install-plan.md"]) {
  const text = read(file);
  for (const [name, pattern] of UNSAFE_DOC_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(`${name}: ${file}`);
    }
  }
}
check(findings.length === 0, `Unsafe mount/source-install plan text found: ${findings.join("; ")}`);

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  canonicalMountPath: "/opt/reeditpro/model-weights/ai-video-broll/wan2.1-t2v-1.3b/",
  proofCachePrefix: "/tmp/reeditpro-private-model-cache/",
  runnerStillFailClosed: true,
  offlineEnvironmentRequired: true,
  pinnedRequirementCount: REQUIRED_REQUIREMENTS.length,
  modelWeightsCopiedNow: false,
  modelMountCreatedNow: false,
  dependencyInstalledNow: false,
  sourceRepositoryClonedNow: false,
  modelImportsRun: false,
  modelInferenceRun: false,
  generatedVideoCreated: false,
  generatedAssetsCreated: false,
  vmCreated: false,
  dockerRun: false,
  gcpMutationCreated: false,
  providerCallsMade: false,
  workersDispatched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  storageUploaded: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  creditMutationCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
