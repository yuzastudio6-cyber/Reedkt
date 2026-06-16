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

function escapeCell(value) {
  return String(value ?? "")
    .replace(/\n/g, " ")
    .replace(/\|/g, "\\|");
}

function tableOrNone(rows, headers, rowMapper, noneRow) {
  if (rows.length === 0) {
    return `| ${noneRow.map(escapeCell).join(" | ")} |\n`;
  }
  return rows.map((row) => `| ${rowMapper(row).map(escapeCell).join(" | ")} |`).join("\n");
}

function classificationSummary(rows) {
  const summary = new Map();
  for (const row of rows) {
    summary.set(row.classification, (summary.get(row.classification) ?? 0) + 1);
  }
  return [...summary.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function blockerStatusRows(result) {
  return [...blockers.keys()].map((blocker) => {
    const copied = result.copied.filter((row) => row.blocker === blocker);
    const skipped = result.skipped.filter((row) => row.blocker === blocker);
    return {
      blocker,
      copiedCount: copied.length,
      skippedCount: skipped.length,
      status:
        copied.length > 0
          ? "evidence_bundle_copied_pending_TRACKA-MISSING-VISUAL-EVIDENCE-2_review"
          : "not_closed_no_review_safe_visual_file_copied",
      closureDecision: "not closed until TRACKA-MISSING-VISUAL-EVIDENCE-2 visual review",
      reason: copied.length > 0 ? "copied visual evidence awaits upload/review" : skipped[0]?.reason ?? "no copied visual evidence",
    };
  });
}

function updateConfirmedDocs(result) {
  const completed = result.copied.length > 0;
  const executionStatus = completed
    ? "completed_with_missing_visual_evidence_bundle"
    : "blocked_no_missing_visual_evidence_artifacts_found";
  const readiness = completed
    ? "ready_after_upload_of_copied_visual_files"
    : "blocked_no_missing_visual_evidence_artifacts_found";
  const manifestStatus = completed ? "created" : "not_created";
  const localPath = completed ? bundleRoot : "not_created";
  const statusRows = blockerStatusRows(result);
  const copiedRows = tableOrNone(
    result.copied,
    ["blocker", "source PR", "source ref", "local file", "size bytes", "sha256", "status"],
    (row) => [
      `\`${row.blocker}\``,
      `#${row.prNumber}`,
      `\`${row.ref}\``,
      `\`${row.localPath}\``,
      `\`${row.size}\``,
      `\`${row.sha256}\``,
      "copied",
    ],
    ["none", "none", "none", "none", "none", "none", executionStatus],
  );
  const skippedRows = tableOrNone(
    result.skipped,
    ["blocker", "source PR", "source ref", "source prefix", "reason"],
    (row) => [
      `\`${row.blocker}\``,
      `#${row.prNumber}`,
      `\`${row.ref}\``,
      row.sourcePrefix ? `\`${row.sourcePrefix}\`` : "none",
      `\`${row.reason}\``,
    ],
    ["none", "none", "none", "none", "none"],
  );
  const statusTable = statusRows
    .map(
      (row) =>
        `| \`${row.blocker}\` | \`${row.status}\` | \`${row.copiedCount}\` | \`${row.skippedCount}\` | ${row.closureDecision} | \`${row.reason}\` |`,
    )
    .join("\n");
  const classRows = classificationSummary(rows)
    .map(([classification, count]) => `| \`${classification}\` | \`${count}\` |`)
    .join("\n");
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
    join(root, "docs/track-a/track-a-missing-visual-evidence-1-discovery-results.md"),
    `# Track A Missing Visual Evidence 1 Discovery Results\n\nStatus: \`${executionStatus}\`\n\n## Discovery Mode\n\nDiscovery source: GitHub PR body metadata and committed docs only.\n\nPrivate artifact access: bounded_confirmed_metadata_list_read_copy\n\nGCS metadata/list/read/copy: bounded_confirmed_for_allowlisted_refs_only\n\nExecution result: \`${executionStatus}\`\n\nBundle ID: \`${bundleId}\`\n\nLocal bundle path: \`${localPath}\`\n\nCopied visual artifacts: \`${result.copied.length}\`\n\nSkipped refs during confirmed copy: \`${result.skipped.length}\`\n\nTotal copied bytes: \`${result.totalBytes}\`\n\n## Discovery Summary\n\n| classification | count |\n| --- | --- |\n${classRows}\n\n## Copied Visual Artifacts\n\n| blocker | source PR | source ref | local file | size bytes | sha256 | status |\n| --- | --- | --- | --- | --- | --- | --- |\n${copiedRows}\n\n## Skipped Or Rejected During Confirmed Copy\n\n| blocker | source PR | source ref | source prefix | reason |\n| --- | --- | --- | --- | --- |\n${skippedRows}\n\n## Discovery Result By Blocker\n\n| blocker | copied files | skipped refs | current limitation |\n| --- | --- | --- | --- |\n${statusRows
      .map(
        (row) =>
          `| \`${row.blocker}\` | \`${row.copiedCount}\` | \`${row.skippedCount}\` | ${row.closureDecision} |`,
      )
      .join("\n")}\n\n## No-Scope Statement\n\n${noScopeStatement}\n`,
  );
  writeFileSync(
    join(root, "docs/track-a/track-a-missing-visual-evidence-1-local-manifest.md"),
    `# Track A Missing Visual Evidence 1 Local Manifest\n\nStatus: \`${manifestStatus}\`\n\n## Bundle\n\nbundleId: \`${bundleId}\`\n\nlocalBundlePath: \`${localPath}\`\n\nprivateArtifactAccess: \`bounded_confirmed_metadata_list_read_copy\`\n\ncopiedVisualArtifacts: \`${result.copied.length}\`\n\ncopiedMetadataArtifacts: \`0\`\n\nskippedRefs: \`${result.skipped.length}\`\n\ntotalCopiedBytes: \`${result.totalBytes}\`\n\nGCS upload: \`not_attempted\`\n\nsignedUrlsCreated: \`0\`\n\npublicArtifactsCreated: \`0\`\n\n## Copied File Manifest\n\n| blocker | source PR | source ref | local file | size bytes | sha256 | status |\n| --- | --- | --- | --- | --- | --- | --- |\n${copiedRows}\n\n## Important Handling Rule\n\nCopied files are local-only review inputs under \`${localPath}\`. They must not be committed, uploaded to GCS, turned into signed URLs, or treated as Track A closure until TRACKA-MISSING-VISUAL-EVIDENCE-2 records the visual review outcome.\n\n## No-Scope Statement\n\n${noScopeStatement}\n`,
  );
  writeFileSync(
    join(root, "docs/track-a/track-a-missing-visual-evidence-1-checksums.md"),
    `# Track A Missing Visual Evidence 1 Checksums\n\nStatus: \`${manifestStatus}\`\n\nBundle ID: \`${bundleId}\`\n\nLocal bundle path: \`${localPath}\`\n\n## Checksum Table\n\n| blocker | local file | size bytes | sha256 | status |\n| --- | --- | --- | --- | --- |\n${checksumRows}\n\n## No-Scope Statement\n\n${noScopeStatement}\n`,
  );
  writeFileSync(
    join(root, "docs/track-a/track-a-missing-visual-evidence-1-upload-to-chat-instructions.md"),
    `# Track A Missing Visual Evidence 1 Upload-To-Chat Instructions\n\nStatus: \`${completed ? "ready_after_upload_of_copied_visual_files" : "blocked_no_missing_visual_evidence_artifacts_found"}\`\n\n## Local Bundle\n\nbundleId: \`${bundleId}\`\n\nlocalBundlePath: \`${localPath}\`\n\ncopiedVisualArtifacts: \`${result.copied.length}\`\n\n## Upload Instructions\n\n${completed ? `Upload only the copied visual files listed below from \`${localPath}\`, then run TRACKA-MISSING-VISUAL-EVIDENCE-2 to record the review outcome.` : "No review-safe visual files were copied. Provide exact missing visual refs or rerun after access/candidate blockers are resolved."}\n\n| blocker | local file | sha256 | upload status |\n| --- | --- | --- | --- |\n${tableOrNone(
      result.copied,
      ["blocker", "local file", "sha256", "upload status"],
      (row) => [`\`${row.blocker}\``, `\`${row.localPath}\``, `\`${row.sha256}\``, "pending_human_upload"],
      ["none", "none", "none", "blocked_no_missing_visual_evidence_artifacts_found"],
    )}\n\n## Upload Requirements\n\n- upload copied visual files only from the local bundle path.\n- include the checksum table from \`docs/track-a/track-a-missing-visual-evidence-1-checksums.md\`.\n- do not upload JSON-only metadata as visual proof.\n- do not use signed URLs as source of truth.\n- do not treat upload as Track A closure until TRACKA-MISSING-VISUAL-EVIDENCE-2 records a visual review outcome.\n\n## No-Scope Statement\n\n${noScopeStatement}\n`,
  );
  writeFileSync(
    join(root, "docs/track-a/track-a-missing-visual-evidence-1-closure-status.md"),
    `# Track A Missing Visual Evidence 1 Closure Status\n\nStatus: \`not_closed_pending_visual_review\`\n\nExecution result: \`${executionStatus}\`\n\n## Closure Matrix\n\n| blocker | TRACKA-MISSING-VISUAL-EVIDENCE-1 status | copied files | skipped refs | closure decision | reason |\n| --- | --- | --- | --- | --- | --- |\n${statusTable}\n\n## Caption Status\n\ncaption quality: closed_by_TRACKA-CAPTION-QUALITY-1\n\ncaptionVisualBurnInRevalidationRequired: true\n\nCaption quality is not reopened here.\n\n## Still Blocked\n\nfullTrackAVisualClosurePassed: false\n\ntrackAInternalBetaReady: false\n\ntrackARuntimeReady: false\n\ntrackAFinalDeliveryReady: false\n\nproductionReady: false\n\nexternalBetaReady: false\n\nNo missing-evidence blocker is fully closed until TRACKA-MISSING-VISUAL-EVIDENCE-2 records visual review outcome.\n\n## No-Scope Statement\n\n${noScopeStatement}\n`,
  );
  writeFileSync(
    join(root, "docs/track-a/track-a-missing-visual-evidence-1-gap-map.md"),
    `# Track A Missing Visual Evidence 1 Gap Map\n\nStatus: \`gap_map_recorded_after_confirmed_bundle_attempt\`\n\n## Current Gaps\n\n| gap | blocker | copied files | next required input |\n| --- | --- | --- | --- |\n| BiRefNet stronger proof | \`birefnet_stronger_visual_proof\` | \`${statusRows.find((row) => row.blocker === "birefnet_stronger_visual_proof")?.copiedCount ?? 0}\` | upload copied file if present, otherwise provide exact matte/cutout/composite side-by-side and edge closeup refs |\n| Real-ESRGAN before/after proof | \`real_esrgan_before_after_proof\` | \`${statusRows.find((row) => row.blocker === "real_esrgan_before_after_proof")?.copiedCount ?? 0}\` | upload copied file if present, otherwise provide exact before/after enhancement comparison or detail crop refs |\n| OpenColorIO/OpenImageIO stronger proof | \`opencolorio_openimageio_stronger_proof\` | \`${statusRows.find((row) => row.blocker === "opencolorio_openimageio_stronger_proof")?.copiedCount ?? 0}\` | upload/review copied contact sheet or allowed visual files |\n| OTIO/full private E2E proof | \`otio_full_private_e2e_proof\` | \`${statusRows.find((row) => row.blocker === "otio_full_private_e2e_proof")?.copiedCount ?? 0}\` | upload/review copied visual proof or provide full private E2E review clip/contact sheet |\n\n## Next Phase\n\nTRACKA-MISSING-VISUAL-EVIDENCE-2 readiness: ${readiness}\n\nTRACKA-CAPTION-QUALITY-2 readiness: ready_for_future_burnin_revalidation_planning\n\nTRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_missing_visual_evidence_review_and_caption_revalidation\n\nInternal beta readiness: blocked_pending_tracka_missing_visual_evidence_review_and_caption_revalidation\n\n## No-Scope Statement\n\n${noScopeStatement}\n`,
  );
  writeFileSync(
    join(root, "docs/activation-phase-tracka-missing-visual-evidence-1-results.md"),
    `# Activation Phase TRACKA-MISSING-VISUAL-EVIDENCE-1 Results\n\nStatus: \`${executionStatus}\`\n\nBranch: \`codex/rp-tracka-missing-visual-evidence-1-exact-artifact-bundle\`\n\nPR title: \`[track-a] Missing visual evidence artifact bundle\`\n\nBase: \`58a3f87a6fc07e3afc6fb699c40c8b744cc75eab\`\n\nPatch type: Track A missing visual evidence exact artifact bundle execution.\n\n## Execution\n\nExecution: ${executionStatus}\n\nBundle ID: \`${bundleId}\`\n\nSource-of-truth audit: passed\n\nAllowlist summary: recorded\n\nDiscovery results: recorded from committed docs and GitHub PR body metadata\n\nCopied visual artifacts: \`${result.copied.length}\`\n\nRejected/skipped refs: \`${result.skipped.length}\`\n\nChecksums: \`${manifestStatus}\`\n\nLocal evidence bundle: \`${localPath}\`\n\nUpload-to-chat instructions: \`${completed ? "ready" : "blocked_no_missing_visual_evidence_artifacts_found"}\`\n\nTotal copied bytes: \`${result.totalBytes}\`\n\n## Copied Visual Artifacts\n\n| blocker | local file | size bytes | sha256 | status |\n| --- | --- | --- | --- | --- |\n${checksumRows}\n\n## Remaining Blockers Targeted\n\n- \`birefnet_stronger_visual_proof\`\n- \`real_esrgan_before_after_proof\`\n- \`opencolorio_openimageio_stronger_proof\`\n- \`otio_full_private_e2e_proof\`\n\nCaption quality is closed by #426 for controlled-test copy and is not reopened.\n\n## Readiness\n\nTRACKA-MISSING-VISUAL-EVIDENCE-2 readiness: ${readiness}\n\nTRACKA-CAPTION-QUALITY-2 readiness: ready_for_future_burnin_revalidation_planning\n\nTRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_missing_visual_evidence_review_and_caption_revalidation\n\nInternal beta readiness: blocked_pending_tracka_missing_visual_evidence_review_and_caption_revalidation\n\nProduction/external beta/broad media: blocked\n\nTrack A runtime/final delivery: blocked\n\n## Evidence Docs\n\n- \`docs/track-a/track-a-missing-visual-evidence-1.md\`\n- \`docs/track-a/track-a-missing-visual-evidence-1-allowlist.md\`\n- \`docs/track-a/track-a-missing-visual-evidence-1-discovery-results.md\`\n- \`docs/track-a/track-a-missing-visual-evidence-1-local-manifest.md\`\n- \`docs/track-a/track-a-missing-visual-evidence-1-checksums.md\`\n- \`docs/track-a/track-a-missing-visual-evidence-1-upload-to-chat-instructions.md\`\n- \`docs/track-a/track-a-missing-visual-evidence-1-closure-status.md\`\n- \`docs/track-a/track-a-missing-visual-evidence-1-gap-map.md\`\n\n## Supabase Update Classification\n\n- Supabase update required: docs/status only\n- Supabase update status: docs_only\n- Supabase environment touched: none\n- SQL executed: none\n- Migration deployed: no\n- Next Supabase action: none\n\n## Human Action Required\n\n${completed ? "Upload copied visual files listed in the upload-to-chat instructions, then run TRACKA-MISSING-VISUAL-EVIDENCE-2 to record the visual review outcome." : "Provide exact missing visual refs or upload representative visual artifacts directly."}\n\n## Known Limitations\n\nNo blocker is fully closed until TRACKA-MISSING-VISUAL-EVIDENCE-2 records visual review outcome.\n\n## No-Scope Statement\n\n${noScopeStatement}\n`,
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
