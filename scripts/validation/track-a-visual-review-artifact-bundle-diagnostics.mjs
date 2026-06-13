import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-visual-review-artifact-bundle.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-manifest.md",
  "docs/track-a/track-a-visual-review-artifact-access-policy.md",
  "docs/track-a/track-a-visual-review-upload-to-chat-instructions.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-gap-map.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-next-phase-plan.md",
  "docs/activation-phase-tracka-visual-review-artifact-bundle-1-results.md",
  "docs/implementation-prompts/prompt-tracka-visual-review-2b-record-ai-assisted-review-outcome.md",
  "scripts/validation/track-a-visual-review-artifact-bundle.mjs",
];

const sourceFiles = [
  "docs/track-a/track-a-visual-review-artifact-index.md",
  "docs/track-a/track-a-current-source-artifact-reference-manifest.md",
  "docs/track-a/track-a-visual-review-2a-ai-assisted-private-review-intake.md",
  "docs/activation-phase-tracka-visual-review-2a-results.md",
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

const requiredTerms = [
  "#390",
  "#393",
  "#396",
  "tracka-visual-review-artifact-bundle1-20260613T195844",
  "private_artifact_access=not_attempted",
  "blocked_pending_private_artifact_access_confirmation_or_uploaded_frames",
  "blocked_pending_private_artifact_bundle_or_uploaded_frames",
  "artifact_ref_not_recorded_in_current_source",
  "needs_exact_object_ref",
  "publicArtifactAllowed",
  "signedUrlAllowed",
  "signedUrlSourceOfTruthAllowed",
  "copiedToLocalBundle",
  "TRACKA-VISUAL-REVIEW-2B",
  "docs_only",
];

const noScope =
  "No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. If executed with confirmation, only bounded private GCS metadata/read access for explicit Track A review artifact refs was allowed.";

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

for (const capability of requiredCapabilities) {
  if (!newDocs.includes(capability)) {
    failures.push(`Missing required capability: ${capability}`);
  }
}

for (const term of requiredTerms) {
  if (!newDocs.includes(term)) {
    failures.push(`Missing required term: ${term}`);
  }
}

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:visual-review-artifact-bundle"')) {
  failures.push("Missing package script: track-a:visual-review-artifact-bundle");
}
if (!packageJson.includes('"track-a:visual-review-artifact-bundle:diagnostics"')) {
  failures.push("Missing package script: track-a:visual-review-artifact-bundle:diagnostics");
}

const forbiddenPositiveClaims = [
  /AI-assisted visual review can proceed:\s*`?true`?/i,
  /visual pass\/fail outcome:\s*`?(passed|approved|completed)`?/i,
  /review pass status:\s*`?(passed|approved|completed)`?/i,
  new RegExp("private_artifact_access=com" + "pleted", "i"),
  /Local review bundle:\s*`?created`?/i,
  /copiedToLocalBundle\s*\|\s*true/i,
  /publicArtifactAllowed\s*\|\s*true/i,
  /signedUrlAllowed\s*\|\s*true/i,
  /signedUrlSourceOfTruthAllowed\s*\|\s*true/i,
  /public artifact creation:\s*(enabled|approved|true)/i,
  /signed URL creation:\s*(enabled|approved|true)/i,
  /signed URL source-of-truth:\s*(enabled|approved|true)/i,
  /GCS upload:\s*(enabled|approved|true|completed)/i,
  /storage transfer:\s*(enabled|approved|true|completed)/i,
  /Track A runtime execution:\s*(enabled|approved|true)/i,
  /FFmpeg execution:\s*(enabled|approved|true)/i,
  /Remotion execution:\s*(enabled|approved|true)/i,
  /libass execution:\s*(enabled|approved|true)/i,
  /OTIO execution:\s*(enabled|approved|true)/i,
  /OpenColorIO execution:\s*(enabled|approved|true)/i,
  /OpenImageIO execution:\s*(enabled|approved|true)/i,
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

if (/\.(mp4|mov|webm|mkv|png|jpg|jpeg|gif|tiff|exr|wav|mp3|aac)$/im.test(newDocs)) {
  failures.push("New docs appear to reference committed media/binary filenames");
}

if (failures.length > 0) {
  console.error("TRACKA-VISUAL-REVIEW-ARTIFACT-BUNDLE-1 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-VISUAL-REVIEW-ARTIFACT-BUNDLE-1 diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
console.log(`Checked artifact groups: ${requiredCapabilities.length}`);
