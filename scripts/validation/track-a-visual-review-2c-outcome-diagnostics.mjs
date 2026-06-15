import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-visual-review-2c-visual-artifact-review-outcome.md",
  "docs/track-a/track-a-visual-review-2c-artifact-review-results.md",
  "docs/track-a/track-a-visual-review-2c-capability-review-results.md",
  "docs/track-a/track-a-visual-review-2c-pass-with-warnings-rationale.md",
  "docs/track-a/track-a-visual-review-2c-gap-and-fix-map.md",
  "docs/track-a/track-a-visual-review-2c-next-phase-plan.md",
  "docs/activation-phase-tracka-visual-review-2c-results.md",
  "docs/implementation-prompts/prompt-tracka-visual-gap-closure-1-caption-and-missing-evidence.md",
];

const sourceFiles = [
  "docs/track-a/track-a-visual-review-quality-rubric.md",
  "docs/track-a/track-a-visual-review-pass-fail-schema.md",
  "docs/track-a/track-a-visual-review-2b-outcome.md",
  "docs/track-a/track-a-visual-review-artifact-bundle-2-upload-to-chat-instructions.md",
];

const reviewedFiles = [
  "tracka-bundle-birefnet-masking-frame.png",
  "tracka-bundle-sam2-segmentation-frame-000-preview.png",
  "tracka-bundle-sam2-segmentation-frame-001-preview.png",
  "tracka-bundle-sam2-segmentation-frame-002-preview.png",
  "tracka-bundle-kornia-pro-color-image-pro-color-image-feature-contact-sheet.png",
  "tracka-bundle-film-interpolation-film-slowmotion-preview.mp4",
  "tracka-bundle-libass-caption-burnin-libass-burnin-preview.mp4",
  "tracka-bundle-remotion-render-preview-remotion-render-preview.mp4",
  "tracka-bundle-ffmpeg-render-hardening-hardened-review-export.mp4",
  "tracka-bundle-ffprobe-export-validation-hardened-review-export.mp4",
];

const capabilityDecisions = [
  "birefnet_masking",
  "blocked_insufficient_visual_evidence",
  "sam2_segmentation",
  "provisional_pass_sample_level",
  "real_esrgan_enhancement",
  "blocked_missing_visual_evidence",
  "film_interpolation",
  "kornia_pro_color_image",
  "opencolorio_color_pipeline",
  "partial_evidence_only",
  "openimageio_image_io",
  "libass_caption_burnin",
  "technical_pass_with_caption_quality_warning",
  "remotion_render_preview",
  "opentimelineio_validation",
  "ffmpeg_render_hardening",
  "technical_pass_sample_level",
  "ffprobe_export_validation",
  "full_visual_video_private_e2e",
  "track_a_readiness_closure",
  "blocked_pending_gap_closure",
];

const requiredTerms = [
  "#408",
  "#411",
  "f81bca83b20b7991eebfa3819abb397cbca81977",
  "tracka-visual-review-artifact-bundle2-20260613T215327",
  "inputClassification: visual_artifacts_available",
  "overallDecision: pass_with_warnings_sample_level",
  "visualReviewPassedForUploadedSamples: true",
  "fullTrackAVisualClosurePassed: false",
  "trackAInternalBetaReady: false",
  "trackARuntimeReady: false",
  "trackAFinalDeliveryReady: false",
  "productionReady: false",
  "externalBetaReady: false",
  "TRACKA-VISUAL-GAP-CLOSURE-1 readiness: ready",
  "TRACKA-OLDSTACK-CLOSURE-1 readiness: blocked_pending_gap_closure",
  "TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_gap_closure",
  "INTERNAL-BETA readiness: blocked_pending_tracka_gap_closure",
  "fix_required_before_internal_beta_track_a_visual_green",
  "insufficient_evidence_for_full_pass",
  "missing_visual_evidence",
  "docs_only",
];

const noScope =
  "No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.";

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

for (const file of reviewedFiles) {
  if (!newDocs.includes(file)) {
    failures.push(`Missing reviewed file: ${file}`);
  }
}

for (const term of capabilityDecisions) {
  if (!newDocs.includes(term)) {
    failures.push(`Missing capability decision term: ${term}`);
  }
}

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:visual-review-2c-outcome:diagnostics"')) {
  failures.push("Missing package script: track-a:visual-review-2c-outcome:diagnostics");
}

const forbiddenPatterns = [
  /fullTrackAVisualClosurePassed:\s*true/i,
  /trackAInternalBetaReady:\s*true/i,
  /trackARuntimeReady:\s*true/i,
  /trackAFinalDeliveryReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /internal beta:\s*(enabled|approved|true|completed|ready)/i,
  /external beta:\s*(enabled|approved|true|completed|ready)/i,
  /production:\s*(enabled|approved|true|completed|ready)/i,
  /final delivery:\s*(enabled|approved|true|completed|ready)/i,
  /public artifact(?:s| delivery)?:\s*(enabled|approved|true|completed|ready)/i,
  /signed URL source-of-truth:\s*(enabled|approved|true|completed|ready)/i,
  /Supabase mutation:\s*(enabled|approved|true|completed|ready)/i,
  /SQL executed:\s*yes/i,
  /runtime execution:\s*(enabled|approved|true|completed|ready)/i,
  /tool execution:\s*(enabled|approved|true|completed|ready)/i,
  /worker execution:\s*(enabled|approved|true|completed|ready)/i,
  /provider call:\s*(enabled|approved|true|completed|ready)/i,
  /route execution:\s*(enabled|approved|true|completed|ready)/i,
  /media processing:\s*(enabled|approved|true|completed|ready)/i,
  /final render\/export:\s*(enabled|approved|true|completed|ready)/i,
  /GCS access:\s*(enabled|approved|true|completed|ready)/i,
  /signed URLs?:\s*(created|enabled|approved|true|completed|ready)/i,
  /public artifacts?:\s*(created|enabled|approved|true|completed|ready)/i,
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(newDocs)) {
    failures.push(`Forbidden positive claim matched: ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error("TRACKA-VISUAL-REVIEW-2C diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-VISUAL-REVIEW-2C diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
console.log(`Checked reviewed visual artifacts: ${reviewedFiles.length}`);
