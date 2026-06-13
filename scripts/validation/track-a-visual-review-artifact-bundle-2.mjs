import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const confirmed = process.env.REEDITPRO_CONFIRM_TRACKA_EXACT_VISUAL_ARTIFACT_BUNDLE === "true";
const bundleId =
  process.env.REEDITPRO_TRACKA_VISUAL_REVIEW_ARTIFACT_BUNDLE_2_ID ??
  `tracka-visual-review-artifact-bundle2-${new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "")}`;
const bundleRoot = join("/tmp/reeditpro-tracka-visual-review-bundle-2", bundleId);

const maxFileBytes = 50 * 1024 * 1024;
const maxTotalBytes = 250 * 1024 * 1024;
const maxListedObjectsPerPrefix = 25;
const maxCopiedFilesPerGroup = 3;
const visualExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".mov", ".webm"]);
const suspiciousNamePattern = /(?:secret|token|key|credentials|signed|jwt|service-role|\.env)/i;
const noScopeStatement =
  "No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A visual review artifact refs from current-source evidence.";

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function parseArtifactBundleRows(markdown) {
  return markdown
    .split(/\r?\n/)
    .filter((line) => line.startsWith("| `tracka-bundle-"))
    .map((line) => {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim().replace(/^`|`$/g, ""));
      const [groupId, capability, sourcePr, runId, ref, artifactType, requiredForReview, reviewPurpose] = cells;
      return { groupId, capability, sourcePr, runId, ref, artifactType, requiredForReview, reviewPurpose };
    });
}

function extensionFor(ref) {
  const match = ref.toLowerCase().match(/\.[a-z0-9]+(?:$|\?)/);
  return match ? match[0].replace("?", "") : "";
}

function isVisualRef(ref) {
  return visualExtensions.has(extensionFor(ref));
}

function isPrivateGsRef(ref) {
  return ref.startsWith("gs://") && !ref.startsWith("gs:///");
}

function isExactObjectRef(ref) {
  return isPrivateGsRef(ref) && !ref.endsWith("/") && !/[?*[\]]/.test(ref) && !ref.includes("..");
}

function isNarrowTrackAPrefix(row) {
  return (
    row.groupId === "tracka-bundle-remotion-render-preview" &&
    row.ref === "gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/"
  );
}

function classifyRow(row) {
  if (row.ref === "artifact_ref_not_recorded_in_current_source") {
    return { status: "rejected_missing_ref", allowedOperation: "metadata_only" };
  }
  if (row.ref.startsWith("http://") || row.ref.startsWith("https://")) {
    return { status: "rejected_public_or_signed_url", allowedOperation: "metadata_only" };
  }
  if (row.ref.endsWith("/")) {
    if (isNarrowTrackAPrefix(row)) {
      return { status: "bounded_prefix_discovery_allowed", allowedOperation: "list_only_then_copy_if_small_visual_file" };
    }
    return { status: "rejected_prefix_too_broad_needs_exact_object_ref", allowedOperation: "metadata_only" };
  }
  if (!isExactObjectRef(row.ref)) {
    return { status: "rejected_unsafe_ref", allowedOperation: "metadata_only" };
  }
  if (!isVisualRef(row.ref)) {
    return { status: "rejected_nonvisual_metadata_ref", allowedOperation: "metadata_only" };
  }
  if (suspiciousNamePattern.test(basename(row.ref))) {
    return { status: "rejected_suspicious_name", allowedOperation: "metadata_only" };
  }
  return { status: "exact_visual_object_allowed", allowedOperation: "copy_if_small_visual_file" };
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

function safeLocalName(groupId, ref) {
  return `${groupId}-${basename(ref).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

const sourceManifest = read("docs/track-a/track-a-visual-review-artifact-bundle-manifest.md");
const rows = parseArtifactBundleRows(sourceManifest);
const classifiedRows = rows.map((row) => ({ ...row, ...classifyRow(row) }));
const exactObjectAllowlist = classifiedRows.filter((row) => row.status === "exact_visual_object_allowed");
const boundedPrefixDiscoveryAllowlist = classifiedRows.filter((row) => row.status === "bounded_prefix_discovery_allowed");
const rejectedRows = classifiedRows.filter(
  (row) => row.status !== "exact_visual_object_allowed" && row.status !== "bounded_prefix_discovery_allowed",
);

const baseSummary = {
  bundleId,
  sourceEvidence: ["#390", "#393", "#400", "#403", "#408"],
  baseCommit: "51cd4849c2dc31d4b59d7b673e27437493d0fcac",
  noScopeStatement,
  executionRequested: execute,
  executionConfirmed: confirmed,
  bundleRoot,
  privateArtifactAccess: "not_attempted",
  localVisualBundle: "not_created",
  trackaVisualReview2cReadiness: "blocked_pending_exact_visual_artifact_access_confirmation",
  exactObjectAllowlist: exactObjectAllowlist.map((row) => ({
    groupId: row.groupId,
    capability: row.capability,
    ref: row.ref,
    allowedOperation: row.allowedOperation,
    maxFileBytes,
    maxTotalBytes,
  })),
  boundedPrefixDiscoveryAllowlist: boundedPrefixDiscoveryAllowlist.map((row) => ({
    groupId: row.groupId,
    capability: row.capability,
    prefix: row.ref,
    allowedOperation: row.allowedOperation,
    maxListedObjectsPerPrefix,
    maxCopiedFilesPerGroup,
    maxFileBytes,
    maxTotalBytes,
  })),
  rejectedRows: rejectedRows.map((row) => ({
    groupId: row.groupId,
    capability: row.capability,
    ref: row.ref,
    reason: row.status,
  })),
};

if (!execute || !confirmed) {
  const reason = !execute
    ? "manifest_only_no_execute_requested"
    : "blocked_pending_exact_visual_artifact_access_confirmation";
  console.log(
    JSON.stringify(
      {
        ...baseSummary,
        execution: "blocked_pending_exact_visual_artifact_access_confirmation",
        reason,
        copiedVisualArtifacts: [],
        skippedRefs: rejectedRows.map((row) => ({
          groupId: row.groupId,
          ref: row.ref,
          reason: row.status,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

mkdirSync(bundleRoot, { recursive: true });

const discoveredCandidates = [];
const copied = [];
const skipped = [];
let totalCopiedBytes = 0;

for (const row of exactObjectAllowlist) {
  discoveredCandidates.push({ ...row, discoveredRef: row.ref, discoverySource: "exact_object_allowlist" });
}

for (const row of boundedPrefixDiscoveryAllowlist) {
  const list = runGcloud(["storage", "ls", row.ref]);
  if (list.status !== 0) {
    skipped.push({ groupId: row.groupId, ref: row.ref, reason: "prefix_list_failed", stderr: list.stderr.trim() });
    continue;
  }
  const listedRefs = list.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.startsWith(row.ref))
    .filter((line) => !line.endsWith("/"))
    .slice(0, maxListedObjectsPerPrefix);

  for (const discoveredRef of listedRefs) {
    discoveredCandidates.push({ ...row, discoveredRef, discoverySource: "bounded_prefix_discovery" });
  }
}

const visualCandidates = discoveredCandidates.filter((candidate) => {
  if (!isVisualRef(candidate.discoveredRef)) {
    skipped.push({ groupId: candidate.groupId, ref: candidate.discoveredRef, reason: "rejected_nonvisual_metadata_ref" });
    return false;
  }
  if (suspiciousNamePattern.test(basename(candidate.discoveredRef))) {
    skipped.push({ groupId: candidate.groupId, ref: candidate.discoveredRef, reason: "rejected_suspicious_name" });
    return false;
  }
  return true;
});

const copiedByGroup = new Map();

for (const candidate of visualCandidates) {
  const countForGroup = copiedByGroup.get(candidate.groupId) ?? 0;
  if (countForGroup >= maxCopiedFilesPerGroup) {
    skipped.push({ groupId: candidate.groupId, ref: candidate.discoveredRef, reason: "max_group_copy_count_reached" });
    continue;
  }

  const stat = runGcloud(["storage", "ls", "-L", candidate.discoveredRef]);
  if (stat.status !== 0) {
    skipped.push({ groupId: candidate.groupId, ref: candidate.discoveredRef, reason: "metadata_check_failed", stderr: stat.stderr.trim() });
    continue;
  }
  const sizeBytes = parseSize(stat.stdout);
  if (sizeBytes === null) {
    skipped.push({ groupId: candidate.groupId, ref: candidate.discoveredRef, reason: "size_not_available" });
    continue;
  }
  if (sizeBytes > maxFileBytes) {
    skipped.push({ groupId: candidate.groupId, ref: candidate.discoveredRef, reason: "needs_smaller_review_sample", sizeBytes, maxFileBytes });
    continue;
  }
  if (totalCopiedBytes + sizeBytes > maxTotalBytes) {
    skipped.push({ groupId: candidate.groupId, ref: candidate.discoveredRef, reason: "total_bundle_size_cap_reached", sizeBytes, maxTotalBytes });
    continue;
  }

  const localPath = join(bundleRoot, safeLocalName(candidate.groupId, candidate.discoveredRef));
  const copy = runGcloud(["storage", "cp", candidate.discoveredRef, localPath]);
  if (copy.status !== 0 || !existsSync(localPath)) {
    skipped.push({ groupId: candidate.groupId, ref: candidate.discoveredRef, reason: "copy_failed", stderr: copy.stderr.trim() });
    continue;
  }

  totalCopiedBytes += sizeBytes;
  copiedByGroup.set(candidate.groupId, countForGroup + 1);
  copied.push({
    groupId: candidate.groupId,
    capability: candidate.capability,
    sourceRef: candidate.discoveredRef,
    localPath,
    sizeBytes,
    extension: extensionFor(candidate.discoveredRef),
    sha256: sha256(localPath),
    reviewPurpose: candidate.reviewPurpose,
  });
}

const blocker =
  copied.length > 0
    ? null
    : visualCandidates.length === 0
      ? "no_review_safe_visual_artifacts_found"
      : skipped.some((item) => item.reason === "needs_smaller_review_sample")
        ? "all_candidate_visual_files_too_large"
        : "no_exact_visual_artifacts_found";

const result = {
  ...baseSummary,
  execution: copied.length > 0 ? "completed_with_visual_artifact_bundle" : "blocked_no_visual_artifacts_copied",
  privateArtifactAccess: "completed_bounded_visual_allowlist",
  localVisualBundle: copied.length > 0 ? "created" : "not_created",
  trackaVisualReview2cReadiness:
    copied.length > 0 ? "ready_after_upload_of_copied_visual_bundle_files" : `blocked_${blocker}`,
  copiedVisualArtifacts: copied,
  skippedRefs: [...baseSummary.rejectedRows, ...skipped],
  blocker,
};

writeFileSync(join(bundleRoot, "bundle-2-result.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(
  join(bundleRoot, "upload-to-chat-instructions.md"),
  [
    "# TRACKA-VISUAL-REVIEW-ARTIFACT-BUNDLE-2 Upload Instructions",
    "",
    `Bundle ID: ${bundleId}`,
    `Local bundle root: ${bundleRoot}`,
    "",
    copied.length > 0
      ? "Upload only the copied visual files listed below with their SHA-256 checksums."
      : "No visual files were copied. Provide exact review-safe visual artifact refs or upload representative frames/videos/contact sheets.",
    "",
    ...copied.map((file) => `- ${file.groupId}: ${file.localPath} (${file.sha256})`),
    "",
    "Do not upload signed URLs, public artifacts, raw prompts, raw provider responses, logs, secrets, broad prefixes, or unrelated media.",
    "",
  ].join("\n"),
);

console.log(JSON.stringify(result, null, 2));
