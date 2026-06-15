import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const confirmed = process.env.REEDITPRO_CONFIRM_TRACKA_MISSING_VISUAL_EVIDENCE_BUNDLE === "true";
const bundleId =
  process.env.REEDITPRO_TRACKA_MISSING_VISUAL_EVIDENCE_BUNDLE_ID ??
  `tracka-missing-visual-evidence1-${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "")}`;
const bundleRoot = join("/tmp/reeditpro-tracka-missing-visual-evidence-1", bundleId);

const maxFileBytes = 50 * 1024 * 1024;
const maxTotalBytes = 250 * 1024 * 1024;
const maxListedObjectsPerPrefix = 25;
const maxCopiedFilesPerGroup = 3;
const visualExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".mov", ".webm"]);
const suspiciousNamePattern = /(?:secret|token|key|credentials|signed|jwt|service-role|\.env)/i;
const historicalPrNumbers = [25, 26, 30, 34, 65, 67, 68, 77, 80, 82, 83, 390, 411, 419, 422, 426];

const noScopeStatement =
  "No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A missing-evidence refs from current-source and historical PR evidence.";

const blockers = new Map([
  [
    "birefnet_stronger_visual_proof",
    {
      groupId: "tracka-missing-birefnet-stronger-proof",
      required: "matte/cutout/composite side-by-side and edge closeup",
      match: /phase33|birefnet|mask|representative-frame|text-behind-subject/i,
    },
  ],
  [
    "real_esrgan_before_after_proof",
    {
      groupId: "tracka-missing-real-esrgan-before-after",
      required: "before/after enhancement comparison and detail crop",
      match: /phase34|real[-_ ]?esrgan|enhancement|upscale/i,
    },
  ],
  [
    "opencolorio_openimageio_stronger_proof",
    {
      groupId: "tracka-missing-pro-color-image-proof",
      required: "labeled before/after/contact sheet and transform/image-I/O evidence",
      match: /phase40|pro-color-image|opencolorio|openimageio|kornia|contact-sheet|color/i,
    },
  ],
  [
    "otio_full_private_e2e_proof",
    {
      groupId: "tracka-missing-otio-private-e2e-proof",
      required: "timeline consistency proof and full private E2E review clip or contact sheet",
      match: /phase45|opentimeline|otio|timeline|private-e2e|full visual|hardened-review-export|render-hardening/i,
    },
  ],
]);

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function extensionFor(ref) {
  const match = ref.toLowerCase().match(/\.[a-z0-9]+(?:$|\?)/);
  return match ? match[0].replace("?", "") : "";
}

function isPrivateGsRef(ref) {
  return ref.startsWith("gs://") && !ref.startsWith("gs:///");
}

function isExactObjectRef(ref) {
  return isPrivateGsRef(ref) && !ref.endsWith("/") && !/[?*[\]]/.test(ref) && !ref.includes("..");
}

function isVisualRef(ref) {
  return visualExtensions.has(extensionFor(ref));
}

function isTrackARef(ref) {
  return /\/activation-(?:real-video|mask-runtime|film-runtime|pro-color-image|render-hardening)\//.test(ref);
}

function isNarrowTrackAPrefix(ref) {
  if (!isPrivateGsRef(ref) || !ref.endsWith("/") || !isTrackARef(ref) || /[?*[\]]/.test(ref) || ref.includes("..")) {
    return false;
  }
  const pathParts = ref.replace(/^gs:\/\/[^/]+\//, "").split("/").filter(Boolean);
  return pathParts.length >= 3 && pathParts.some((part) => /^phase\d+[a-z]?-\d{8}T\d+$/i.test(part));
}

function extractGsRefs(body) {
  return [
    ...new Set(
      [...(body.match(/gs:\/\/[^\s`'"<>|)]+/g) ?? [])].map((ref) => ref.replace(/[.,;:]+$/g, "")),
    ),
  ];
}

function inferBlocker(ref, title) {
  const haystack = `${ref} ${title}`;
  for (const [blocker, config] of blockers) {
    if (config.match.test(haystack)) return blocker;
  }
  return "otio_full_private_e2e_proof";
}

function classifyRef(ref, title) {
  if (!isPrivateGsRef(ref)) return "rejected_public_or_signed_url";
  if (!isTrackARef(ref)) return "rejected_non_tracka";
  if (suspiciousNamePattern.test(ref)) return "rejected_suspicious_name";
  if (isExactObjectRef(ref) && isVisualRef(ref)) return "exact_visual_object_candidate";
  if (isExactObjectRef(ref)) return "exact_nonvisual_metadata_ref";
  if (isNarrowTrackAPrefix(ref)) return "narrow_visual_prefix_candidate";
  if (ref.endsWith("/")) return "rejected_prefix_too_broad";
  return title ? "rejected_unrelated_to_remaining_gaps" : "rejected_missing_exact_object";
}

function ghPr(prNumber) {
  const result = spawnSync(
    "gh",
    ["pr", "view", String(prNumber), "--repo", "yuzastudio6-cyber/Reedkt", "--json", "number,title,state,body,url,mergedAt"],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.status !== 0) {
    return { prNumber, viewStatus: "view_failed", stderr: result.stderr.trim(), refs: [] };
  }
  const data = JSON.parse(result.stdout);
  return {
    prNumber,
    title: data.title,
    state: data.state,
    mergedAt: data.mergedAt,
    url: data.url,
    refs: extractGsRefs(data.body ?? ""),
  };
}

function discoverRefs() {
  const prResults = historicalPrNumbers.map(ghPr);
  const rows = [];
  for (const pr of prResults) {
    for (const ref of pr.refs) {
      const blocker = inferBlocker(ref, pr.title ?? "");
      rows.push({
        prNumber: pr.prNumber,
        title: pr.title,
        state: pr.state,
        ref,
        blocker,
        classification: classifyRef(ref, pr.title ?? ""),
      });
    }
  }
  return { prResults, rows };
}

function listPrefix(prefix) {
  const result = spawnSync("gcloud", ["storage", "ls", prefix], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    return { ok: false, stderr: result.stderr.trim(), objects: [] };
  }
  return {
    ok: true,
    stderr: "",
    objects: result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.endsWith("/"))
      .slice(0, maxListedObjectsPerPrefix),
  };
}

function objectSize(ref) {
  const result = spawnSync("gcloud", ["storage", "ls", "-L", ref], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) return { ok: false, size: 0, stderr: result.stderr.trim() };
  const match = result.stdout.match(/Content-Length:\s*(\d+)/i) ?? result.stdout.match(/Size:\s*(\d+)/i);
  if (!match) return { ok: false, size: 0, stderr: "size_not_found" };
  return { ok: true, size: Number(match[1]), stderr: "" };
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function copyObject(row, copiedByBlocker, totalBytes) {
  if (!isVisualRef(row.ref)) return { copied: false, reason: "not_visual_extension", totalBytes };
  if (suspiciousNamePattern.test(row.ref)) return { copied: false, reason: "suspicious_name", totalBytes };
  const countForBlocker = copiedByBlocker.get(row.blocker) ?? 0;
  if (countForBlocker >= maxCopiedFilesPerGroup) return { copied: false, reason: "group_copy_cap_reached", totalBytes };
  const sizeResult = objectSize(row.ref);
  if (!sizeResult.ok) return { copied: false, reason: `metadata_failed:${sizeResult.stderr}`, totalBytes };
  if (sizeResult.size > maxFileBytes) return { copied: false, reason: "file_too_large", totalBytes };
  if (totalBytes + sizeResult.size > maxTotalBytes) return { copied: false, reason: "bundle_too_large", totalBytes };
  mkdirSync(bundleRoot, { recursive: true });
  const target = join(bundleRoot, `${blockers.get(row.blocker)?.groupId ?? row.blocker}-${basename(row.ref)}`);
  const copy = spawnSync("gcloud", ["storage", "cp", row.ref, target], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (copy.status !== 0) return { copied: false, reason: `copy_failed:${copy.stderr.trim()}`, totalBytes };
  copiedByBlocker.set(row.blocker, countForBlocker + 1);
  return {
    copied: true,
    reason: "copied",
    localPath: target,
    size: sizeResult.size,
    sha256: sha256(target),
    totalBytes: totalBytes + sizeResult.size,
  };
}

function executeCopy(rows) {
  const candidates = [];
  for (const row of rows) {
    if (row.classification === "exact_visual_object_candidate") candidates.push(row);
    if (row.classification === "narrow_visual_prefix_candidate") {
      const listed = listPrefix(row.ref);
      if (listed.ok) {
        for (const object of listed.objects) {
          candidates.push({
            ...row,
            ref: object,
            classification: isVisualRef(object) ? "exact_visual_object_candidate" : "exact_nonvisual_metadata_ref",
            sourcePrefix: row.ref,
          });
        }
      }
    }
  }
  const copiedByBlocker = new Map();
  const copied = [];
  const skipped = [];
  let totalBytes = 0;
  for (const row of candidates.filter((candidate) => candidate.classification === "exact_visual_object_candidate")) {
    const result = copyObject(row, copiedByBlocker, totalBytes);
    if (result.copied) {
      totalBytes = result.totalBytes;
      copied.push({ ...row, localPath: result.localPath, size: result.size, sha256: result.sha256 });
    } else {
      skipped.push({ ...row, reason: result.reason });
    }
  }
  return { copied, skipped, totalBytes };
}

function updateConfirmedDocs(result) {
  const checksumRows =
    result.copied.length > 0
      ? result.copied
          .map(
            (row) =>
              `| \`${row.blocker}\` | \`${row.localPath}\` | \`${row.size}\` | \`${row.sha256}\` | copied |`,
          )
          .join("\n")
      : "| none | none | none | none | blocked_no_missing_visual_evidence_artifacts_found |";
  writeFileSync(
    join(root, "docs/track-a/track-a-missing-visual-evidence-1-checksums.md"),
    `# Track A Missing Visual Evidence 1 Checksums\n\nStatus: \`${result.copied.length > 0 ? "created" : "not_created"}\`\n\nBundle ID: \`${bundleId}\`\n\n## Checksum Table\n\n| blocker | local file | size bytes | sha256 | status |\n| --- | --- | --- | --- | --- |\n${checksumRows}\n\n## No-Scope Statement\n\n${noScopeStatement}\n`,
  );
}

read("docs/track-a/track-a-missing-visual-evidence-closure-plan.md");
read("docs/track-a/track-a-caption-quality-1.md");
const discovery = discoverRefs();
const rows = discovery.rows;
const summary = {
  executionRequested: execute,
  confirmed,
  bundleId: execute && confirmed ? bundleId : "not_created_confirmation_absent",
  prBodiesQueried: discovery.prResults.length,
  refsDiscovered: rows.length,
  exactVisualCandidates: rows.filter((row) => row.classification === "exact_visual_object_candidate").length,
  narrowPrefixCandidates: rows.filter((row) => row.classification === "narrow_visual_prefix_candidate").length,
  nonvisualMetadataRefs: rows.filter((row) => row.classification === "exact_nonvisual_metadata_ref").length,
  execution:
    execute && confirmed
      ? "confirmed_bounded_copy_attempted"
      : "blocked_pending_missing_visual_evidence_access_confirmation",
};

if (!execute || !confirmed) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

const copyResult = executeCopy(rows);
updateConfirmedDocs(copyResult);
console.log(
  JSON.stringify(
    {
      ...summary,
      execution: copyResult.copied.length > 0 ? "completed_with_missing_visual_evidence_bundle" : "blocked_no_missing_visual_evidence_artifacts_found",
      localBundlePath: bundleRoot,
      copiedVisualArtifacts: copyResult.copied.length,
      skippedRefs: copyResult.skipped.length,
      totalBytes: copyResult.totalBytes,
    },
    null,
    2,
  ),
);
