import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-visual-review-2a-ai-assisted-private-review-intake.md",
  "docs/track-a/track-a-visual-review-2a-private-artifact-access-plan.md",
  "docs/track-a/track-a-visual-review-2a-checklist-response-schema.md",
  "docs/track-a/track-a-visual-review-2a-evidence-needed-register.md",
  "docs/track-a/track-a-visual-review-2a-review-criteria.md",
  "docs/track-a/track-a-visual-review-2a-next-phase-plan.md",
  "docs/activation-phase-tracka-visual-review-2a-results.md",
  "docs/implementation-prompts/prompt-tracka-visual-review-2b-record-ai-assisted-review-outcome.md",
];

const sourceFiles = [
  "docs/track-a/track-a-visual-review-human-review-packet.md",
  "docs/track-a/track-a-visual-review-artifact-index.md",
  "docs/track-a/track-a-visual-review-pass-fail-schema.md",
  "docs/track-a/track-a-current-source-artifact-reference-manifest.md",
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
  "AI-assisted visual review can proceed: `false`",
  "blocked_pending_uploaded_frames_or_approved_private_artifact_access_bundle",
  "not_reviewed_no_pass_claim",
  "TRACKA-VISUAL-REVIEW-2B",
  "No uploaded representative frames or videos were provided",
  "no signed URL source-of-truth",
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

for (const [path, text] of contentsByPath) {
  if (!text.includes(noScope)) {
    failures.push(`Missing exact no-scope statement: ${path}`);
  }
}

for (const capabilityId of capabilityIds) {
  if (!newDocs.includes(capabilityId)) {
    failures.push(`Missing capability ID: ${capabilityId}`);
  }
}

for (const term of requiredTerms) {
  if (!newDocs.includes(term)) {
    failures.push(`Missing required intake evidence term: ${term}`);
  }
}

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:visual-review-2a-intake:diagnostics"')) {
  failures.push("Missing package.json diagnostics script");
}

const forbiddenPositiveClaims = [
  /AI-assisted visual review can proceed:\s*`?true`?/i,
  /review pass status:\s*`?(passed|pass|approved)`?/i,
  /visual review (completed|passed|approved)/i,
  /artifact access:\s*(completed|enabled|approved|true)/i,
  /artifact download:\s*(completed|enabled|approved|true)/i,
  /broad GCS access:\s*(completed|enabled|approved|true)/i,
  /GCS upload:\s*(completed|enabled|approved|true)/i,
  /storage transfer:\s*(completed|enabled|approved|true)/i,
  /signed URL (creation|claim):\s*(completed|enabled|approved|true)/i,
  /signed URL source-of-truth:\s*(enabled|approved|true)/i,
  /public artifact (creation|claim):\s*(completed|enabled|approved|true)/i,
  /Track A runtime execution:\s*(enabled|approved|true)/i,
  /FFmpeg execution:\s*(enabled|approved|true)/i,
  /Remotion execution:\s*(enabled|approved|true)/i,
  /libass execution:\s*(enabled|approved|true)/i,
  /OTIO execution:\s*(enabled|approved|true)/i,
  /Kornia execution:\s*(enabled|approved|true)/i,
  /BiRefNet execution:\s*(enabled|approved|true)/i,
  /SAM2 execution:\s*(enabled|approved|true)/i,
  /Real-ESRGAN execution:\s*(enabled|approved|true)/i,
  /FILM execution:\s*(enabled|approved|true)/i,
  /Supabase mutation:\s*(enabled|approved|true)/i,
  /SQL executed:\s*yes/i,
  /production unlock:\s*(enabled|approved|true)/i,
  /external beta unlock:\s*(enabled|approved|true)/i,
  /internal beta unlock:\s*(enabled|approved|true)/i,
  /final delivery:\s*(enabled|approved|true)/i,
];

for (const pattern of forbiddenPositiveClaims) {
  if (pattern.test(newDocs)) {
    failures.push(`Forbidden positive claim matched: ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error("TRACKA-VISUAL-REVIEW-2A diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-VISUAL-REVIEW-2A diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
console.log(`Checked capability IDs: ${capabilityIds.length}`);
