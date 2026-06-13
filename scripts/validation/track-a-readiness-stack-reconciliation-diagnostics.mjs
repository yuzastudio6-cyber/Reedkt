import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-visual-video-readiness-stack-reconciliation.md",
  "docs/track-a/track-a-tool-status-matrix.md",
  "docs/track-a/track-a-pr-stack-merge-plan.md",
  "docs/track-a/track-a-superseded-pr-register.md",
  "docs/track-a/track-a-current-source-integration-plan.md",
  "docs/track-a/track-a-internal-private-e2e-gap-map.md",
  "docs/track-a/track-a-runtime-blocked-scope-register.md",
  "docs/track-a/track-a-next-phase-plan.md",
  "docs/activation-phase-tracka-recon-0-results.md",
  "docs/implementation-prompts/prompt-tracka-merge-1-visual-video-stack-merge.md",
];

const matrixRows = [
  "BiRefNet",
  "SAM2",
  "Real-ESRGAN",
  "FILM",
  "OpenColorIO",
  "OpenImageIO",
  "Kornia",
  "libass",
  "Remotion",
  "OpenTimelineIO",
  "FFmpeg",
  "FFprobe",
  "full visual-video private E2E",
  "Track A readiness closure",
  "Track A TOOL-STUDY-0 routing contract",
];

const prNumbers = [
  18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 34, 35, 42, 43, 54, 55, 58, 60, 63, 65, 67, 68, 73, 75, 77, 80, 82, 83, 99, 364,
];

const blockedScopes = [
  "Final delivery",
  "Public artifacts",
  "Signed URLs as source-of-truth",
  "Production",
  "External beta",
  "Internal beta",
  "Paid production",
  "Broad real media",
  "Arbitrary real/user media",
  "Provider/model calls",
  "Track B runtime",
  "Worker execution",
  "Tool-route execution",
  "BiRefNet runtime",
  "SAM2 runtime",
  "Real-ESRGAN runtime",
  "FILM runtime",
  "Kornia runtime",
  "OpenColorIO runtime",
  "OpenImageIO runtime",
  "libass runtime",
  "Remotion runtime",
  "OpenTimelineIO runtime",
  "FFmpeg runtime",
  "FFprobe runtime",
  "Full 4K/full-video broad processing",
  "Raw prompt execution",
];

const noScope =
  "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.";

const failures = [];

function readRequired(path) {
  const absolute = join(root, path);
  if (!existsSync(absolute)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

const contentsByPath = new Map(requiredFiles.map((path) => [path, readRequired(path)]));
const allDocs = [...contentsByPath.values()].join("\n\n");

for (const row of matrixRows) {
  if (!contentsByPath.get("docs/track-a/track-a-tool-status-matrix.md")?.includes(row)) {
    failures.push(`Missing status matrix row: ${row}`);
  }
}

const mergePlan = contentsByPath.get("docs/track-a/track-a-pr-stack-merge-plan.md") ?? "";
for (const pr of prNumbers) {
  if (!mergePlan.includes(`#${pr}`)) {
    failures.push(`Missing PR classification: #${pr}`);
  }
}

const blockedRegister = contentsByPath.get("docs/track-a/track-a-runtime-blocked-scope-register.md") ?? "";
for (const scope of blockedScopes) {
  if (!blockedRegister.includes(scope)) {
    failures.push(`Missing blocked-scope entry: ${scope}`);
  }
}

if (!allDocs.includes("docs_only")) {
  failures.push("Missing Supabase docs_only classification");
}

if (!allDocs.includes("blocked_current_branch_missing_sync_layer")) {
  failures.push("Missing Supabase milestone sync blocker");
}

if (!allDocs.includes("tracka_recon_0_passed_ready_for_tracka_merge_1_visual_video_stack_merge_review")) {
  failures.push("Missing TRACKA-RECON-0 decision");
}

if (!allDocs.includes("TRACKA-MERGE-1")) {
  failures.push("Missing TRACKA-MERGE-1 next phase reference");
}

for (const [path, text] of contentsByPath) {
  if (!text.includes(noScope)) {
    failures.push(`Missing exact no-scope statement: ${path}`);
  }
}

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:readiness-stack-reconciliation:diagnostics"')) {
  failures.push("Missing package.json diagnostics script");
}

const forbiddenPositiveClaims = [
  /runtime execution:\s*enabled/i,
  /tool execution:\s*enabled/i,
  /worker execution:\s*enabled/i,
  /route execution:\s*enabled/i,
  /provider call:\s*enabled/i,
  /model call:\s*enabled/i,
  /supabase mutation:\s*enabled/i,
  /sql executed:\s*yes/i,
  /migration deployed:\s*yes/i,
  /gcs upload:\s*enabled/i,
  /storage transfer:\s*enabled/i,
  /signed url creation:\s*enabled/i,
  /public artifact creation:\s*enabled/i,
  /internal beta unlock:\s*enabled/i,
  /external beta unlock:\s*enabled/i,
  /production unlock:\s*enabled/i,
  /dependency mutation:\s*enabled/i,
  /final render\/export:\s*enabled/i,
  /birefnet runtime:\s*enabled/i,
  /sam2 runtime:\s*enabled/i,
  /real-esrgan runtime:\s*enabled/i,
  /film runtime:\s*enabled/i,
  /kornia runtime:\s*enabled/i,
  /opencolorio runtime:\s*enabled/i,
  /openimageio runtime:\s*enabled/i,
  /libass runtime:\s*enabled/i,
  /remotion runtime:\s*enabled/i,
  /opentimelineio runtime:\s*enabled/i,
  /ffmpeg runtime:\s*enabled/i,
  /ffprobe runtime:\s*enabled/i,
  /tracka-recon-0 merged pr/i,
  /tracka-recon-0 closed pr/i,
  /tracka-recon-0 retargeted pr/i,
];

for (const pattern of forbiddenPositiveClaims) {
  if (pattern.test(allDocs)) {
    failures.push(`Forbidden positive execution/mutation claim matched: ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error("TRACKA-RECON-0 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-RECON-0 diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked matrix rows: ${matrixRows.length}`);
console.log(`Checked PR classifications: ${prNumbers.length}`);
console.log(`Checked blocked scopes: ${blockedScopes.length}`);
