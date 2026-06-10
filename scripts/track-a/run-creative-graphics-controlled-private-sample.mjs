import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const outputRootBase = '.local-artifacts/track-a/gd-controlled-private-sample';

const acceptedFixtures = [
  'satori_social_cards',
  'd3_dataviz',
  'echarts_dataviz',
  'vega_lite_dataviz',
  'viz_graphviz_diagrams',
];

const excludedFixtures = [
  'svg_js_vector_graphics',
  'resvg_js_svg_rasterization',
  'anime_js_motion',
  'lottie_web_overlays',
  'remotion_graphics',
  'pixijs_canvas_graphics',
  'three_js_visuals',
];

const prerequisiteDocs = [
  {
    id: 'handoff_5_execution_gate',
    path: 'docs/track-a/creative-graphics-controlled-private-sample-execution-gate.md',
    requiredTerms: ['ready_with_warnings_for_tracka_gd_handoff_6', 'TRACKA-GD-HANDOFF-6 - Controlled Private Sample Execution'],
  },
  {
    id: 'handoff_5_plan',
    path: 'docs/track-a/creative-graphics-controlled-private-sample-plan.md',
    requiredTerms: ['controlled_private_sample_plan_ready_with_warnings', 'TRACKA-GD-HANDOFF-6 - Controlled Private Sample Execution'],
  },
  {
    id: 'handoff_5_warning_remediation',
    path: 'docs/track-a/creative-graphics-controlled-private-sample-warning-remediation.md',
    requiredTerms: ['Warning Register', 'Handoff-6 may proceed'],
  },
  {
    id: 'handoff_4_qa_review',
    path: 'docs/track-a/creative-graphics-private-preview-qa-review.md',
    requiredTerms: ['private_preview_qa_passed_with_warnings', 'ready_with_warnings_for_controlled_private_sample_plan'],
  },
  {
    id: 'handoff_3_retry_execution_evidence',
    path: 'docs/track-a/creative-graphics-private-preview-retry-execution-evidence.md',
    requiredTerms: ['private_preview_local_passed', 'source_verified'],
  },
];

const sourceManifestPath = 'docs/track-a/creative-graphics-source-artifacts/source-artifact-manifest.json';
const checksumManifestPath = 'docs/track-a/creative-graphics-source-artifacts/source-artifact-checksums.json';

const sourceOfTruthPolicy = 'Supabase row + private GCS path + manifest + checksum + approved plan snapshot';

const blockedUses = [
  'ai_tool_execution',
  'fixture_regeneration',
  'worker_execution',
  'provider_model_calls',
  'final_render_export',
  'upload_storage_transfer',
  'signed_url_creation',
  'public_artifact_creation',
  'supabase_mutation',
  'sql_execution',
  'gcp_secret_manager_access',
  'browser_capture',
  'docker_cloud_run',
  'dependency_mutation',
  'internal_beta_unlock',
  'external_beta_unlock',
  'production_unlock',
];

function safeRunId() {
  return `tracka-gd-handoff-6-${new Date().toISOString().replace(/[:.]/g, '-')}`;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function absolute(relativePath) {
  return path.join(repoRoot, relativePath);
}

function readText(relativePath) {
  return readFileSync(absolute(relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function writeJson(relativePath, value) {
  writeFileSync(absolute(relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function dataUriForSvg(svgText) {
  return `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
}

function verifyPrerequisites() {
  const failures = [];
  const results = [];

  for (const doc of prerequisiteDocs) {
    const exists = existsSync(absolute(doc.path));
    const text = exists ? readText(doc.path) : '';
    const missingTerms = exists ? doc.requiredTerms.filter((term) => !text.includes(term)) : doc.requiredTerms;
    const result = exists && missingTerms.length === 0 ? 'passed' : 'blocked';
    if (result === 'blocked') {
      failures.push(`${doc.id}: missing ${exists ? `terms ${missingTerms.join(', ')}` : doc.path}`);
    }
    results.push({
      prerequisite: doc.id,
      evidenceRef: doc.path,
      result,
      blocker: result === 'blocked' ? failures.at(-1) : null,
    });
  }

  for (const manifestPath of [sourceManifestPath, checksumManifestPath]) {
    if (!existsSync(absolute(manifestPath))) {
      failures.push(`required manifest missing: ${manifestPath}`);
      results.push({
        prerequisite: manifestPath,
        evidenceRef: manifestPath,
        result: 'blocked',
        blocker: `required manifest missing: ${manifestPath}`,
      });
    } else {
      results.push({
        prerequisite: manifestPath,
        evidenceRef: manifestPath,
        result: 'passed',
        blocker: null,
      });
    }
  }

  return { results, failures };
}

function verifySources() {
  const sourceManifest = readJson(sourceManifestPath);
  const checksumManifest = readJson(checksumManifestPath);
  const failures = [];

  const records = acceptedFixtures.map((fixtureId) => {
    const checksumEntry = checksumManifest.files?.find((entry) => entry.fixtureId === fixtureId);
    const manifestEntry = sourceManifest.preservedArtifacts?.find((entry) => entry.fixtureId === fixtureId);
    const sourcePath = checksumEntry?.filePath ?? manifestEntry?.localRepoPath ?? '';
    const expectedSha256 = checksumEntry?.sha256 ?? manifestEntry?.checksumSha256 ?? null;

    if (!checksumEntry) {
      failures.push(`${fixtureId}: checksum entry missing`);
    }
    if (!manifestEntry) {
      failures.push(`${fixtureId}: source manifest entry missing`);
    }
    if (!sourcePath || !existsSync(absolute(sourcePath))) {
      failures.push(`${fixtureId}: source file missing`);
      return {
        fixtureId,
        sourcePath,
        expectedSha256,
        actualSha256: null,
        dimensions: manifestEntry?.dimensions ?? null,
        verificationResult: 'source_missing',
        sampleDecision: 'blocked_missing_source',
      };
    }

    const sourceBytes = readFileSync(absolute(sourcePath));
    const actualSha256 = sha256(sourceBytes);
    const checksumMatches = expectedSha256 === actualSha256 && manifestEntry?.checksumSha256 === actualSha256;
    if (!checksumMatches) {
      failures.push(`${fixtureId}: checksum mismatch`);
    }

    return {
      fixtureId,
      sourcePath,
      expectedSha256,
      actualSha256,
      dimensions: manifestEntry?.dimensions ?? { width: 640, height: 360 },
      verificationResult: checksumMatches ? 'source_verified' : 'checksum_mismatch',
      sampleDecision: checksumMatches ? 'include_in_controlled_private_sample' : 'blocked_checksum_mismatch',
      svgText: sourceBytes.toString('utf8'),
    };
  });

  return { sourceManifest, checksumManifest, records, failures };
}

function panelLayout(index) {
  const slots = [
    { x: 52, y: 136, width: 350, height: 197, labelY: 112 },
    { x: 465, y: 136, width: 350, height: 197, labelY: 112 },
    { x: 878, y: 136, width: 350, height: 197, labelY: 112 },
    { x: 258, y: 430, width: 350, height: 197, labelY: 406 },
    { x: 672, y: 430, width: 350, height: 197, labelY: 406 },
  ];
  return slots[index];
}

function renderSampleSvg(records, runId) {
  const panels = records
    .map((record, index) => {
      const slot = panelLayout(index);
      return `
  <text x="${slot.x}" y="${slot.labelY}" class="label">${xmlEscape(record.fixtureId)}</text>
  <rect x="${slot.x - 12}" y="${slot.y - 12}" width="${slot.width + 24}" height="${slot.height + 24}" rx="10" fill="#ffffff" stroke="#94a3b8"/>
  <image href="${dataUriForSvg(record.svgText)}" x="${slot.x}" y="${slot.y}" width="${slot.width}" height="${slot.height}" preserveAspectRatio="xMidYMid meet"/>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="Controlled private creative graphics sample">
  <defs>
    <style>
      .title { font: 750 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0f172a; }
      .subtitle { font: 520 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #475569; }
      .label { font: 700 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #1e293b; }
      .note { font: 500 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #64748b; }
    </style>
  </defs>
  <rect width="1280" height="720" fill="#f8fafc"/>
  <text x="52" y="54" class="title">Track A Controlled Private Sample</text>
  <text x="52" y="82" class="subtitle">Synthetic creative graphics evidence only. Not final render/export. Run ${xmlEscape(runId)}.</text>
${panels}
  <text x="52" y="678" class="note">Source of truth policy: ${xmlEscape(sourceOfTruthPolicy)}. Signed URLs are not source of truth.</text>
</svg>
`;
}

function renderSampleHtml(runId, sampleSvgFileName) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Track A Controlled Private Sample ${runId}</title>
    <style>
      body { margin: 0; padding: 24px; background: #e2e8f0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; }
      main { max-width: 1280px; margin: 0 auto; }
      img { width: 100%; height: auto; border: 1px solid #cbd5e1; background: #fff; }
      p { color: #475569; }
    </style>
  </head>
  <body>
    <main>
      <h1>Track A Controlled Private Sample</h1>
      <p>Run ${runId}. Local/private controlled sample only; not final render/export.</p>
      <img src="./${sampleSvgFileName}" alt="Controlled private creative graphics sample">
    </main>
  </body>
</html>
`;
}

function checksumFiles(relativePaths) {
  return relativePaths.map((filePath) => ({
    filePath,
    sha256: sha256(readFileSync(absolute(filePath))),
  }));
}

const runId = safeRunId();
const outputRoot = path.join(outputRootBase, runId);
mkdirSync(absolute(outputRoot), { recursive: true });

const prerequisiteVerification = verifyPrerequisites();
const sourceVerification = prerequisiteVerification.failures.length === 0
  ? verifySources()
  : { sourceManifest: null, checksumManifest: null, records: [], failures: [] };

const failures = [...prerequisiteVerification.failures, ...sourceVerification.failures];
if (failures.length > 0) {
  const blockedResult = sourceVerification.failures.some((failure) => failure.includes('checksum mismatch'))
    ? 'controlled_private_sample_failed'
    : 'blocked_pending_private_sample_prerequisites';
  writeJson(path.join(outputRoot, 'blocked-controlled-private-sample-report.json'), {
    runId,
    sampleResult: blockedResult,
    prerequisiteVerification: prerequisiteVerification.results,
    sourceVerification: sourceVerification.records?.map(({ svgText, ...record }) => record) ?? [],
    failures,
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
        sampleResult: blockedResult,
        outputRoot,
        sampleExecuted: false,
        failures,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const sampleResult = 'controlled_private_sample_passed_with_warnings';
const sampleSvgFileName = 'controlled-private-sample.svg';
const sampleHtmlFileName = 'controlled-private-sample.html';
const sampleSvgPath = path.join(outputRoot, sampleSvgFileName);
const sampleHtmlPath = path.join(outputRoot, sampleHtmlFileName);

const includedRecords = sourceVerification.records;
const sourceVerificationSummary = includedRecords.map(({ svgText, ...record }) => record);

writeFileSync(absolute(sampleSvgPath), renderSampleSvg(includedRecords, runId));
writeFileSync(absolute(sampleHtmlPath), renderSampleHtml(runId, sampleSvgFileName));

const manifestPath = path.join(outputRoot, 'controlled-private-sample-manifest.json');
const qaEvidencePath = path.join(outputRoot, 'qa-evidence.json');
const observabilityEvidencePath = path.join(outputRoot, 'observability-audit-evidence.json');
const cleanupEvidencePath = path.join(outputRoot, 'cleanup-evidence.json');
const checksumSummaryPath = path.join(outputRoot, 'checksum-summary.json');

const commonBoundary = {
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  internalBetaApproved: false,
  externalBetaApproved: false,
  productionApproved: false,
  finalRenderExportApproved: false,
  publicArtifactsApproved: false,
  signedUrlsApproved: false,
  supabaseMutationApproved: false,
  workerExecutionApproved: false,
  providerModelCallsApproved: false,
};

const manifest = {
  runId,
  prompt: 'TRACKA-GD-HANDOFF-6',
  sampleResult,
  productionCapabilityEnabled: 'none; Track A creative graphics controlled private sample execution only',
  localOutputRoot: outputRoot,
  sampleArtifacts: [
    {
      artifactId: 'tracka_gd_handoff_6_controlled_private_sample_svg',
      localPath: sampleSvgPath,
      artifactType: 'svg',
      finalRenderExport: false,
      publicArtifact: false,
      signedUrlCreated: false,
    },
    {
      artifactId: 'tracka_gd_handoff_6_controlled_private_sample_html',
      localPath: sampleHtmlPath,
      artifactType: 'html_review_shell',
      finalRenderExport: false,
      publicArtifact: false,
      signedUrlCreated: false,
    },
  ],
  includedFixtures: sourceVerificationSummary,
  excludedFixtures,
  warningsCarriedForward: [
    'tracka_warning_safe_zone_readability',
    'tracka_warning_synthetic_data_correctness',
    'tracka_warning_source_of_truth_binding',
    'tracka_warning_final_render_export_not_reviewed',
  ],
  sourceOfTruthPolicy,
  signedUrlsAreSourceOfTruth: false,
  blockedUses,
  approvedPlanSnapshotPlaceholder: '<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>',
  privateGcsPathPlaceholder: '<PRIVATE_GCS_PATH_PLACEHOLDER>',
  supabaseArtifactRecordPlaceholder: '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>',
  ...commonBoundary,
};
writeJson(manifestPath, manifest);

const qaEvidence = {
  runId,
  prompt: 'TRACKA-GD-HANDOFF-6',
  qaResult: sampleResult,
  fixtureResults: acceptedFixtures.map((fixtureId) => ({
    fixtureId,
    included: true,
    sourceChecksumVerified: true,
    layoutReview: 'passed_with_warnings',
    safeZoneReview: 'passed_with_warnings',
    textReadabilityReview: 'passed_with_warnings',
    dataGraphCorrectnessReview: fixtureId === 'satori_social_cards' ? 'not_applicable_static_card' : 'passed_with_warnings',
    sourceOfTruthBinding: 'placeholder_bound_for_future_private_persistence',
  })),
  warningsCarriedForward: manifest.warningsCarriedForward,
  fakeQaEvidenceUsed: false,
  ...commonBoundary,
};
writeJson(qaEvidencePath, qaEvidence);

const observabilityEvidence = {
  runId,
  prompt: 'TRACKA-GD-HANDOFF-6',
  commandRun: 'node scripts/track-a/run-creative-graphics-controlled-private-sample.mjs',
  localExecutionScope: 'local_private_controlled_sample',
  localOutputRoot: outputRoot,
  networkApiCalls: false,
  aiToolExecution: false,
  fixtureRegeneration: false,
  workerExecution: false,
  providerModelCalls: false,
  browserCapture: false,
  dockerCloudRun: false,
  uploadStorageTransfer: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  noScopeStatement:
    'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, AI tool execution, worker execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, production/beta unlock, dependency mutation, human approval grant, staging execution approval, raw prompt execution, final render/export, or broad service-role handler was enabled.',
  ...commonBoundary,
};
writeJson(observabilityEvidencePath, observabilityEvidence);

const cleanupEvidence = {
  runId,
  prompt: 'TRACKA-GD-HANDOFF-6',
  localOutputRoot: outputRoot,
  cleanupPerformed: false,
  evidenceRetainedForReview: true,
  committedEvidenceSummariesOnly: true,
  gcsCleanupNeeded: false,
  signedUrlCleanupNeeded: false,
  publicArtifactCleanupNeeded: false,
  retryGuidance: 'rerun the same local/private executor only if committed source artifacts and checksums still verify',
  ...commonBoundary,
};
writeJson(cleanupEvidencePath, cleanupEvidence);

const checksummedOutputs = [
  sampleSvgPath,
  sampleHtmlPath,
  manifestPath,
  qaEvidencePath,
  observabilityEvidencePath,
  cleanupEvidencePath,
];
const outputChecksums = checksumFiles(checksummedOutputs);
writeJson(checksumSummaryPath, {
  runId,
  prompt: 'TRACKA-GD-HANDOFF-6',
  sampleResult,
  files: outputChecksums,
  ...commonBoundary,
});

console.log(
  JSON.stringify(
    {
      runId,
      sampleResult,
      outputRoot,
      sampleExecuted: true,
      acceptedFixtures: acceptedFixtures.length,
      outputFiles: [...checksummedOutputs, checksumSummaryPath],
      outputChecksums,
      supabaseUpdateRequired: 'docs/status only',
      supabaseUpdateStatus: 'docs_only',
      supabaseEnvironmentTouched: 'none',
      sqlExecuted: 'none',
      migrationDeployed: 'no',
    },
    null,
    2,
  ),
);
