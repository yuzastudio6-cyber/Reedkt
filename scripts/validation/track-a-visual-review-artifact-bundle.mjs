import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const confirmed = process.env.REEDITPRO_CONFIRM_TRACKA_PRIVATE_ARTIFACT_BUNDLE === "true";
const bundleId =
  process.env.REEDITPRO_TRACKA_VISUAL_REVIEW_ARTIFACT_BUNDLE_ID ??
  `tracka-visual-review-artifact-bundle1-${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "")}`;
const bundleRoot = join("/tmp/reeditpro-tracka-visual-review-bundle", bundleId);
const maxCopyBytes = Number(process.env.REEDITPRO_TRACKA_VISUAL_REVIEW_MAX_COPY_BYTES ?? 10 * 1024 * 1024);

const sourceIndexPath = "docs/track-a/track-a-visual-review-artifact-index.md";
const noScopeStatement =
  "No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. If executed with confirmation, only bounded private GCS metadata/read access for explicit Track A review artifact refs was allowed.";

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function parseArtifactRows(markdown) {
  return markdown
    .split(/\r?\n/)
    .filter((line) => line.startsWith("| `tracka-visual-review-1-"))
    .map((line) => {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim().replace(/^`|`$/g, ""));
      const [
        artifactId,
        capability,
        sourcePr,
        runId,
        ref,
        artifactType,
        reviewerShouldInspect,
        expectedQualityChecks,
      ] = cells;
      return {
        artifactId,
        capability,
        sourcePr,
        runId,
        ref,
        artifactType,
        reviewerShouldInspect,
        expectedQualityChecks,
      };
    });
}

function isExactPrivateObjectRef(ref) {
  return (
    ref.startsWith("gs://") &&
    !ref.endsWith("/") &&
    !/[?*[\]]/.test(ref) &&
    !ref.includes("..") &&
    !ref.includes("artifact_ref_not_recorded_in_current_source")
  );
}

function classifyRef(row) {
  if (row.ref === "artifact_ref_not_recorded_in_current_source") {
    return "missing_ref";
  }
  if (row.ref.startsWith("http://") || row.ref.startsWith("https://")) {
    return "blocked_public_or_signed_url";
  }
  if (row.ref.endsWith("/")) {
    return "needs_exact_object_ref";
  }
  if (!isExactPrivateObjectRef(row.ref)) {
    return "blocked_unsafe_ref";
  }
  return "allowlisted_exact_private_ref";
}

function runGcloud(commandArgs) {
  return spawnSync("gcloud", commandArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function parseSize(output) {
  const contentLength = output.match(/Content-Length:\s*(\d+)/i);
  if (contentLength) return Number(contentLength[1]);
  const size = output.match(/Size:\s*(\d+)/i);
  if (size) return Number(size[1]);
  return null;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const sourceIndex = read(sourceIndexPath);
const rows = parseArtifactRows(sourceIndex);
const classifiedRows = rows.map((row) => ({
  ...row,
  bundleGroupId: row.artifactId.replace("tracka-visual-review-1-", "tracka-bundle-"),
  availability: classifyRef(row),
}));

const baseSummary = {
  bundleId,
  sourceEvidence: ["#390", "#393", "#396"],
  noScopeStatement,
  executionRequested: execute,
  executionConfirmed: confirmed,
  bundleRoot,
  privateArtifactAccess: "not_attempted",
  localReviewBundle: "not_created",
  trackaVisualReview2bReadiness: "blocked_pending_private_artifact_bundle_or_uploaded_frames",
  artifactGroups: classifiedRows.map((row) => ({
    groupId: row.bundleGroupId,
    capability: row.capability,
    sourcePr: row.sourcePr,
    runId: row.runId,
    privateRef: row.ref,
    artifactType: row.artifactType,
    availability: row.availability,
    publicArtifactAllowed: false,
    signedUrlAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    copiedToLocalBundle: false,
  })),
};

if (!execute || !confirmed) {
  const reason = !execute
    ? "manifest_only_no_execute_requested"
    : "blocked_pending_private_artifact_access_confirmation_or_uploaded_frames";
  console.log(
    JSON.stringify(
      {
        ...baseSummary,
        execution: "completed docs-only",
        reason,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

mkdirSync(bundleRoot, { recursive: true });

const copied = [];
const skipped = [];

for (const row of classifiedRows) {
  if (row.availability !== "allowlisted_exact_private_ref") {
    skipped.push({
      groupId: row.bundleGroupId,
      ref: row.ref,
      reason: row.availability,
    });
    continue;
  }

  const stat = runGcloud(["storage", "ls", "-L", row.ref]);
  if (stat.status !== 0) {
    skipped.push({
      groupId: row.bundleGroupId,
      ref: row.ref,
      reason: "metadata_check_failed",
      stderr: stat.stderr.trim(),
    });
    continue;
  }

  const sizeBytes = parseSize(stat.stdout);
  if (sizeBytes !== null && sizeBytes > maxCopyBytes) {
    skipped.push({
      groupId: row.bundleGroupId,
      ref: row.ref,
      reason: "needs_manual_private_review_or_smaller_sample",
      sizeBytes,
      maxCopyBytes,
    });
    continue;
  }

  const localName = `${row.bundleGroupId}-${basename(row.ref)}`;
  const localPath = join(bundleRoot, localName);
  const copy = runGcloud(["storage", "cp", row.ref, localPath]);
  if (copy.status !== 0 || !existsSync(localPath)) {
    skipped.push({
      groupId: row.bundleGroupId,
      ref: row.ref,
      reason: "copy_failed",
      stderr: copy.stderr.trim(),
    });
    continue;
  }

  copied.push({
    groupId: row.bundleGroupId,
    capability: row.capability,
    ref: row.ref,
    localPath,
    sha256: sha256(localPath),
    sizeBytes,
  });
}

const result = {
  ...baseSummary,
  execution: "completed with bounded private artifact bundle",
  privateArtifactAccess: "completed_bounded_allowlist",
  localReviewBundle: copied.length > 0 ? "created" : "not_created",
  copied,
  skipped,
};

writeFileSync(join(bundleRoot, "bundle-result.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(
  join(bundleRoot, "upload-to-chat-instructions.md"),
  [
    `# Upload To Chat Instructions`,
    ``,
    `Bundle ID: ${bundleId}`,
    ``,
    `Upload only the copied files listed in bundle-result.json, with their SHA-256 checksums.`,
    `Do not upload signed URLs, public artifacts, raw prompts, raw provider responses, broad prefixes, or unapproved media.`,
    ``,
    ...copied.map((file) => `- ${file.groupId}: ${file.localPath} (${file.sha256})`),
    ``,
  ].join("\n"),
);

console.log(JSON.stringify(result, null, 2));
