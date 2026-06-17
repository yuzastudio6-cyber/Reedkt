import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-caption-quality-3-burnin-revalidation-execution-packet.md",
  "docs/track-a/track-a-caption-quality-3-approved-caption-input-manifest.md",
  "docs/track-a/track-a-caption-quality-3-ass-sidecar-execution-contract.md",
  "docs/track-a/track-a-caption-quality-3-libass-burnin-execution-contract.md",
  "docs/track-a/track-a-caption-quality-3-remotion-preview-execution-contract.md",
  "docs/track-a/track-a-caption-quality-3-ffmpeg-ffprobe-validation-contract.md",
  "docs/track-a/track-a-caption-quality-3-private-artifact-policy.md",
  "docs/track-a/track-a-caption-quality-3-qa-gate-map.md",
  "docs/track-a/track-a-caption-quality-3-iam-storage-plan.md",
  "docs/track-a/track-a-caption-quality-3-command-plan.md",
  "docs/track-a/track-a-caption-quality-3-execution-result.md",
  "docs/track-a/track-a-caption-quality-3-next-phase-plan.md",
  "docs/activation-phase-tracka-caption-quality-3-results.md",
  "docs/implementation-prompts/prompt-tracka-caption-quality-3r-burnin-revalidation-execution.md",
  "docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-1-planning.md",
  "docs/implementation-prompts/prompt-internal-beta-tracka-scope-decision-1.md",
];

const sourceFiles = [
  "docs/track-a/track-a-approved-caption-source.md",
  "docs/track-a/track-a-caption-quality-2-burnin-revalidation-planning.md",
  "docs/track-a/track-a-caption-quality-2-caption-source-to-burnin-contract.md",
  "docs/activation-phase-tracka-caption-quality-2-results.md",
  "docs/activation-phase-tracka-missing-visual-evidence-2-results.md",
];

const requiredTerms = [
  "#419",
  "#422",
  "#426",
  "#429",
  "#434",
  "#440",
  "01e19cf6bd975b6ac9168c2d226638d211849886",
  "cc49487f56e2c30f8f77af84b856da0453a07e1d",
  "58a3f87a6fc07e3afc6fb699c40c8b744cc75eab",
  "e4ccb582aadaa9e32607e5a1ae2bbec0719ddc1f",
  "2bb01b188aeb636c4234ecd4a9bf6a12ad87eee3",
  "ea238ad8ffc28c277ea36ba66b8488cb37cf66cc",
  "captionSourceType: controlled_test_caption_copy",
  "transcriptAccuracyClaim: false",
  "captionTextQualityForControlledTest: pass",
  "captionVisualBurnInRevalidationRequired: true",
  "Hey everyone — welcome to this ReEditPro visual review.",
  "Today we are testing captions, overlays, and private render quality.",
  "The goal is a clean, professional edit with readable text.",
  "Review this sample for timing, polish, and visual clarity.",
  "Hey guys, I saw how you guys doing today is going to do going to be the first",
  "Old awkward #419 preview caption text is rejected and not reused",
  "REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true",
  "execution: blocked_pending_caption_burnin_execution_confirmation",
  "captionBurninRevalidationExecuted: false",
  "privateArtifactsCreated: false",
  "gcsAccess: false",
  "signedUrlsCreated: false",
  "publicArtifactsCreated: false",
  "TRACKA-CAPTION-QUALITY-3R readiness: ready_for_guarded_execution",
  "TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_revalidation_execution_and_scope_decision",
  "INTERNAL-BETA readiness: blocked_pending_caption_burnin_revalidation_and_scope_decision",
  "docs_only",
];

const noScope =
  "No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Track A caption burn-in runtime execution remains blocked unless explicitly confirmed with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true.";

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
if (!packageJson.includes('"track-a:caption-quality-3:diagnostics"')) {
  failures.push("Missing package script: track-a:caption-quality-3:diagnostics");
}

const forbiddenPatterns = [
  /transcriptAccuracyClaim:\s*true/i,
  /captionVisualBurnInRevalidationRequired:\s*false/i,
  /confirmationProvided:\s*true/i,
  /captionBurninRevalidationExecuted:\s*true/i,
  /assSidecarCreated:\s*true/i,
  /libassBurninExecuted:\s*true/i,
  /remotionPreviewExecuted:\s*true/i,
  /ffmpegValidationExecuted:\s*true/i,
  /ffprobeValidationExecuted:\s*true/i,
  /privateArtifactsCreated:\s*true/i,
  /gcsAccess:\s*true/i,
  /signedUrlsCreated:\s*true/i,
  /publicArtifactsCreated:\s*true/i,
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
  /private GCS read\/write:\s*(enabled|approved|true|completed|ready)/i,
  /GCS access:\s*(enabled|approved|true|completed|ready)/i,
  /GCS upload:\s*(enabled|approved|true|completed|ready)/i,
  /GCS download:\s*(enabled|approved|true|completed|ready)/i,
  /libass execution:\s*(enabled|approved|true|completed|ready)/i,
  /FFmpeg(?:\/FFprobe)? execution:\s*(enabled|approved|true|completed|ready)/i,
  /Remotion execution:\s*(enabled|approved|true|completed|ready)/i,
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
  console.error("TRACKA-CAPTION-QUALITY-3 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-CAPTION-QUALITY-3 diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
