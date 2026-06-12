import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const outputRootBase = '.local-artifacts/track-a/group-b-private-preview';

const requiredEvidenceDocs = {
  execution: 'docs/ai-tools/creative-graphics-gd10-group-b-local-execution-evidence.md',
  artifactManifest: 'docs/ai-tools/creative-graphics-gd10-group-b-artifact-manifest-evidence.md',
  qa: 'docs/ai-tools/creative-graphics-gd10-group-b-qa-evidence.md',
  observability: 'docs/ai-tools/creative-graphics-gd10-group-b-observability-evidence.md',
  cleanup: 'docs/ai-tools/creative-graphics-gd10-group-b-cleanup-evidence.md',
  lockfile: 'docs/track-a/creative-graphics-group-b-source-evidence-lockfile.md',
  goNoGo: 'docs/track-a/creative-graphics-group-b-private-preview-go-no-go-record.md',
};

const groupBTools = [
  {
    toolId: 'anime_js_motion',
    expectedMode: 'synthetic_motion_timing_evidence',
    allowedPreviewRole: 'timing_reference_panel',
    requiredEvidenceTerms: [
      'anime_js_motion.motion-timing.json',
      '30 fps',
      '90 frames',
      '3000 ms',
      'seven deterministic plain-object timing samples',
      'passed_with_warnings',
    ],
    warning:
      'Synthetic timing evidence only; no Anime.js runtime was imported or re-run by Handoff-3.',
  },
  {
    toolId: 'lottie_web_overlays',
    expectedMode: 'manifest_only',
    allowedPreviewRole: 'overlay_manifest_placeholder_panel',
    requiredEvidenceTerms: [
      'lottie_web_overlays.manifest-only.json',
      'manifest_only',
      'no browser/player/render path',
      'manifest_only_passed',
    ],
    warning:
      'Manifest-only evidence; no Lottie browser/player behavior was started by Handoff-3.',
  },
  {
    toolId: 'remotion_graphics',
    expectedMode: 'manifest_only',
    allowedPreviewRole: 'composition_manifest_placeholder_panel',
    requiredEvidenceTerms: [
      'remotion_graphics.manifest-only.json',
      'manifest_only',
      'no renderer/export/video path',
      'manifest_only_passed',
    ],
    warning:
      'Manifest-only evidence; no Remotion renderer/export API was called by Handoff-3.',
  },
];

const blockedUses = [
  'anime_js_execution',
  'lottie_browser_player_rendering',
  'remotion_render_export',
  'final_render_export',
  'public_artifact',
  'signed_url_source_of_truth',
  'supabase_mutation',
  'sql_execution',
  'gcs_upload',
  'storage_transfer',
  'worker_execution',
  'provider_model_calls',
  'browser_capture',
  'docker_cloud_run',
  'dependency_mutation',
  'production_beta_unlock',
];

function safeRunId() {
  return `tracka-gd-groupb-handoff-3-${new Date().toISOString().replace(/[:.]/g, '-')}`;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing required evidence doc: ${relativePath}`);
  }
  return readFileSync(absolutePath, 'utf8');
}

function writeJson(relativePath, value) {
  writeFileSync(path.join(repoRoot, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath, value) {
  writeFileSync(path.join(repoRoot, relativePath), value);
}

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function extractRunId(executionEvidence) {
  return executionEvidence.match(/Run ID:\s*`([^`]+)`/)?.[1] ?? 'gd10-run-id-not-found';
}

function extractArtifactRows(artifactEvidence) {
  const rows = new Map();
  for (const line of artifactEvidence.split('\n')) {
    const match = line.match(
      /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([a-f0-9]{64})`\s*\|$/,
    );
    if (!match) {
      continue;
    }
    const [, toolId, localEvidenceFile, artifactType, sha256Value] = match;
    rows.set(toolId, { localEvidenceFile, artifactType, sha256: sha256Value });
  }
  return rows;
}

function verifyEvidence() {
  const docs = Object.fromEntries(
    Object.entries(requiredEvidenceDocs).map(([key, relativePath]) => [key, readText(relativePath)]),
  );
  const combined = Object.values(docs).join('\n');
  const gd10RunId = extractRunId(docs.execution);
  const artifactRows = extractArtifactRows(docs.artifactManifest);
  const failures = [];

  for (const required of [
    'Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_3`',
    'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
    'Signed URLs are not source of truth',
    '"groupBPrivatePreviewExecutionApprovedNow": false',
    '"futureExecutionPromptRequired": true',
    '"remotionFinalRenderApproved": false',
    '"lottieBrowserPlayerApproved": false',
    '"internalBetaApproved": false',
    '"productionApproved": false',
  ]) {
    if (!combined.includes(required)) {
      failures.push(`Missing required packet term: ${required}`);
    }
  }

  const sourceVerification = groupBTools.map((tool) => {
    const artifact = artifactRows.get(tool.toolId);
    const missingTerms = [];
    for (const term of [tool.toolId, ...tool.requiredEvidenceTerms]) {
      if (!combined.includes(term)) {
        missingTerms.push(term);
      }
    }
    if (!artifact) {
      missingTerms.push('artifact manifest row');
    }

    const status = missingTerms.length === 0 ? 'source_evidence_verified' : 'source_evidence_missing';
    if (missingTerms.length > 0) {
      failures.push(`${tool.toolId}: missing ${missingTerms.join(', ')}`);
    }

    return {
      toolId: tool.toolId,
      verificationStatus: status,
      evidenceMode: tool.expectedMode,
      allowedPreviewRole: tool.allowedPreviewRole,
      localEvidenceFile: artifact?.localEvidenceFile ?? null,
      artifactType: artifact?.artifactType ?? null,
      sourceEvidenceSha256: artifact?.sha256 ?? null,
      requiredTermsChecked: tool.requiredEvidenceTerms.length,
      warning: tool.warning,
    };
  });

  return { docs, gd10RunId, sourceVerification, failures };
}

function renderCompositionSvg({ runId, sourceVerification }) {
  const panels = sourceVerification
    .map((record, index) => {
      const x = 80 + index * 390;
      const title = record.toolId;
      const subtitle = record.evidenceMode;
      const lines = [
        `Role: ${record.allowedPreviewRole}`,
        `Evidence: ${record.artifactType ?? 'missing'}`,
        `Status: ${record.verificationStatus}`,
        `SHA: ${(record.sourceEvidenceSha256 ?? 'missing').slice(0, 12)}...`,
      ];
      return `
  <g transform="translate(${x} 150)">
    <rect width="330" height="310" rx="18" fill="#ffffff" stroke="#cbd5e1"/>
    <text x="24" y="48" class="panel-title">${xmlEscape(title)}</text>
    <text x="24" y="78" class="panel-subtitle">${xmlEscape(subtitle)}</text>
    ${lines
      .map(
        (line, lineIndex) =>
          `<text x="24" y="${126 + lineIndex * 34}" class="panel-line">${xmlEscape(line)}</text>`,
      )
      .join('\n    ')}
    <text x="24" y="278" class="panel-note">accepted with warnings</text>
  </g>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="Group B local private preview evidence composition">
  <defs>
    <style>
      .title { font: 700 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0f172a; }
      .subtitle { font: 500 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #475569; }
      .panel-title { font: 700 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0f172a; }
      .panel-subtitle { font: 600 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #334155; }
      .panel-line { font: 500 13px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #475569; }
      .panel-note { font: 700 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #b45309; }
      .footer { font: 500 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #64748b; }
    </style>
  </defs>
  <rect width="1280" height="720" fill="#f8fafc"/>
  <text x="72" y="62" class="title">Group B Local Private Preview Evidence</text>
  <text x="72" y="92" class="subtitle">Handoff-3 local/private composition from committed GD-10 evidence only. Not final render/export. Run ${xmlEscape(
    runId,
  )}.</text>
${panels}
  <text x="72" y="635" class="footer">No Anime.js, Lottie browser/player, or Remotion renderer/export path ran in this step.</text>
  <text x="72" y="662" class="footer">Source of truth policy: Supabase row + private GCS path + manifest + checksum + approved plan snapshot. Signed URLs are not source of truth.</text>
</svg>
`;
}

function renderCompositionHtml(runId, svgFileName) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Group B Local Private Preview ${runId}</title>
    <style>
      body { margin: 0; padding: 24px; background: #e2e8f0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; }
      main { max-width: 1280px; margin: 0 auto; }
      img { width: 100%; height: auto; border: 1px solid #cbd5e1; background: #fff; }
      p { color: #475569; }
    </style>
  </head>
  <body>
    <main>
      <h1>Group B Local Private Preview Evidence</h1>
      <p>Run ${runId}. Local/private composition summary only; not final render/export.</p>
      <img src="./${svgFileName}" alt="Group B local private preview evidence composition">
    </main>
  </body>
</html>
`;
}

const runId = safeRunId();
const outputRoot = path.join(outputRootBase, runId);
mkdirSync(path.join(repoRoot, outputRoot), { recursive: true });

let verification;
try {
  verification = verifyEvidence();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const blockedReportPath = path.join(outputRoot, 'blocked-preview-report.json');
  writeJson(blockedReportPath, {
    runId,
    result: 'blocked_pending_group_b_source_evidence',
    failures: [message],
    blockedUses,
    supabaseUpdateRequired: 'docs/status only',
    supabaseUpdateStatus: 'docs_only',
    supabaseEnvironmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  });
  console.log(
    JSON.stringify(
      {
        runId,
        result: 'blocked_pending_group_b_source_evidence',
        outputRoot,
        failures: [message],
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const hasFailures = verification.failures.length > 0;
const result = hasFailures
  ? 'blocked_pending_group_b_source_evidence'
  : 'group_b_private_preview_local_passed_with_warnings';

const outputFiles = [];
const recordOutput = (relativePath) => {
  const bytes = readFileSync(path.join(repoRoot, relativePath));
  const entry = {
    file: relativePath,
    sha256: sha256(bytes),
  };
  outputFiles.push(entry);
  return entry;
};

if (hasFailures) {
  const blockedReportPath = path.join(outputRoot, 'blocked-preview-report.json');
  writeJson(blockedReportPath, {
    runId,
    result,
    gd10RunId: verification.gd10RunId,
    sourceVerification: verification.sourceVerification,
    failures: verification.failures,
    blockedUses,
    supabaseUpdateRequired: 'docs/status only',
    supabaseUpdateStatus: 'docs_only',
    supabaseEnvironmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  });
  recordOutput(blockedReportPath);
} else {
  const manifestPath = path.join(outputRoot, 'group-b-private-preview-manifest.json');
  const compositionSvgPath = path.join(outputRoot, 'group-b-private-preview-composition.svg');
  const compositionHtmlPath = path.join(outputRoot, 'group-b-private-preview-composition.html');
  const qaEvidencePath = path.join(outputRoot, 'qa-evidence.json');
  const observabilityEvidencePath = path.join(outputRoot, 'observability-evidence.json');
  const cleanupEvidencePath = path.join(outputRoot, 'cleanup-evidence.json');

  writeJson(manifestPath, {
    runId,
    result,
    gd10RunId: verification.gd10RunId,
    fixtures: verification.sourceVerification,
    outputPolicy: 'local_private_ignored_artifacts_only',
    sourceOfTruthPolicy: 'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
    signedUrlsAreSourceOfTruth: false,
    approvedPlanSnapshot: '<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>',
    privateGcsPath: '<PRIVATE_GCS_PATH_PLACEHOLDER>',
    supabaseArtifactRecord: '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>',
    blockedUses,
    supabaseUpdateRequired: 'docs/status only',
    supabaseUpdateStatus: 'docs_only',
    supabaseEnvironmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  });
  writeText(compositionSvgPath, renderCompositionSvg({ runId, sourceVerification: verification.sourceVerification }));
  writeText(compositionHtmlPath, renderCompositionHtml(runId, path.basename(compositionSvgPath)));
  writeJson(qaEvidencePath, {
    runId,
    result: 'group_b_private_preview_qa_passed_with_warnings',
    fixtures: verification.sourceVerification.map((record) => ({
      toolId: record.toolId,
      qaResult: 'accepted_with_warnings',
      warnings: [record.warning],
    })),
    unresolvedWarnings: [
      'Anime timing remains synthetic timing evidence only.',
      'Lottie browser/player behavior remains blocked.',
      'Remotion render/export remains blocked.',
      'Approved plan snapshot and private source-of-truth bindings remain placeholders.',
      'Future human/private-sample review remains required.',
    ],
    blockedUses,
  });
  writeJson(observabilityEvidencePath, {
    runId,
    result: 'group_b_private_preview_observability_recorded',
    auditInputs: Object.values(requiredEvidenceDocs),
    localOutputRoot: outputRoot,
    runtimeImports: 'none',
    networkAccess: 'none',
    uploads: 'none',
    publicArtifacts: 'none',
    signedUrls: 'none',
    supabaseEnvironmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  });
  writeJson(cleanupEvidencePath, {
    runId,
    result: 'group_b_private_preview_cleanup_recorded',
    localOutputRoot: outputRoot,
    committedArtifacts: 'none',
    ignoredArtifactsOnly: true,
    cleanupActionRequired: 'remove .local-artifacts run directory if local disk cleanup is needed',
  });

  for (const relativePath of [
    manifestPath,
    compositionSvgPath,
    compositionHtmlPath,
    qaEvidencePath,
    observabilityEvidencePath,
    cleanupEvidencePath,
  ]) {
    recordOutput(relativePath);
  }

  const checksumSummaryPath = path.join(outputRoot, 'checksum-summary.json');
  writeJson(checksumSummaryPath, {
    runId,
    result,
    files: outputFiles,
  });
  recordOutput(checksumSummaryPath);
}

const summary = {
  runId,
  result,
  gd10RunId: verification.gd10RunId,
  outputRoot,
  sourceVerification: verification.sourceVerification.map((record) => ({
    toolId: record.toolId,
    verificationStatus: record.verificationStatus,
    evidenceMode: record.evidenceMode,
    artifactType: record.artifactType,
    sourceEvidenceSha256: record.sourceEvidenceSha256,
  })),
  outputFiles,
  failures: verification.failures,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
};

console.log(JSON.stringify(summary, null, 2));

if (hasFailures) {
  process.exit(1);
}
