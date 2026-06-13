import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-visual-review-human-review-packet.md",
  "docs/track-a/track-a-visual-review-artifact-index.md",
  "docs/track-a/track-a-visual-review-quality-rubric.md",
  "docs/track-a/track-a-visual-review-pass-fail-schema.md",
  "docs/track-a/track-a-visual-review-privacy-security-checklist.md",
  "docs/track-a/track-a-visual-review-reviewer-instructions.md",
  "docs/track-a/track-a-visual-review-gap-and-blocker-map.md",
  "docs/track-a/track-a-visual-review-next-phase-plan.md",
  "docs/activation-phase-tracka-visual-review-1-results.md",
  "docs/implementation-prompts/prompt-tracka-visual-review-2-record-human-review-outcome.md",
];

const sourceFiles = [
  "docs/track-a/track-a-current-source-visual-video-evidence-packet.md",
  "docs/track-a/track-a-current-source-evidence-matrix.md",
  "docs/track-a/track-a-current-source-artifact-reference-manifest.md",
  "docs/track-a/track-a-current-source-visual-review-packet-plan.md",
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

const requiredTerms = [
  "#390",
  "tracka_visual_review_1_packet_passed_ready_for_tracka_visual_review_2",
  "ready_for_TRACKA_VISUAL_REVIEW_2_record_human_review_outcome",
  "blocked_pending_human_review_outcome_and_explicit_closure_target_list",
  "artifact_ref_not_recorded_in_current_source",
  "Use approved internal private artifact access path only; no signed URL source-of-truth.",
  "overallDecision",
  "approvedNextPhase",
  "explicitNonApprovals",
  "docs_only",
  "blocked_current_branch_missing_sync_layer",
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

const contentsByPath = new Map([...requiredFiles, ...sourceFiles].map((path) => [path, readRequired(path)]));
const newDocs = requiredFiles.map((path) => contentsByPath.get(path) ?? "").join("\n\n");
const allDocs = [...contentsByPath.values()].join("\n\n");

for (const [path, text] of contentsByPath) {
  if (!text.includes(noScope)) {
    failures.push(`Missing exact no-scope statement: ${path}`);
  }
}

for (const capabilityId of capabilityIds) {
  if (!newDocs.includes(capabilityId)) {
    failures.push(`Missing capability ID in visual review packet: ${capabilityId}`);
  }
}

for (const term of requiredTerms) {
  if (!newDocs.includes(term)) {
    failures.push(`Missing required visual review evidence term: ${term}`);
  }
}

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:visual-review-packet:diagnostics"')) {
  failures.push("Missing package.json visual review diagnostics script");
}

const forbiddenPositiveClaims = [
  /visual review (completed|passed|approved)/i,
  /artifact access:\s*(completed|enabled|approved|true)/i,
  /artifact download:\s*(completed|enabled|approved|true)/i,
  /GCS access:\s*(completed|enabled|approved|true)/i,
  /GCS upload:\s*(completed|enabled|approved|true)/i,
  /storage transfer:\s*(completed|enabled|approved|true)/i,
  /signed URL (creation|claim):\s*(completed|enabled|approved|true)/i,
  /signed URL source-of-truth:\s*(enabled|approved|true)/i,
  /public artifact (creation|claim):\s*(completed|enabled|approved|true)/i,
  /public artifact source-of-truth:\s*(enabled|approved|true)/i,
  /runtime execution:\s*(enabled|approved|true)/i,
  /Track A runtime execution:\s*(enabled|approved|true)/i,
  /final delivery:\s*(enabled|approved|true)/i,
  /production unlock:\s*(enabled|approved|true)/i,
  /external beta unlock:\s*(enabled|approved|true)/i,
  /internal beta unlock:\s*(enabled|approved|true)/i,
  /Supabase mutation:\s*(enabled|approved|true)/i,
  /SQL executed:\s*yes/i,
  /migration deployed:\s*yes/i,
  /PR (merge|close|retarget|comment):\s*(completed|enabled|approved|true)/i,
  /merged PR #[0-9]+/i,
  /closed PR #[0-9]+/i,
  /retargeted PR #[0-9]+/i,
];

for (const pattern of forbiddenPositiveClaims) {
  if (pattern.test(newDocs)) {
    failures.push(`Forbidden positive claim matched: ${pattern}`);
  }
}

if (!allDocs.includes("tracka_current_source_1_passed_ready_for_tracka_visual_review_1")) {
  failures.push("Missing #390 current-source decision in source docs");
}

if (failures.length > 0) {
  console.error("TRACKA-VISUAL-REVIEW-1 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-VISUAL-REVIEW-1 diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
console.log(`Checked capability IDs: ${capabilityIds.length}`);
