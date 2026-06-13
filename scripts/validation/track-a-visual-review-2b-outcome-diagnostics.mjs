import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-visual-review-2b-outcome.md",
  "docs/track-a/track-a-visual-review-2b-input-classification.md",
  "docs/track-a/track-a-visual-review-2b-artifact-review-results.md",
  "docs/track-a/track-a-visual-review-2b-capability-review-results.md",
  "docs/track-a/track-a-visual-review-2b-blockers-and-followups.md",
  "docs/track-a/track-a-visual-review-2b-next-phase-plan.md",
  "docs/activation-phase-tracka-visual-review-2b-results.md",
  "docs/implementation-prompts/prompt-tracka-visual-review-artifact-bundle-2-exact-visual-artifacts.md",
  "docs/implementation-prompts/prompt-tracka-oldstack-closure-1-supersede-historical-prs.md",
  "docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-1-planning.md",
];

const sourceFiles = [
  "docs/track-a/track-a-visual-review-quality-rubric.md",
  "docs/track-a/track-a-visual-review-pass-fail-schema.md",
  "docs/track-a/track-a-visual-review-local-bundle-checksums.md",
  "docs/activation-phase-tracka-visual-review-artifact-bundle-1r-results.md",
];

const copiedArtifacts = [
  ["tracka-bundle-birefnet-masking-phase33c-report.json", "1558a198d2c7aa579f5c0df85628b6a1e077bed690f665b7f159034e2ad0633b"],
  ["tracka-bundle-sam2-segmentation-phase35f-report.json", "35c9a6bc89d5943cf17728c8edc1c3a4a88f29fd417bf1ed9fe0cdd4ae57a055"],
  ["tracka-bundle-real-esrgan-enhancement-phase34d-report.json", "fcb3de1b43d933327711d5747fd16b3a14339f27d2fbae91ce9c1add5f07617b"],
  ["tracka-bundle-film-interpolation-phase38d-report.json", "edee293a8c1230afa0c2e468c2e0b094ed11cf7bfe66deccac8eb52f58d57b35"],
  ["tracka-bundle-opencolorio-color-pipeline-phase40d-report.json", "9631f22e5fec8a55efafc0461bfa87c6d5e26ccf7e4e91e65d49ae7e4ef21662"],
  ["tracka-bundle-openimageio-image-io-phase40d-report.json", "9631f22e5fec8a55efafc0461bfa87c6d5e26ccf7e4e91e65d49ae7e4ef21662"],
  ["tracka-bundle-libass-caption-burnin-phase45a-report.json", "137220848d73d881d0c52c3048feb9c89eef5c782d9f78a15ecc324144889900"],
  ["tracka-bundle-opentimelineio-validation-phase45c-report.json", "679493fa5ef597590c3c88c859328ba9dca45257fa4a57a17fa2c98188ebc179"],
  ["tracka-bundle-ffmpeg-render-hardening-phase45d-report.json", "7f6bf0b1f620c7a1b72fd00746e50aa052ac63348f7b3ff59dbbf82a53b0865c"],
  ["tracka-bundle-ffprobe-export-validation-ffprobe-export-validation.json", "d112753bb0acd548a04d302b6b89f2cbc82e8656b0eb7b660019634c600a01b4"],
  ["tracka-bundle-full-visual-video-private-e2e-phase45e-report.json", "28fbbb7995601d611fbea11c26870cf2240e5e9876ceb5bd862a58a78968aa8c"],
  ["tracka-bundle-track-a-readiness-closure-phase45f-report.json", "2da163e1c540f2bc9154d3c1891983f3ae72fb3119661512beee042a6a5becee"],
];

const requiredTerms = [
  "#393",
  "#403",
  "tracka-visual-review-artifact-bundle1-20260613T195844",
  "inputClassification: metadata_only",
  "reviewOutcome: blocked_missing_visual_artifacts",
  "visualReviewPassed: false",
  "metadataIntegrity: pass",
  "TRACKA-OLDSTACK-CLOSURE-1 readiness: blocked_pending_visual_artifacts",
  "TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_visual_artifacts",
  "tracka-bundle-kornia-pro-color-image",
  "artifact_ref_not_recorded_in_current_source",
  "tracka-bundle-remotion-render-preview",
  "needs_exact_object_ref",
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

for (const [file, checksum] of copiedArtifacts) {
  if (!newDocs.includes(file)) {
    failures.push(`Missing copied artifact filename: ${file}`);
  }
  if (!newDocs.includes(checksum)) {
    failures.push(`Missing copied artifact checksum for ${file}`);
  }
}

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:visual-review-2b-outcome:diagnostics"')) {
  failures.push("Missing package script: track-a:visual-review-2b-outcome:diagnostics");
}

const forbiddenPatterns = [
  /visualReviewPassed:\s*true/i,
  /Visual review passed:\s*`?true`?/i,
  /reviewOutcome:\s*(pass|pass_with_warnings|fail)(\s|$)/i,
  /internal beta unlock:\s*(enabled|approved|true|completed)/i,
  /external beta unlock:\s*(enabled|approved|true|completed)/i,
  /production unlock:\s*(enabled|approved|true|completed)/i,
  /final delivery:\s*(enabled|approved|true|completed)/i,
  /public artifacts:\s*(enabled|approved|true|completed)/i,
  /signed URL source-of-truth:\s*(enabled|approved|true|completed)/i,
  /Supabase mutation:\s*(enabled|approved|true|completed)/i,
  /SQL executed:\s*yes/i,
  /runtime execution:\s*(enabled|approved|true|completed)/i,
  /tool execution:\s*(enabled|approved|true|completed)/i,
  /worker execution:\s*(enabled|approved|true|completed)/i,
  /provider call:\s*(enabled|approved|true|completed)/i,
  /route execution:\s*(enabled|approved|true|completed)/i,
  /media processing:\s*(enabled|approved|true|completed)/i,
  /final render\/export:\s*(enabled|approved|true|completed)/i,
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(newDocs)) {
    failures.push(`Forbidden positive claim matched: ${pattern}`);
  }
}

if (/\.(mp4|mov|webm|mkv|png|jpg|jpeg|gif|tiff|exr|wav|mp3|aac)$/im.test(newDocs)) {
  failures.push("2B docs appear to reference committed visual/audio media files");
}

if (failures.length > 0) {
  console.error("TRACKA-VISUAL-REVIEW-2B diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-VISUAL-REVIEW-2B diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
console.log(`Checked copied artifacts: ${copiedArtifacts.length}`);
