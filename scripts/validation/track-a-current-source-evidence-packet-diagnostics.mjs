import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-current-source-visual-video-evidence-packet.md",
  "docs/track-a/track-a-current-source-evidence-matrix.md",
  "docs/track-a/track-a-current-source-artifact-reference-manifest.md",
  "docs/track-a/track-a-current-source-tool-readiness-map.md",
  "docs/track-a/track-a-current-source-visual-review-packet-plan.md",
  "docs/track-a/track-a-current-source-private-e2e-revalidation-plan.md",
  "docs/track-a/track-a-current-source-old-pr-supersession-plan.md",
  "docs/track-a/track-a-current-source-gap-map.md",
  "docs/track-a/track-a-current-source-blocked-scope-register.md",
  "docs/activation-phase-tracka-current-source-1-results.md",
  "docs/implementation-prompts/prompt-tracka-visual-review-1-human-review-packet.md",
  "docs/implementation-prompts/prompt-tracka-oldstack-closure-1-supersede-historical-prs.md",
];

const capabilityIds = [
  "birefnet_masking",
  "sam2_segmentation",
  "real_esrgan_enhancement",
  "film_interpolation",
  "kornia_pro_color_image",
  "opencolorio_color_pipeline",
  "openimageio_image_io",
  "libass_caption_burnin",
  "remotion_render_preview",
  "opentimelineio_validation",
  "ffmpeg_render_hardening",
  "ffprobe_export_validation",
  "full_visual_video_private_e2e",
  "track_a_readiness_closure",
];

const prNumbers = [
  18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 34, 35, 42, 43, 54, 55, 58, 60, 63, 65, 67, 68, 73, 75, 77, 80, 82, 83, 99, 364, 383,
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

for (const [path, text] of contentsByPath) {
  if (!text.includes(noScope)) {
    failures.push(`Missing exact no-scope statement: ${path}`);
  }
}

const matrix = contentsByPath.get("docs/track-a/track-a-current-source-evidence-matrix.md") ?? "";
const artifactManifest = contentsByPath.get("docs/track-a/track-a-current-source-artifact-reference-manifest.md") ?? "";
const readinessMap = contentsByPath.get("docs/track-a/track-a-current-source-tool-readiness-map.md") ?? "";

for (const capabilityId of capabilityIds) {
  if (!matrix.includes(capabilityId)) {
    failures.push(`Missing evidence matrix capability ID: ${capabilityId}`);
  }
  if (!artifactManifest.includes(capabilityId)) {
    failures.push(`Missing artifact manifest capability ID: ${capabilityId}`);
  }
  if (!readinessMap.includes(capabilityId)) {
    failures.push(`Missing tool readiness capability ID: ${capabilityId}`);
  }
}

for (const pr of prNumbers) {
  if (!allDocs.includes(`#${pr}`)) {
    failures.push(`Missing PR reference: #${pr}`);
  }
}

for (const requiredText of [
  "tracka_current_source_1_passed_ready_for_tracka_visual_review_1",
  "ready_for_TRACKA_VISUAL_REVIEW_1_human_review_packet",
  "blocked_pending_visual_review_and_owner_approved_pr_closure_targets",
  "artifact_ref_not_recorded_in_current_source",
  "docs_only",
  "blocked_current_branch_missing_sync_layer",
  "Supabase environment touched: `none`",
  "SQL executed: `none`",
  "Migration deployed: `no`",
]) {
  if (!allDocs.includes(requiredText)) {
    failures.push(`Missing required evidence text: ${requiredText}`);
  }
}

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:current-source-evidence:diagnostics"')) {
  failures.push("Missing package.json diagnostics script");
}

const forbiddenPositiveClaims = [
  /TRACKA-CURRENT-SOURCE-1 (merged|closed|retargeted) PR/i,
  /PR was (merged|closed|retargeted) by TRACKA-CURRENT-SOURCE-1/i,
  /runtime execution:\s*enabled/i,
  /tool execution:\s*enabled/i,
  /worker execution:\s*enabled/i,
  /route execution:\s*enabled/i,
  /provider call:\s*enabled/i,
  /model call:\s*enabled/i,
  /media processing:\s*enabled/i,
  /GCS access:\s*enabled/i,
  /GCS upload:\s*enabled/i,
  /storage transfer:\s*enabled/i,
  /signed URL source-of-truth:\s*enabled/i,
  /public artifact source-of-truth:\s*enabled/i,
  /public artifact creation:\s*enabled/i,
  /Supabase mutation:\s*enabled/i,
  /SQL executed:\s*yes/i,
  /migration deployed:\s*yes/i,
  /internal beta unlock:\s*enabled/i,
  /external beta unlock:\s*enabled/i,
  /production unlock:\s*enabled/i,
  /dependency mutation:\s*enabled/i,
  /raw prompt execution:\s*enabled/i,
  /final render\/export:\s*enabled/i,
  /final render\/export execution:\s*enabled/i,
];

for (const pattern of forbiddenPositiveClaims) {
  if (pattern.test(allDocs)) {
    failures.push(`Forbidden positive execution/mutation claim matched: ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error("TRACKA-CURRENT-SOURCE-1 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-CURRENT-SOURCE-1 diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked capability IDs: ${capabilityIds.length}`);
console.log(`Checked PR references: ${prNumbers.length}`);
