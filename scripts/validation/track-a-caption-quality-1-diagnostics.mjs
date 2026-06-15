import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-caption-quality-1.md",
  "docs/track-a/track-a-approved-caption-source.md",
  "docs/track-a/track-a-caption-text-qa-rules.md",
  "docs/track-a/track-a-caption-copy-review-report.md",
  "docs/track-a/track-a-corrected-controlled-test-caption-copy.md",
  "docs/track-a/track-a-caption-source-handoff-contract.md",
  "docs/track-a/track-a-caption-quality-revalidation-plan.md",
  "docs/track-a/track-a-caption-quality-gap-map.md",
  "docs/activation-phase-tracka-caption-quality-1-results.md",
  "docs/implementation-prompts/prompt-tracka-caption-quality-1-approved-caption-source.md",
  "docs/implementation-prompts/prompt-tracka-caption-quality-2-burnin-revalidation-planning.md",
  "docs/implementation-prompts/prompt-tracka-missing-visual-evidence-1-exact-artifact-bundle.md",
];

const sourceFiles = [
  "docs/track-a/track-a-visual-review-2c-artifact-review-results.md",
  "docs/track-a/track-a-caption-quality-closure-plan.md",
  "docs/track-a/track-a-gap-closure-readiness-matrix.md",
  "docs/track-a/track-a-visual-gap-closure-1.md",
];

const requiredTerms = [
  "#419",
  "#422",
  "01e19cf6bd975b6ac9168c2d226638d211849886",
  "cc49487f56e2c30f8f77af84b856da0453a07e1d",
  "pass_with_warnings_sample_level",
  "caption_transcript_quality",
  "fix_required_before_internal_beta_track_a_visual_green",
  "Hey guys, I saw how you guys doing today is going to do going to be the first",
  "captionSourceType: controlled_test_caption_copy",
  "controlled_test_caption_copy",
  "transcriptAccuracyClaim: false",
  "captionTextQualityForControlledTest: pass",
  "caption_text_quality_passed_for_controlled_test_copy",
  "captionVisualBurnInRevalidationRequired: true",
  "TRACKA-CAPTION-QUALITY-2 readiness: ready_for_future_burnin_revalidation_planning",
  "TRACKA-MISSING-VISUAL-EVIDENCE-1 readiness: ready",
  "TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_missing_visual_evidence_and_caption_revalidation",
  "Internal beta readiness: blocked_pending_tracka_missing_visual_evidence_and_caption_revalidation",
  "Hey everyone — welcome to this ReEditPro visual review.",
  "Today we are testing captions, overlays, and private render quality.",
  "The goal is a clean, professional edit with readable text.",
  "Review this sample for timing, polish, and visual clarity.",
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
const sourceText = sourceFiles.map((path) => contentsByPath.get(path) ?? "").join("\n\n");
const allText = `${packetText}\n\n${sourceText}`;

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
if (!packageJson.includes('"track-a:caption-quality-1:diagnostics"')) {
  failures.push("Missing package script: track-a:caption-quality-1:diagnostics");
}

const forbiddenPatterns = [
  /transcriptAccuracyClaim:\s*true/i,
  /captionVisualBurnInRevalidationRequired:\s*false/i,
  /visualBurnInSuccessClaimed:\s*true/i,
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
  /SQL executed:\s*(yes|true)/i,
  /runtime execution:\s*(enabled|approved|true|completed|ready)/i,
  /tool execution:\s*(enabled|approved|true|completed|ready)/i,
  /worker execution:\s*(enabled|approved|true|completed|ready)/i,
  /provider\/model calls?:\s*(enabled|approved|true|completed|ready)/i,
  /route execution:\s*(enabled|approved|true|completed|ready)/i,
  /media processing:\s*(enabled|approved|true|completed|ready)/i,
  /frame extraction:\s*(enabled|approved|true|completed|ready)/i,
  /final render\/export:\s*(enabled|approved|true|completed|ready)/i,
  /GCS access:\s*(enabled|approved|true|completed|ready)/i,
  /private artifact access:\s*(enabled|approved|true|completed|ready)/i,
  /libass execution:\s*(enabled|approved|true|completed|ready)/i,
  /FFmpeg(?:\/FFprobe)? execution:\s*(enabled|approved|true|completed|ready)/i,
  /Remotion execution:\s*(enabled|approved|true|completed|ready)/i,
];

for (const pattern of forbiddenPatterns) {
  if (packetText.match(pattern)) {
    failures.push(`Forbidden positive claim matched: ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error("TRACKA-CAPTION-QUALITY-1 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-CAPTION-QUALITY-1 diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
