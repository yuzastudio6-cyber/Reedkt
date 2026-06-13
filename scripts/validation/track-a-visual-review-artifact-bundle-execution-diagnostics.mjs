import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-visual-review-artifact-bundle-execution-result.md",
  "docs/track-a/track-a-visual-review-local-bundle-manifest.md",
  "docs/track-a/track-a-visual-review-local-bundle-checksums.md",
  "docs/track-a/track-a-visual-review-upload-to-chat-final-instructions.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-1r-gap-map.md",
  "docs/activation-phase-tracka-visual-review-artifact-bundle-1r-results.md",
  "docs/implementation-prompts/prompt-tracka-visual-review-2b-record-ai-assisted-review-outcome.md",
];

const sourceFiles = [
  "docs/track-a/track-a-visual-review-artifact-bundle-manifest.md",
  "docs/track-a/track-a-visual-review-artifact-access-policy.md",
  "docs/track-a/track-a-visual-review-upload-to-chat-instructions.md",
  "scripts/validation/track-a-visual-review-artifact-bundle.mjs",
];

const requiredTerms = [
  "tracka-visual-review-artifact-bundle1-20260613T195844",
  "#400",
  "completed_bounded_private_artifact_bundle_execution",
  "Private artifact access: `completed_bounded_allowlist`",
  "Local review bundle: `created`",
  "TRACKA-VISUAL-REVIEW-2B readiness: `ready_after_upload_of_copied_bundle_files_metadata_only`",
  "allowed exact object refs: `12`",
  "rejected prefix refs: `1`",
  "rejected missing refs: `1`",
  "copied files: `12`",
  "checksums_recorded",
  "created_with_12_files",
  "visual_pass_fail_blocked_pending_representative_frames_or_exact_visual_artifacts",
  "not_claimed",
  "docs_only",
];

const copiedFiles = [
  "tracka-bundle-birefnet-masking-phase33c-report.json",
  "tracka-bundle-sam2-segmentation-phase35f-report.json",
  "tracka-bundle-real-esrgan-enhancement-phase34d-report.json",
  "tracka-bundle-film-interpolation-phase38d-report.json",
  "tracka-bundle-opencolorio-color-pipeline-phase40d-report.json",
  "tracka-bundle-openimageio-image-io-phase40d-report.json",
  "tracka-bundle-libass-caption-burnin-phase45a-report.json",
  "tracka-bundle-opentimelineio-validation-phase45c-report.json",
  "tracka-bundle-ffmpeg-render-hardening-phase45d-report.json",
  "tracka-bundle-ffprobe-export-validation-ffprobe-export-validation.json",
  "tracka-bundle-full-visual-video-private-e2e-phase45e-report.json",
  "tracka-bundle-track-a-readiness-closure-phase45f-report.json",
];

const requiredCapabilities = [
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

const noScope =
  "No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/read/copy was allowed only for exact Track A review artifact refs explicitly allowlisted by the #400 bundle manifest.";

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

for (const path of requiredFiles) {
  const text = contentsByPath.get(path) ?? "";
  if (!text.includes(noScope)) {
    failures.push(`Missing exact no-scope statement: ${path}`);
  }
}

for (const term of requiredTerms) {
  if (!newDocs.includes(term)) {
    failures.push(`Missing required term: ${term}`);
  }
}

for (const file of copiedFiles) {
  if (!newDocs.includes(file)) {
    failures.push(`Missing copied file record: ${file}`);
  }
}

for (const capability of requiredCapabilities) {
  if (!newDocs.includes(capability)) {
    failures.push(`Missing capability: ${capability}`);
  }
}

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:visual-review-artifact-bundle-execution:diagnostics"')) {
  failures.push("Missing package script: track-a:visual-review-artifact-bundle-execution:diagnostics");
}

const forbiddenPositiveClaims = [
  /Visual pass\/fail outcome:\s*`?(passed|approved|completed)`?/i,
  /visual review:\s*`?(passed|approved)`?/i,
  /overall visual decision:\s*`?(passed|approved)`?/i,
  /signed URL creation:\s*(enabled|approved|true|completed)/i,
  /public artifact creation:\s*(enabled|approved|true|completed)/i,
  /GCS upload:\s*(enabled|approved|true|completed)/i,
  /bucket mutation:\s*(enabled|approved|true|completed)/i,
  /IAM mutation:\s*(enabled|approved|true|completed)/i,
  /Track A runtime execution:\s*(enabled|approved|true|completed)/i,
  /FFmpeg execution:\s*(enabled|approved|true|completed)/i,
  /Remotion execution:\s*(enabled|approved|true|completed)/i,
  /libass execution:\s*(enabled|approved|true|completed)/i,
  /OTIO execution:\s*(enabled|approved|true|completed)/i,
  /OpenColorIO execution:\s*(enabled|approved|true|completed)/i,
  /OpenImageIO execution:\s*(enabled|approved|true|completed)/i,
  /Kornia execution:\s*(enabled|approved|true|completed)/i,
  /BiRefNet execution:\s*(enabled|approved|true|completed)/i,
  /SAM2 execution:\s*(enabled|approved|true|completed)/i,
  /Real-ESRGAN execution:\s*(enabled|approved|true|completed)/i,
  /FILM execution:\s*(enabled|approved|true|completed)/i,
  /Supabase mutation:\s*(enabled|approved|true|completed)/i,
  /SQL executed:\s*yes/i,
  /production unlock:\s*(enabled|approved|true|completed)/i,
  /external beta unlock:\s*(enabled|approved|true|completed)/i,
  /internal beta unlock:\s*(enabled|approved|true|completed)/i,
  /final delivery:\s*(enabled|approved|true|completed)/i,
];

for (const pattern of forbiddenPositiveClaims) {
  if (pattern.test(newDocs)) {
    failures.push(`Forbidden positive claim matched: ${pattern}`);
  }
}

if (/\.(mp4|mov|webm|mkv|png|jpg|jpeg|gif|tiff|exr|wav|mp3|aac)$/im.test(newDocs)) {
  failures.push("New docs appear to reference committed media/binary filenames");
}

if (failures.length > 0) {
  console.error("TRACKA-VISUAL-REVIEW-ARTIFACT-BUNDLE-1R diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-VISUAL-REVIEW-ARTIFACT-BUNDLE-1R diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
console.log(`Checked copied files: ${copiedFiles.length}`);
console.log(`Checked capabilities: ${requiredCapabilities.length}`);
