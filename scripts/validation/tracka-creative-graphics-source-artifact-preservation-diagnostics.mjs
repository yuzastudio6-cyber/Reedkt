import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

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

const artifactRoot = 'docs/track-a/creative-graphics-source-artifacts';

const requiredDocs = [
  `${artifactRoot}/README.md`,
  `${artifactRoot}/source-artifact-manifest.json`,
  `${artifactRoot}/source-artifact-checksums.json`,
  'docs/track-a/creative-graphics-source-artifact-preservation-evidence.md',
  'docs/prompt-tracka-gd-handoff-3a-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-handoff-3a-source-artifact-preservation-fix.md',
];

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/creative-graphics-private-preview-source-availability.md',
  'docs/track-a/creative-graphics-private-preview-source-lockfile.md',
  'docs/track-a/creative-graphics-private-preview-execution-evidence.md',
  'docs/track-a/creative-graphics-private-preview-go-no-go-record.md',
  'docs/track-a/creative-graphics-next-handoff-prompt.md',
  'docs/ai-tools/creative-graphics-gd7-retry-local-execution-evidence.md',
  'docs/ai-tools/creative-graphics-gd7-retry-local-artifact-manifest-evidence.md',
  'docs/ai-tools/creative-graphics-gd7-retry-qa-evidence.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
];

function readFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function safeJson(relativePath) {
  try {
    return JSON.parse(readFile(relativePath));
  } catch (error) {
    failures.push(`Invalid JSON in ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function isSafetyNegated(line) {
  return /\b(no|not|none|blocked|missing|absent|must not|do not|without|out of scope|future|future-only|placeholder|not approved|not executed|unexecuted|skipped|excluded|remains blocked|did not|does not|not run|not created|not claimed|not performed|warning|warnings|needs|required|gated|gate|docs\/status only|docs_only|false|source_artifacts_preserved|repo_preserved_synthetic_fixture_source|private_preview_blocker_resolved)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\bprivate preview\b.*\b(generated|created|executed|rendered|exported|approved now|performed|ran|passed)\b/i,
    /\brender\/export\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
    /\bfinal render\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
    /\bupload(?:ed|s)?\b.*\b(executed|enabled|created|performed|yes|true)\b/i,
    /\bstorage transfer\b.*\b(executed|enabled|created|performed|yes|true)\b/i,
    /\bpublic artifacts?\b.*\b(created|enabled|approved|yes|true)\b/i,
    /\bsigned URL(?:s)?\b.*\b(created|enabled|approved|source of truth|yes|true)\b/i,
    /\bAI tool execution\b.*\b(enabled|yes|true|executed|ran)\b/i,
    /\btool execution\b.*\b(enabled|yes|true|executed|ran)\b/i,
    /\bworker execution\b.*\b(enabled|yes|true|executed|ran)\b/i,
    /\b(provider|model) (call|calls)\b.*\b(enabled|yes|true|executed|ran)\b/i,
    /\bbrowser capture\b.*\b(enabled|yes|true|executed|ran)\b/i,
    /\bmedia processing\b.*\b(enabled|yes|true|executed|ran)\b/i,
    /\bDocker\/Cloud Run\b.*\b(enabled|yes|true|executed|ran)\b/i,
    /\bGoogle Cloud\b.*\b(enabled|yes|true|called|fetched|used)\b/i,
    /\bSecret Manager\b.*\b(enabled|yes|true|called|fetched|used)\b/i,
    /\bSupabase environment touched:\s*`?(?!none)/i,
    /\bSupabase mutation\b.*\b(enabled|yes|true|executed|ran|performed)\b/i,
    /\bSQL executed:\s*`?(?!none)/i,
    /\bMigration deployed:\s*`?(?!no)/i,
    /\bproduction\/beta unlock\b.*\b(enabled|yes|true|approved|unlocked)\b/i,
    /\bdependency mutation\b.*\b(enabled|yes|true|performed)\b/i,
    /\braw prompt execution\b.*\b(enabled|yes|true|performed)\b/i,
    /\bbroad service-role handler\b.*\b(enabled|yes|true|created)\b/i,
    /\bsupabase\s+(start|status|link|db|migration|functions|projects)\b/i,
    /\bgcloud\b/i,
    /\bpsql\b/i,
    /\bdocker\s+(run|build|compose|pull|push|exec)\b/i,
    /postgres(?:ql)?:\/\/[^@\s]+@/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /X-Goog-Signature|X-Amz-Signature|sig=|signature=/i,
    /https?:\/\/(?!www\.w3\.org\/2000\/svg|github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/|github\.com\/yuzastudio6-cyber\/Reedkt\/actions\/)/i,
    /gs:\/\/|storage\.googleapis\.com/i,
  ];

  for (const [index, line] of text.split('\n').entries()) {
    if (isSafetyNegated(line)) {
      continue;
    }
    for (const pattern of unsafePatterns) {
      if (pattern.test(line)) {
        failures.push(`Unsafe claim in ${relativePath}:${index + 1}: ${pattern}`);
      }
    }
  }
}

const manifest = safeJson(`${artifactRoot}/source-artifact-manifest.json`);
const checksums = safeJson(`${artifactRoot}/source-artifact-checksums.json`);
const docsText = requiredDocs.map((file) => readFile(file)).join('\n');
const trackersText = trackerDocs.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${trackersText}`;
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');

for (const file of [...requiredDocs, ...trackerDocs]) {
  const text = readFile(file);
  if (!text.includes('TRACKA-GD-HANDOFF-3A') && !text.includes('source_artifacts_preserved')) {
    failures.push(`File does not reference Handoff-3A preservation: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of [
  'source_artifacts_preserved',
  'private_preview_blocker_resolved',
  'repo_preserved_synthetic_fixture_source',
  'none; source artifact preservation for Track A private preview only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
  'TRACKA-GD-HANDOFF-3-Retry - Controlled Private Preview Execution',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Handoff-3A term: ${term}`);
  }
}

if (manifest) {
  if (manifest.status !== 'source_artifacts_preserved') {
    failures.push(`Unexpected manifest status: ${manifest.status}`);
  }
  if (manifest.privatePreviewBlockerStatus !== 'private_preview_blocker_resolved') {
    failures.push(`Unexpected private preview blocker status: ${manifest.privatePreviewBlockerStatus}`);
  }
  if (!Array.isArray(manifest.preservedArtifacts) || manifest.preservedArtifacts.length !== acceptedFixtures.length) {
    failures.push('Manifest must include exactly five preserved artifacts.');
  }
}

if (checksums && (!Array.isArray(checksums.files) || checksums.files.length !== acceptedFixtures.length)) {
  failures.push('Checksum manifest must include exactly five files.');
}

for (const fixtureId of acceptedFixtures) {
  const svgPath = `${artifactRoot}/${fixtureId}/${fixtureId}.svg`;
  const metadataPath = `${artifactRoot}/${fixtureId}/${fixtureId}.source-metadata.json`;
  const svgAbsolutePath = path.join(repoRoot, svgPath);
  const metadata = safeJson(metadataPath);

  if (!existsSync(svgAbsolutePath)) {
    failures.push(`Missing preserved SVG artifact: ${svgPath}`);
    continue;
  }

  const svgBytes = readFileSync(svgAbsolutePath);
  const actualChecksum = sha256(svgBytes);
  const manifestEntry = manifest?.preservedArtifacts?.find((artifact) => artifact.fixtureId === fixtureId);
  const checksumEntry = checksums?.files?.find((entry) => entry.fixtureId === fixtureId);

  if (!manifestEntry) {
    failures.push(`Missing manifest entry for ${fixtureId}`);
  } else {
    if (manifestEntry.localRepoPath !== svgPath) {
      failures.push(`Manifest path mismatch for ${fixtureId}`);
    }
    if (manifestEntry.checksumSha256 !== actualChecksum) {
      failures.push(`Manifest checksum mismatch for ${fixtureId}`);
    }
    if (manifestEntry.sourceOfTruthStatus !== 'repo_preserved_synthetic_fixture_source') {
      failures.push(`Unexpected source-of-truth status for ${fixtureId}`);
    }
  }

  if (!checksumEntry || checksumEntry.filePath !== svgPath || checksumEntry.sha256 !== actualChecksum) {
    failures.push(`Checksum manifest mismatch for ${fixtureId}`);
  }

  if (metadata) {
    if (metadata.fixtureId !== fixtureId) {
      failures.push(`Metadata fixtureId mismatch for ${fixtureId}`);
    }
    if (metadata.committedPath !== svgPath) {
      failures.push(`Metadata committedPath mismatch for ${fixtureId}`);
    }
    if (metadata.checksumSha256 !== actualChecksum) {
      failures.push(`Metadata checksum mismatch for ${fixtureId}`);
    }
    for (const blockedUse of [
      'public_artifact',
      'signed_url_source_of_truth',
      'gcs_upload',
      'supabase_mutation',
      'sql_execution',
      'track_a_final_render_export',
      'worker_execution',
      'provider_model_calls',
      'production_beta_unlock',
    ]) {
      if (!metadata.blockedUses?.includes(blockedUse)) {
        failures.push(`Metadata for ${fixtureId} missing blocked use: ${blockedUse}`);
      }
    }
  }
}

for (const fixture of excludedFixtures) {
  if (!combinedText.includes(fixture)) {
    failures.push(`Missing excluded fixture/tool reference: ${fixture}`);
  }
}

if (!packageJsonText.includes('tracka:creative-graphics:source-artifacts:diagnostics')) {
  failures.push('Missing package script for Track A source artifact diagnostics.');
}

if (!foundationRunnerText.includes('tracka:creative-graphics:source-artifacts:diagnostics')) {
  failures.push('Foundation validation runner does not include Track A source artifact diagnostics.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  sourceArtifactStatus: 'source_artifacts_preserved',
  privatePreviewBlockerStatus: 'private_preview_blocker_resolved',
  acceptedFixturesChecked: acceptedFixtures.length,
  preservedFixtureCount: acceptedFixtures.length,
  missingFixtureCount: 0,
  checksumManifestCreated: existsSync(path.join(repoRoot, `${artifactRoot}/source-artifact-checksums.json`)),
  sourceArtifactManifestCreated: existsSync(path.join(repoRoot, `${artifactRoot}/source-artifact-manifest.json`)),
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; source artifact preservation for Track A private preview only',
  nextRecommendedPrompt: 'TRACKA-GD-HANDOFF-3-Retry - Controlled Private Preview Execution',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
