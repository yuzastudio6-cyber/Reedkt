import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-missing-visual-evidence-2-review-outcome.md",
  "docs/track-a/track-a-missing-visual-evidence-2-artifact-review-results.md",
  "docs/track-a/track-a-missing-visual-evidence-2-capability-review-results.md",
  "docs/track-a/track-a-missing-visual-evidence-2-scope-decision.md",
  "docs/track-a/track-a-missing-visual-evidence-2-next-phase-plan.md",
  "docs/activation-phase-tracka-missing-visual-evidence-2-results.md",
  "docs/implementation-prompts/prompt-tracka-caption-quality-2-burnin-revalidation-planning.md",
  "docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-1-planning.md",
];

const sourceFiles = [
  "docs/track-a/track-a-visual-review-2c-visual-artifact-review-outcome.md",
  "docs/track-a/track-a-visual-gap-closure-1.md",
  "docs/track-a/track-a-caption-quality-1.md",
  "docs/activation-phase-tracka-caption-quality-1-results.md",
];

const reviewedFiles = [
  "tracka-missing-birefnet-stronger-proof-frame.png",
  "tracka-missing-pro-color-image-proof-pro-color-image-feature-contact-sheet.png",
  "tracka-missing-otio-private-e2e-proof-libass-burnin-preview.mp4",
  "tracka-missing-otio-private-e2e-proof-remotion-render-preview.mp4",
  "tracka-missing-otio-private-e2e-proof-hardened-review-export.mp4",
];

const requiredTerms = [
  "#419",
  "#422",
  "#426",
  "#429",
  "e4ccb582aadaa9e32607e5a1ae2bbec0719ddc1f",
  "01e19cf6bd975b6ac9168c2d226638d211849886",
  "cc49487f56e2c30f8f77af84b856da0453a07e1d",
  "58a3f87a6fc07e3afc6fb699c40c8b744cc75eab",
  "inputClassification: visual_artifacts_available",
  "overallDecision: partial_pass_with_warnings",
  "uploadedSamplesReviewed: true",
  "missingVisualEvidenceReviewPassedForUploadedSamples: true",
  "fullMissingVisualEvidenceClosurePassed: false",
  "fullTrackAVisualClosurePassed: false",
  "internalBetaReady: false",
  "trackAInternalBetaReady: false",
  "trackARuntimeReady: false",
  "trackAFinalDeliveryReady: false",
  "productionReady: false",
  "externalBetaReady: false",
  "finalDeliveryReady: false",
  "birefnet_stronger_visual_proof",
  "blocked_insufficient_visual_evidence",
  "real_esrgan_before_after_proof",
  "blocked_missing_visual_evidence",
  "opencolorio_openimageio_stronger_proof",
  "provisional_pass_sample_level",
  "otio_full_private_e2e_proof",
  "technical_pass_with_caption_revalidation_warning",
  "technical_pass_sample_level",
  "caption_visual_burnin_revalidation",
  "blocked_pending_caption_burnin_revalidation",
  "TRACKA-CAPTION-QUALITY-2 readiness: ready_for_burnin_revalidation_planning",
  "TRACKA-MISSING-VISUAL-EVIDENCE-1 readiness: merged_source_evidence",
  "TRACKA-MISSING-VISUAL-EVIDENCE-3 readiness: ready_only_if_owner_wants_to_pursue_BiRefNet_or_Real_ESRGAN_before_internal_beta",
  "TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_revalidation_and_remaining_scope_decision",
  "Internal beta readiness: blocked_pending_caption_burnin_revalidation_and_scope_decision",
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
const allDocs = [...contentsByPath.values()].join("\n\n");

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

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:missing-visual-evidence-2:diagnostics"')) {
  failures.push("Missing package script: track-a:missing-visual-evidence-2:diagnostics");
}

const forbiddenPatterns = [
  /fullMissingVisualEvidenceClosurePassed:\s*true/i,
  /fullTrackAVisualClosurePassed:\s*true/i,
  /internalBetaReady:\s*true/i,
  /trackAInternalBetaReady:\s*true/i,
  /trackARuntimeReady:\s*true/i,
  /trackAFinalDeliveryReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /internal beta:\s*(enabled|approved|true|completed|ready)/i,
  /external beta:\s*(enabled|approved|true|completed|ready)/i,
  /production:\s*(enabled|approved|true|completed|ready)/i,
  /final delivery:\s*(enabled|approved|true|completed|ready)/i,
  /public artifact(?:s| delivery)?:\s*(enabled|approved|true|completed|ready|created)/i,
  /signed URL(?: creation| source-of-truth)?:\s*(enabled|approved|true|completed|ready|created)/i,
  /Supabase mutation:\s*(enabled|approved|true|completed|ready)/i,
  /SQL executed:\s*yes/i,
  /SQL executed:\s*true/i,
  /runtime execution:\s*(enabled|approved|true|completed|ready)/i,
  /Track A runtime execution:\s*(enabled|approved|true|completed|ready)/i,
  /tool execution:\s*(enabled|approved|true|completed|ready)/i,
  /worker execution:\s*(enabled|approved|true|completed|ready)/i,
  /provider call:\s*(enabled|approved|true|completed|ready)/i,
  /route execution:\s*(enabled|approved|true|completed|ready)/i,
  /media processing:\s*(enabled|approved|true|completed|ready)/i,
  /frame extraction:\s*(enabled|approved|true|completed|ready)/i,
  /contact sheet generation:\s*(enabled|approved|true|completed|ready)/i,
  /GCS access:\s*(enabled|approved|true|completed|ready)/i,
  /private artifact access:\s*(enabled|approved|true|completed|ready)/i,
  /signed URLs?:\s*(created|enabled|approved|true|completed|ready)/i,
  /public artifacts?:\s*(created|enabled|approved|true|completed|ready)/i,
  /final render\/export:\s*(enabled|approved|true|completed|ready)/i,
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(newDocs)) {
    failures.push(`Forbidden positive claim matched: ${pattern}`);
  }
}

if (!allDocs.includes("captionSourceType: controlled_test_caption_copy")) {
  failures.push("Missing inherited controlled-test caption source evidence");
}

if (failures.length > 0) {
  console.error("TRACKA-MISSING-VISUAL-EVIDENCE-2 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-MISSING-VISUAL-EVIDENCE-2 diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
console.log(`Checked reviewed visual artifacts: ${reviewedFiles.length}`);
