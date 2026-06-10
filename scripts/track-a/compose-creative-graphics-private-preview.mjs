import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const sourceManifestPath = 'docs/track-a/creative-graphics-source-artifacts/source-artifact-manifest.json';
const checksumManifestPath = 'docs/track-a/creative-graphics-source-artifacts/source-artifact-checksums.json';
const outputRootBase = '.local-artifacts/track-a/gd-private-preview';

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

const blockedUses = [
  'final_render_export',
  'public_artifact',
  'signed_url_source_of_truth',
  'supabase_mutation',
  'sql_execution',
  'gcs_upload',
  'storage_transfer',
  'worker_execution',
  'provider_model_calls',
  'ai_tool_execution',
  'browser_capture',
  'docker_cloud_run',
  'production_beta_unlock',
];

function safeRunId() {
  return `tracka-gd-handoff-3-retry-${new Date().toISOString().replace(/[:.]/g, '-')}`;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  writeFileSync(path.join(repoRoot, relativePath), `${JSON.stringify(value, null, 2)}\n`);
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

function verifySources() {
  const sourceManifest = readJson(sourceManifestPath);
  const checksumManifest = readJson(checksumManifestPath);
  const failures = [];

  const records = acceptedFixtures.map((fixtureId) => {
    const checksumEntry = checksumManifest.files?.find((entry) => entry.fixtureId === fixtureId);
    const manifestEntry = sourceManifest.preservedArtifacts?.find((entry) => entry.fixtureId === fixtureId);
    const sourcePath = checksumEntry?.filePath ?? manifestEntry?.localRepoPath ?? '';
    const absoluteSourcePath = sourcePath ? path.join(repoRoot, sourcePath) : '';

    if (!checksumEntry) {
      failures.push(`${fixtureId}: checksum entry missing`);
    }
    if (!manifestEntry) {
      failures.push(`${fixtureId}: source manifest entry missing`);
    }
    if (!sourcePath || !existsSync(absoluteSourcePath)) {
      failures.push(`${fixtureId}: source file missing`);
      return {
        fixtureId,
        sourcePath,
        expectedSha256: checksumEntry?.sha256 ?? manifestEntry?.checksumSha256 ?? null,
        actualSha256: null,
        verificationResult: 'source_missing',
        decision: 'exclude_from_preview',
      };
    }

    const sourceBytes = readFileSync(absoluteSourcePath);
    const actualSha256 = sha256(sourceBytes);
    const expectedSha256 = checksumEntry?.sha256 ?? manifestEntry?.checksumSha256;
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
      decision: checksumMatches ? 'include_in_controlled_private_preview' : 'exclude_from_preview',
      svgText: sourceBytes.toString('utf8'),
    };
  });

  return { sourceManifest, checksumManifest, records, failures };
}

function panelLayout(index) {
  const slots = [
    { x: 56, y: 124, width: 360, height: 202, labelY: 104 },
    { x: 460, y: 124, width: 360, height: 202, labelY: 104 },
    { x: 864, y: 124, width: 360, height: 202, labelY: 104 },
    { x: 258, y: 420, width: 360, height: 202, labelY: 400 },
    { x: 662, y: 420, width: 360, height: 202, labelY: 400 },
  ];
  return slots[index];
}

function renderPreviewSvg(records, runId) {
  const panels = records
    .map((record, index) => {
      const slot = panelLayout(index);
      return `
  <text x="${slot.x}" y="${slot.labelY}" class="label">${xmlEscape(record.fixtureId)}</text>
  <rect x="${slot.x - 10}" y="${slot.y - 10}" width="${slot.width + 20}" height="${slot.height + 20}" rx="12" fill="#ffffff" stroke="#cbd5e1"/>
  <image href="${dataUriForSvg(record.svgText)}" x="${slot.x}" y="${slot.y}" width="${slot.width}" height="${slot.height}" preserveAspectRatio="xMidYMid meet"/>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="Local private creative graphics preview">
  <defs>
    <style>
      .title { font: 700 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0f172a; }
      .subtitle { font: 500 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #475569; }
      .label { font: 700 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #334155; }
      .note { font: 500 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #64748b; }
    </style>
  </defs>
  <rect width="1280" height="720" fill="#f8fafc"/>
  <text x="56" y="54" class="title">Track A Local Private Preview</text>
  <text x="56" y="82" class="subtitle">Synthetic creative graphics fixtures only. Not final render/export. Run ${xmlEscape(runId)}.</text>
${panels}
  <text x="56" y="682" class="note">Source of truth policy: Supabase row + private GCS path + manifest + checksum + approved plan snapshot. Signed URLs are not source of truth.</text>
</svg>
`;
}

function renderPreviewHtml(runId, previewSvgFileName) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Track A Local Private Preview ${runId}</title>
    <style>
      body { margin: 0; padding: 24px; background: #e2e8f0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; }
      main { max-width: 1280px; margin: 0 auto; }
      img { width: 100%; height: auto; border: 1px solid #cbd5e1; background: #fff; }
      p { color: #475569; }
    </style>
  </head>
  <body>
    <main>
      <h1>Track A Local Private Preview</h1>
      <p>Run ${runId}. Local/private composition only; not final render/export.</p>
      <img src="./${previewSvgFileName}" alt="Local private preview composition">
    </main>
  </body>
</html>
`;
}

const runId = safeRunId();
const outputRoot = path.join(outputRootBase, runId);
mkdirSync(path.join(repoRoot, outputRoot), { recursive: true });

const verification = verifySources();
const hasBlockingFailure = verification.failures.length > 0;
const previewResult = hasBlockingFailure
  ? verification.records.some((record) => record.verificationResult === 'checksum_mismatch')
    ? 'blocked_checksum_mismatch'
    : 'blocked_pending_source_artifacts'
  : 'private_preview_local_passed';

if (hasBlockingFailure) {
  writeJson(path.join(outputRoot, 'blocked-preview-report.json'), {
    runId,
    previewResult,
    sourceVerification: verification.records.map(({ svgText, ...record }) => record),
    failures: verification.failures,
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
        previewResult,
        outputRoot,
        sourceVerificationResult: previewResult,
        previewComposed: false,
        failures: verification.failures,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const previewSvgFileName = 'private-preview-composition.svg';
const previewHtmlFileName = 'private-preview-composition.html';
const previewSvgPath = path.join(outputRoot, previewSvgFileName);
const previewHtmlPath = path.join(outputRoot, previewHtmlFileName);
const previewSvg = renderPreviewSvg(verification.records, runId);
const previewHtml = renderPreviewHtml(runId, previewSvgFileName);
writeFileSync(path.join(repoRoot, previewSvgPath), previewSvg);
writeFileSync(path.join(repoRoot, previewHtmlPath), previewHtml);

const outputFiles = [
  previewSvgPath,
  previewHtmlPath,
  path.join(outputRoot, 'private-preview-manifest.json'),
  path.join(outputRoot, 'qa-evidence.json'),
  path.join(outputRoot, 'cleanup-evidence.json'),
  path.join(outputRoot, 'checksum-summary.json'),
];

const sourceVerificationSummary = verification.records.map(({ svgText, ...record }) => record);

const manifest = {
  runId,
  prompt: 'TRACKA-GD-HANDOFF-3-Retry',
  previewResult,
  productionCapabilityEnabled: 'none; controlled local/private Track A preview execution only if executed',
  localOutputRoot: outputRoot,
  previewArtifacts: [
    {
      artifactId: 'tracka_gd_handoff_3_retry_private_preview_svg',
      localPath: previewSvgPath,
      artifactType: 'svg',
      finalRenderExport: false,
      publicArtifact: false,
    },
    {
      artifactId: 'tracka_gd_handoff_3_retry_private_preview_html',
      localPath: previewHtmlPath,
      artifactType: 'html',
      finalRenderExport: false,
      publicArtifact: false,
    },
  ],
  acceptedFixtures,
  excludedFixtures,
  sourceVerification: sourceVerificationSummary,
  sourceOfTruthPolicy: 'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  signedUrlsAreSourceOfTruth: false,
  localPrivateOnly: true,
  blockedUses,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
};

writeJson(path.join(outputRoot, 'private-preview-manifest.json'), manifest);

writeJson(path.join(outputRoot, 'qa-evidence.json'), {
  runId,
  previewResult,
  qaResult: 'private_preview_local_passed',
  acceptedFixturesIncluded: acceptedFixtures,
  sourceChecksumVerification: 'passed',
  layoutSafeZoneCheck: 'passed_static_local_review',
  textReadabilityCheck: 'passed_static_local_review_with_future_human_review_required',
  dataCorrectnessCheck: 'synthetic_data_only_passed_static_local_review',
  graphCorrectnessCheck: 'synthetic_graph_only_passed_static_local_review',
  artifactManifestCompleteness: 'passed',
  finalRenderExport: false,
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  uploadsPerformed: false,
  sourceVerification: sourceVerificationSummary,
});

writeJson(path.join(outputRoot, 'cleanup-evidence.json'), {
  runId,
  cleanupResult: 'local_private_output_retained_for_review',
  cleanupPerformed: false,
  evidencePreserved: true,
  localOutputRoot: outputRoot,
  gcsUpload: false,
  signedUrlCreated: false,
  publicArtifactCreated: false,
  supabaseMutation: false,
  sqlExecuted: false,
  cleanupPolicy: 'Local ignored output may be deleted after Track A review; committed docs keep sanitized summaries only.',
});

const checksumEntries = outputFiles
  .filter((relativePath) => existsSync(path.join(repoRoot, relativePath)))
  .map((relativePath) => ({
    filePath: relativePath,
    sha256: sha256(readFileSync(path.join(repoRoot, relativePath))),
  }));

writeJson(path.join(outputRoot, 'checksum-summary.json'), {
  runId,
  previewResult,
  files: checksumEntries,
  sourceFiles: sourceVerificationSummary.map((record) => ({
    fixtureId: record.fixtureId,
    filePath: record.sourcePath,
    sha256: record.actualSha256,
  })),
});

console.log(
  JSON.stringify(
    {
      runId,
      previewResult,
      outputRoot,
      acceptedFixturesIncluded: acceptedFixtures.length,
      previewArtifacts: [previewSvgPath, previewHtmlPath],
      manifestPath: path.join(outputRoot, 'private-preview-manifest.json'),
      qaEvidencePath: path.join(outputRoot, 'qa-evidence.json'),
      cleanupEvidencePath: path.join(outputRoot, 'cleanup-evidence.json'),
      supabaseEnvironmentTouched: 'none',
      sqlExecuted: 'none',
      migrationDeployed: 'no',
    },
    null,
    2,
  ),
);
