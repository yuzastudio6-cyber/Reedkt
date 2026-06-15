import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-visual-gap-closure-1.md",
  "docs/track-a/track-a-caption-quality-closure-plan.md",
  "docs/track-a/track-a-missing-visual-evidence-closure-plan.md",
  "docs/track-a/track-a-gap-closure-artifact-requirements.md",
  "docs/track-a/track-a-gap-closure-readiness-matrix.md",
  "docs/track-a/track-a-gap-closure-blocked-scope-register.md",
  "docs/track-a/track-a-gap-closure-next-phase-plan.md",
  "docs/activation-phase-tracka-visual-gap-closure-1-results.md",
  "docs/implementation-prompts/prompt-tracka-caption-quality-1-approved-caption-source.md",
  "docs/implementation-prompts/prompt-tracka-missing-visual-evidence-1-exact-artifact-bundle.md",
  "docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-1-planning.md",
];

const sourceFiles = [
  "docs/track-a/track-a-visual-review-2c-visual-artifact-review-outcome.md",
  "docs/track-a/track-a-visual-review-2c-gap-and-fix-map.md",
  "docs/track-a/track-a-visual-review-2c-artifact-review-results.md",
  "docs/track-a/track-a-visual-review-2c-capability-review-results.md",
];

const requiredTerms = [
  "#419",
  "01e19cf6bd975b6ac9168c2d226638d211849886",
  "pass_with_warnings_sample_level",
  "fullTrackAVisualClosurePassed: false",
  "Internal beta readiness: blocked_pending_tracka_gap_closure",
  "caption_transcript_quality",
  "fix_required_before_internal_beta_track_a_visual_green",
  "birefnet_stronger_visual_proof",
  "insufficient_evidence_for_full_pass",
  "real_esrgan_before_after_proof",
  "missing_visual_evidence",
  "opencolorio_openimageio_stronger_proof",
  "partial_evidence_only",
  "otio_full_private_e2e_proof",
  "TRACKA-CAPTION-QUALITY-1 readiness: ready",
  "TRACKA-MISSING-VISUAL-EVIDENCE-1 readiness: ready",
  "TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_gap_closure",
  "caption quality: cannot defer",
  "OTIO/full private E2E proof",
  "BiRefNet",
  "Real-ESRGAN",
  "OpenColorIO/OpenImageIO",
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

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:visual-gap-closure-1:diagnostics"')) {
  failures.push("Missing package script: track-a:visual-gap-closure-1:diagnostics");
}

const forbiddenPatterns = [
  /fullTrackAVisualClosurePassed:\s*true/i,
  /trackAInternalBetaReady:\s*true/i,
  /trackARuntimeReady:\s*true/i,
  /trackAFinalDeliveryReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /internal beta(?: readiness)?:\s*(enabled|approved|true|completed|ready)/i,
  /external beta(?: readiness)?:\s*(enabled|approved|true|completed|ready)/i,
  /production(?: readiness)?:\s*(enabled|approved|true|completed|ready)/i,
  /final delivery:\s*(enabled|approved|true|completed|ready)/i,
  /public artifact(?:s| creation| delivery)?:\s*(enabled|approved|true|completed|ready|created)/i,
  /signed URL(?: creation| source-of-truth)?:\s*(enabled|approved|true|completed|ready|created)/i,
  /Supabase mutation:\s*(enabled|approved|true|completed|ready)/i,
  /SQL executed:\s*yes/i,
  /runtime execution:\s*(enabled|approved|true|completed|ready)/i,
  /tool execution:\s*(enabled|approved|true|completed|ready)/i,
  /worker execution:\s*(enabled|approved|true|completed|ready)/i,
  /provider\/model calls?:\s*(enabled|approved|true|completed|ready)/i,
  /route execution:\s*(enabled|approved|true|completed|ready)/i,
  /media processing:\s*(enabled|approved|true|completed|ready)/i,
  /frame extraction:\s*(enabled|approved|true|completed|ready)/i,
  /contact sheet generation:\s*(enabled|approved|true|completed|ready)/i,
  /final render\/export:\s*(enabled|approved|true|completed|ready)/i,
  /GCS access:\s*(enabled|approved|true|completed|ready)/i,
  /private artifact access:\s*(enabled|approved|true|completed|ready)/i,
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(newDocs)) {
    failures.push(`Forbidden positive claim matched: ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error("TRACKA-VISUAL-GAP-CLOSURE-1 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-VISUAL-GAP-CLOSURE-1 diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
