import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-caption-quality-2-burnin-revalidation-planning.md",
  "docs/track-a/track-a-caption-quality-2-caption-source-to-burnin-contract.md",
  "docs/track-a/track-a-caption-quality-2-ass-sidecar-plan.md",
  "docs/track-a/track-a-caption-quality-2-libass-burnin-plan.md",
  "docs/track-a/track-a-caption-quality-2-remotion-preview-plan.md",
  "docs/track-a/track-a-caption-quality-2-ffmpeg-ffprobe-validation-plan.md",
  "docs/track-a/track-a-caption-quality-2-private-e2e-review-plan.md",
  "docs/track-a/track-a-caption-quality-2-qa-gate-map.md",
  "docs/track-a/track-a-caption-quality-2-scope-and-risk-map.md",
  "docs/track-a/track-a-caption-quality-2-next-phase-plan.md",
  "docs/activation-phase-tracka-caption-quality-2-results.md",
  "docs/implementation-prompts/prompt-tracka-caption-quality-3-burnin-revalidation-execution-packet.md",
  "docs/implementation-prompts/prompt-internal-beta-tracka-scope-decision-1.md",
  "docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-1-planning.md",
];

const sourceFiles = [
  "docs/track-a/track-a-approved-caption-source.md",
  "docs/track-a/track-a-corrected-controlled-test-caption-copy.md",
  "docs/track-a/track-a-caption-quality-revalidation-plan.md",
  "docs/track-a/track-a-missing-visual-evidence-2-review-outcome.md",
  "docs/track-a/track-a-missing-visual-evidence-2-artifact-review-results.md",
  "docs/track-a/track-a-missing-visual-evidence-2-capability-review-results.md",
  "docs/activation-phase-tracka-missing-visual-evidence-2-results.md",
];

const requiredTerms = [
  "#419",
  "#422",
  "#426",
  "#429",
  "#434",
  "01e19cf6bd975b6ac9168c2d226638d211849886",
  "cc49487f56e2c30f8f77af84b856da0453a07e1d",
  "58a3f87a6fc07e3afc6fb699c40c8b744cc75eab",
  "e4ccb582aadaa9e32607e5a1ae2bbec0719ddc1f",
  "2bb01b188aeb636c4234ecd4a9bf6a12ad87eee3",
  "captionSourceType: controlled_test_caption_copy",
  "transcriptAccuracyClaim: false",
  "captionTextQualityForControlledTest: pass",
  "visualBurnInRevalidationRequired: true",
  "Hey everyone — welcome to this ReEditPro visual review.",
  "Today we are testing captions, overlays, and private render quality.",
  "The goal is a clean, professional edit with readable text.",
  "Review this sample for timing, polish, and visual clarity.",
  "Hey guys, I saw how you guys doing today is going to do going to be the first",
  "partial_pass_with_warnings",
  "blocked_insufficient_visual_evidence",
  "blocked_missing_visual_evidence",
  "provisional_pass_sample_level",
  "technical_pass_with_caption_revalidation_warning",
  "blocked_pending_caption_burnin_revalidation",
  "TRACKA-CAPTION-QUALITY-3 readiness: ready_for_burnin_revalidation_execution_packet",
  "TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_revalidation_execution_and_scope_decision",
  "INTERNAL-BETA readiness: blocked_pending_caption_burnin_revalidation_and_scope_decision",
  "TRACKA-MISSING-VISUAL-EVIDENCE-3 readiness: optional_scope_expansion_only",
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
const packetText = requiredFiles.map((path) => contentsByPath.get(path) ?? "").join("\n\n");
const allText = [...contentsByPath.values()].join("\n\n");

for (const path of requiredFiles) {
  const text = contentsByPath.get(path) ?? "";
  if (!text.includes(noScope)) {
    failures.push(`Missing exact no-scope statement: ${path}`);
  }
}

for (const term of requiredTerms) {
  if (!allText.includes(term)) {
    failures.push(`Missing required term: ${term}`);
  }
}

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:caption-quality-2:diagnostics"')) {
  failures.push("Missing package script: track-a:caption-quality-2:diagnostics");
}

const forbiddenPatterns = [
  /transcriptAccuracyClaim:\s*true/i,
  /visualBurnInRevalidationRequired:\s*false/i,
  /corrected-caption visual burn-in has run/i,
  /burnInRevalidationCompleted:\s*true/i,
  /captionBurnInRevalidationPassed:\s*true/i,
  /fullTrackAVisualClosurePassed:\s*true/i,
  /internalBetaReady:\s*true/i,
  /trackAInternalBetaReady:\s*true/i,
  /trackARuntimeReady:\s*true/i,
  /trackAFinalDeliveryReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /internal beta(?: readiness)?:\s*(enabled|approved|true|completed|ready)/i,
  /external beta(?: readiness)?:\s*(enabled|approved|true|completed|ready)/i,
  /production(?: readiness)?:\s*(enabled|approved|true|completed|ready)/i,
  /final delivery:\s*(enabled|approved|true|completed|ready)/i,
  /public artifact(?:s| creation| delivery)?:\s*(enabled|approved|true|completed|ready|created)/i,
  /signed URL(?: creation| source-of-truth)?:\s*(enabled|approved|true|completed|ready|created)/i,
  /Supabase mutation:\s*(enabled|approved|true|completed|ready)/i,
  /SQL executed:\s*(yes|true)/i,
  /runtime execution:\s*(enabled|approved|true|completed|ready)/i,
  /Track A runtime execution:\s*(enabled|approved|true|completed|ready)/i,
  /tool execution:\s*(enabled|approved|true|completed|ready)/i,
  /worker execution:\s*(enabled|approved|true|completed|ready)/i,
  /provider call:\s*(enabled|approved|true|completed|ready)/i,
  /provider\/model calls?:\s*(enabled|approved|true|completed|ready)/i,
  /route execution:\s*(enabled|approved|true|completed|ready)/i,
  /media processing:\s*(enabled|approved|true|completed|ready)/i,
  /private E2E execution:\s*(enabled|approved|true|completed|ready)/i,
  /private artifact access:\s*(enabled|approved|true|completed|ready)/i,
  /GCS access:\s*(enabled|approved|true|completed|ready)/i,
  /libass execution:\s*(enabled|approved|true|completed|ready)/i,
  /FFmpeg(?:\/FFprobe)? execution:\s*(enabled|approved|true|completed|ready)/i,
  /Remotion execution:\s*(enabled|approved|true|completed|ready)/i,
  /OpenTimelineIO execution:\s*(enabled|approved|true|completed|ready)/i,
  /OpenColorIO execution:\s*(enabled|approved|true|completed|ready)/i,
  /OpenImageIO execution:\s*(enabled|approved|true|completed|ready)/i,
  /Kornia execution:\s*(enabled|approved|true|completed|ready)/i,
  /BiRefNet execution:\s*(enabled|approved|true|completed|ready)/i,
  /SAM2 execution:\s*(enabled|approved|true|completed|ready)/i,
  /Real-ESRGAN execution:\s*(enabled|approved|true|completed|ready)/i,
  /FILM execution:\s*(enabled|approved|true|completed|ready)/i,
  /dependency mutation:\s*(enabled|approved|true|completed|ready)/i,
  /package-lock\.json.*changed/i,
  /raw prompt execution:\s*(enabled|approved|true|completed|ready)/i,
  /final render\/export:\s*(enabled|approved|true|completed|ready)/i,
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(packetText)) {
    failures.push(`Forbidden positive claim matched: ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error("TRACKA-CAPTION-QUALITY-2 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-CAPTION-QUALITY-2 diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
