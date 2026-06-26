#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION =
  "ai_video_broll_model_weight_evidence_alignment_wan_manifest_linked_runtime_blocked";
const NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-3: plan approved Wan model mount path and runtime source install review, no inference";
const WAN_REVISION = "37ec512624d61f7aa208f7ea8140a131f93afc9a";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-model-weight-evidence-alignment.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "docs/ai-video-broll-generation-tool-registry-owner-review.md",
  "server/model-weights/model-weight-manifest-templates.ts",
  "scripts/validation/ai-video-broll-model-weight-evidence-alignment-diagnostics.mjs",
  "scripts/validation/ai-video-broll-tool-registry-owner-review-diagnostics.mjs",
  "package.json"
];

const UNSAFE_DOC_PATTERNS = [
  ["download now claim", /\b(modelWeightsDownloadedNow|downloadedNow|modelWeightDownloadAllowed)\b\s*[:=]\s*(true|"true")/i],
  ["runtime true claim", /\b(dependencyInstalledNow|modelImportsRun|modelInferenceRun|generatedVideoCreated|generatedAssetsCreated|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|gcpMutationCreated|dockerRun|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i],
  ["dry run passed claim", /\bdry_run_passed\s+(claimed|true|passed)/i],
  ["generated local fixture claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
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

function requireBlock(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  check(start >= 0, `Missing block start: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  check(end > start, `Missing block end after ${startNeedle}: ${endNeedle}`);
  return text.slice(start, end);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-model-weight-evidence-alignment:diagnostics"] ===
    "node scripts/validation/ai-video-broll-model-weight-evidence-alignment-diagnostics.mjs",
  "package.json must expose ai-video-broll-model-weight-evidence-alignment:diagnostics"
);

const doc = read("docs/ai-video-broll-generation-model-weight-evidence-alignment.md");
const manifestDoc = read("docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md");
const ownerReview = read("docs/ai-video-broll-generation-tool-registry-owner-review.md");
const templates = read("server/model-weights/model-weight-manifest-templates.ts");
const wanBlock = requireBlock(templates, "id: 'wan_video_model'", "id: 'ltx_video_model'");
const ltxBlock = requireBlock(templates, "id: 'ltx_video_model'", "id: 'mochi_video_model'");
const mochiBlock = requireBlock(templates, "id: 'mochi_video_model'", "id: 'hunyuan_video_model'");
const hunyuanBlock = requireBlock(templates, "id: 'hunyuan_video_model'", "id: 'paddleocr_model'");

check(doc.includes(DECISION), "Evidence-alignment decision mismatch");
check(doc.includes(NEXT_PROMPT), "Evidence-alignment next prompt mismatch");
check(doc.includes(WAN_REVISION), "Evidence-alignment doc must include Wan revision");
check(doc.includes("still `needs_review`"), "Wan template must remain needs_review");
check(doc.includes("still not commercial-use approved"), "Wan template must remain non-commercial-use-approved");
check(doc.includes("controlled private cache outside the repo"), "Doc must preserve private outside-repo cache boundary");
check(ownerReview.includes("conditional_metadata_acceptance"), "Owner review must remain the source review packet");

check(manifestDoc.includes("Wan-AI/Wan2.1-T2V-1.3B"), "Controlled Wan manifest missing model id");
check(manifestDoc.includes(WAN_REVISION), "Controlled Wan manifest missing source revision");
check(manifestDoc.includes("downloadedFileCount"), "Controlled Wan manifest missing file-count evidence");
check(manifestDoc.includes("sha256"), "Controlled Wan manifest missing file checksums");

check(wanBlock.includes(`modelVersion: 'Wan-AI/Wan2.1-T2V-1.3B@${WAN_REVISION}'`), "Wan template must carry exact model/revision");
check(wanBlock.includes("Controlled cache evidence: docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md"), "Wan template must link controlled evidence doc");
check(wanBlock.includes("reviewStatus: 'needs_review'"), "Wan template must remain needs_review");
check(wanBlock.includes("commercialUseAllowed: false"), "Wan template must keep commercialUseAllowed false");
check(wanBlock.includes("commercialUseStatus: 'needs_review'"), "Wan template must keep commercialUseStatus needs_review");
check(!/\bchecksum\s*:/.test(wanBlock), "Wan template must not claim template checksum coverage");

check(ltxBlock.includes("modelVersion: 'placeholder-needs-review'"), "LTX template must remain placeholder needs review");
check(mochiBlock.includes("modelVersion: 'placeholder-needs-review'"), "Mochi template must remain placeholder needs review");
check(hunyuanBlock.includes("reviewStatus: 'blocked'"), "Hunyuan template must remain blocked");
check(hunyuanBlock.includes("commercialUseStatus: 'blocked'"), "Hunyuan template commercial status must remain blocked");

const findings = [];
for (const file of ["docs/ai-video-broll-generation-model-weight-evidence-alignment.md"]) {
  const text = read(file);
  for (const [name, pattern] of UNSAFE_DOC_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(`${name}: ${file}`);
    }
  }
}
check(findings.length === 0, `Unsafe evidence-alignment text found: ${findings.join("; ")}`);

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  wanModelVersionAligned: true,
  wanControlledManifestLinked: true,
  wanReviewStatus: "needs_review",
  wanCommercialUseAllowed: false,
  wanTemplateChecksumClaimed: false,
  ltxDeferred: true,
  mochiDeferred: true,
  hunyuanBlocked: true,
  modelWeightsDownloadedNow: false,
  dependencyInstalledNow: false,
  modelImportsRun: false,
  modelInferenceRun: false,
  generatedVideoCreated: false,
  generatedAssetsCreated: false,
  providerCallsMade: false,
  workersDispatched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  gcpMutationCreated: false,
  dockerRun: false,
  betaUnlocked: false,
  productionUnlocked: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
