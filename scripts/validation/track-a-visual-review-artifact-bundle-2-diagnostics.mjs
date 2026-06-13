import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-visual-review-artifact-bundle-2.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-2-allowlist.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-2-discovery-results.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-2-local-manifest.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-2-checksums.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-2-upload-to-chat-instructions.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-2-gap-map.md",
  "docs/activation-phase-tracka-visual-review-artifact-bundle-2-results.md",
  "docs/implementation-prompts/prompt-tracka-visual-review-artifact-bundle-2-exact-visual-artifacts.md",
  "docs/implementation-prompts/prompt-tracka-visual-review-2c-record-visual-artifact-review-outcome.md",
  "scripts/validation/track-a-visual-review-artifact-bundle-2.mjs",
];

const sourceFiles = [
  "docs/track-a/track-a-visual-review-2b-outcome.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-manifest.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-execution-result.md",
  "docs/track-a/track-a-visual-review-quality-rubric.md",
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
  "#408",
  "51cd4849c2dc31d4b59d7b673e27437493d0fcac",
  "tracka-visual-review-artifact-bundle2-20260613T215327",
  "blocked_no_review_safe_visual_artifacts_found",
  "blocked_no_visual_artifacts_copied",
  "private_artifact_access=completed_bounded_visual_allowlist",
  "local_visual_bundle=not_created",
  "copied visual artifacts: `0`",
  "bounded prefix discovery allowlist: `1`",
  "exact visual object allowlist: `0`",
  "rejected nonvisual metadata refs: `12`",
  "rejected missing refs: `1`",
  "tracka-bundle-kornia-pro-color-image",
  "artifact_ref_not_recorded_in_current_source",
  "tracka-bundle-remotion-render-preview",
  "no_review_safe_visual_artifacts_found",
  "TRACKA-VISUAL-REVIEW-2C readiness: `blocked_no_review_safe_visual_artifacts_found`",
  "docs_only",
];

const noScope =
  "No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A visual review artifact refs from current-source evidence.";

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
if (!packageJson.includes('"track-a:visual-review-artifact-bundle-2"')) {
  failures.push("Missing package script: track-a:visual-review-artifact-bundle-2");
}
if (!packageJson.includes('"track-a:visual-review-artifact-bundle-2:diagnostics"')) {
  failures.push("Missing package script: track-a:visual-review-artifact-bundle-2:diagnostics");
}

const forbiddenPositiveClaims = [
  /visualReviewPassed:\s*true/i,
  /visual pass\/fail outcome:\s*`?(passed|approved|completed)`?/i,
  /reviewOutcome:\s*(pass|pass_with_warnings|visual_passed)(\s|$)/i,
  /public artifacts?:\s*(enabled|approved|true|created|completed)/i,
  /signed URLs?:\s*(enabled|approved|true|created|completed)/i,
  /signed URL source-of-truth:\s*(enabled|approved|true|created|completed)/i,
  /GCS upload:\s*(enabled|approved|true|created|completed)/i,
  /bucket mutation:\s*(enabled|approved|true|created|completed)/i,
  /object mutation:\s*(enabled|approved|true|created|completed)/i,
  /Supabase mutation:\s*(enabled|approved|true|created|completed)/i,
  /SQL executed:\s*yes/i,
  /Track A runtime execution:\s*(enabled|approved|true|created|completed)/i,
  /FFmpeg execution:\s*(enabled|approved|true|created|completed)/i,
  /FFprobe execution:\s*(enabled|approved|true|created|completed)/i,
  /Remotion execution:\s*(enabled|approved|true|created|completed)/i,
  /libass execution:\s*(enabled|approved|true|created|completed)/i,
  /OTIO execution:\s*(enabled|approved|true|created|completed)/i,
  /OpenColorIO execution:\s*(enabled|approved|true|created|completed)/i,
  /OpenImageIO execution:\s*(enabled|approved|true|created|completed)/i,
  /Kornia execution:\s*(enabled|approved|true|created|completed)/i,
  /BiRefNet execution:\s*(enabled|approved|true|created|completed)/i,
  /SAM2 execution:\s*(enabled|approved|true|created|completed)/i,
  /Real-ESRGAN execution:\s*(enabled|approved|true|created|completed)/i,
  /FILM execution:\s*(enabled|approved|true|created|completed)/i,
  /media processing:\s*(enabled|approved|true|created|completed)/i,
  /frame extraction:\s*(enabled|approved|true|created|completed)/i,
  /contact sheet generation:\s*(enabled|approved|true|created|completed)/i,
  /internal beta unlock:\s*(enabled|approved|true|created|completed)/i,
  /external beta unlock:\s*(enabled|approved|true|created|completed)/i,
  /production unlock:\s*(enabled|approved|true|created|completed)/i,
  /final render\/export:\s*(enabled|approved|true|created|completed)/i,
];

for (const pattern of forbiddenPositiveClaims) {
  if (pattern.test(newDocs)) {
    failures.push(`Forbidden positive claim matched: ${pattern}`);
  }
}

const mediaFileList = spawnSync("git", ["ls-files", "-o", "--exclude-standard"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
if (mediaFileList.status === 0) {
  const mediaFiles = mediaFileList.stdout
    .split(/\r?\n/)
    .filter((line) => /\.(mp4|mov|webm|mkv|png|jpg|jpeg|gif|tiff|exr|wav|mp3|aac)$/i.test(line));
  if (mediaFiles.length > 0) {
    failures.push(`Untracked media/binary files present: ${mediaFiles.join(", ")}`);
  }
}

if (failures.length > 0) {
  console.error("TRACKA-VISUAL-REVIEW-ARTIFACT-BUNDLE-2 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-VISUAL-REVIEW-ARTIFACT-BUNDLE-2 diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
console.log(`Checked capabilities: ${requiredCapabilities.length}`);
