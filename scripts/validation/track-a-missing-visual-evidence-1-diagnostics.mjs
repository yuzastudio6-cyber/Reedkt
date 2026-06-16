import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const requiredFiles = [
  "docs/track-a/track-a-missing-visual-evidence-1.md",
  "docs/track-a/track-a-missing-visual-evidence-1-allowlist.md",
  "docs/track-a/track-a-missing-visual-evidence-1-discovery-results.md",
  "docs/track-a/track-a-missing-visual-evidence-1-local-manifest.md",
  "docs/track-a/track-a-missing-visual-evidence-1-checksums.md",
  "docs/track-a/track-a-missing-visual-evidence-1-upload-to-chat-instructions.md",
  "docs/track-a/track-a-missing-visual-evidence-1-closure-status.md",
  "docs/track-a/track-a-missing-visual-evidence-1-gap-map.md",
  "docs/activation-phase-tracka-missing-visual-evidence-1-results.md",
  "docs/implementation-prompts/prompt-tracka-missing-visual-evidence-2-record-review-outcome.md",
  "docs/implementation-prompts/prompt-tracka-caption-quality-2-burnin-revalidation-planning.md",
  "docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-1-planning.md",
  "scripts/validation/track-a-missing-visual-evidence-1.mjs",
];

const sourceFiles = [
  "docs/track-a/track-a-visual-review-2c-artifact-review-results.md",
  "docs/track-a/track-a-missing-visual-evidence-closure-plan.md",
  "docs/track-a/track-a-gap-closure-artifact-requirements.md",
  "docs/track-a/track-a-caption-quality-1.md",
  "docs/activation-phase-tracka-caption-quality-1-results.md",
];

const requiredTerms = [
  "#419",
  "#422",
  "#426",
  "58a3f87a6fc07e3afc6fb699c40c8b744cc75eab",
  "pass_with_warnings_sample_level",
  "caption quality: closed_by_TRACKA-CAPTION-QUALITY-1",
  "captionTextQualityForControlledTest: pass",
  "captionVisualBurnInRevalidationRequired: true",
  "birefnet_stronger_visual_proof",
  "real_esrgan_before_after_proof",
  "opencolorio_openimageio_stronger_proof",
  "otio_full_private_e2e_proof",
  "TRACKA-CAPTION-QUALITY-2 readiness: ready_for_future_burnin_revalidation_planning",
  "TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_missing_visual_evidence_review_and_caption_revalidation",
  "Internal beta readiness: blocked_pending_tracka_missing_visual_evidence_review_and_caption_revalidation",
  "fullTrackAVisualClosurePassed: false",
  "trackAInternalBetaReady: false",
  "trackARuntimeReady: false",
  "trackAFinalDeliveryReady: false",
  "productionReady: false",
  "externalBetaReady: false",
  "docs_only",
];

const noScope =
  "No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A missing-evidence refs from current-source and historical PR evidence.";

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

const statusAlternatives = [
  {
    name: "unconfirmed_blocked",
    terms: [
      "blocked_pending_missing_visual_evidence_access_confirmation",
      "TRACKA-MISSING-VISUAL-EVIDENCE-2 readiness: blocked_pending_missing_visual_evidence_access_confirmation",
      "not_created_confirmation_absent",
    ],
  },
  {
    name: "confirmed_copied_bundle",
    terms: [
      "completed_with_missing_visual_evidence_bundle",
      "TRACKA-MISSING-VISUAL-EVIDENCE-2 readiness: ready_after_upload_of_copied_visual_files",
      "pending_human_upload",
    ],
  },
  {
    name: "confirmed_no_files_blocked",
    terms: [
      "blocked_no_missing_visual_evidence_artifacts_found",
      "TRACKA-MISSING-VISUAL-EVIDENCE-2 readiness: blocked_no_missing_visual_evidence_artifacts_found",
    ],
  },
];

if (!statusAlternatives.some((alternative) => alternative.terms.every((term) => allText.includes(term)))) {
  failures.push(
    `Missing valid execution/readiness status combination. Expected one of: ${statusAlternatives
      .map((alternative) => alternative.name)
      .join(", ")}`,
  );
}

const packageJson = readRequired("package.json");
if (!packageJson.includes('"track-a:missing-visual-evidence-1"')) {
  failures.push("Missing package script: track-a:missing-visual-evidence-1");
}
if (!packageJson.includes('"track-a:missing-visual-evidence-1:diagnostics"')) {
  failures.push("Missing package script: track-a:missing-visual-evidence-1:diagnostics");
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
  /SQL executed:\s*(yes|true)/i,
  /runtime execution:\s*(enabled|approved|true|completed|ready)/i,
  /tool execution:\s*(enabled|approved|true|completed|ready)/i,
  /worker execution:\s*(enabled|approved|true|completed|ready)/i,
  /provider\/model calls?:\s*(enabled|approved|true|completed|ready)/i,
  /route execution:\s*(enabled|approved|true|completed|ready)/i,
  /Track A runtime execution:\s*(enabled|approved|true|completed|ready)/i,
  /FFmpeg(?:\/FFprobe)? execution:\s*(enabled|approved|true|completed|ready)/i,
  /Remotion execution:\s*(enabled|approved|true|completed|ready)/i,
  /libass execution:\s*(enabled|approved|true|completed|ready)/i,
  /OTIO execution:\s*(enabled|approved|true|completed|ready)/i,
  /OpenColorIO execution:\s*(enabled|approved|true|completed|ready)/i,
  /OpenImageIO execution:\s*(enabled|approved|true|completed|ready)/i,
  /Kornia execution:\s*(enabled|approved|true|completed|ready)/i,
  /BiRefNet execution:\s*(enabled|approved|true|completed|ready)/i,
  /SAM2 execution:\s*(enabled|approved|true|completed|ready)/i,
  /Real-ESRGAN execution:\s*(enabled|approved|true|completed|ready)/i,
  /FILM execution:\s*(enabled|approved|true|completed|ready)/i,
  /media processing:\s*(enabled|approved|true|completed|ready)/i,
  /frame extraction:\s*(enabled|approved|true|completed|ready)/i,
  /contact sheet generation:\s*(enabled|approved|true|completed|ready)/i,
  /GCS upload:\s*(enabled|approved|true|completed|ready)/i,
  /bucket mutation:\s*(enabled|approved|true|completed|ready)/i,
  /object mutation:\s*(enabled|approved|true|completed|ready)/i,
  /final render\/export:\s*(enabled|approved|true|completed|ready)/i,
  /visualReviewPassedForUploadedSamples:\s*true/i,
];

for (const pattern of forbiddenPatterns) {
  if (packetText.match(pattern)) {
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
  console.error("TRACKA-MISSING-VISUAL-EVIDENCE-1 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TRACKA-MISSING-VISUAL-EVIDENCE-1 diagnostics passed");
console.log(`Checked files: ${requiredFiles.length}`);
console.log(`Checked source files: ${sourceFiles.length}`);
