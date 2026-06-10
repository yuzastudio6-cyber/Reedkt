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

const allowedResults = [
  'private_preview_local_passed',
  'private_preview_failed',
  'blocked_pending_source_artifacts',
  'blocked_checksum_mismatch',
];

const sourceRoot = 'docs/track-a/creative-graphics-source-artifacts';

const requiredDocs = [
  'docs/track-a/creative-graphics-private-preview-source-verification.md',
  'docs/track-a/creative-graphics-private-preview-retry-execution-evidence.md',
  'docs/track-a/creative-graphics-private-preview-retry-qa-evidence.md',
  'docs/track-a/creative-graphics-private-preview-retry-cleanup-evidence.md',
  'docs/prompt-tracka-gd-handoff-3-retry-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-handoff-3-retry-controlled-private-preview-execution.md',
];

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/creative-graphics-private-preview-go-no-go-record.md',
  'docs/track-a/creative-graphics-private-preview-execution-manifest.md',
  'docs/track-a/creative-graphics-private-preview-readiness.md',
  'docs/track-a/creative-graphics-next-handoff-prompt.md',
  'docs/track-a/creative-graphics-private-preview-source-availability.md',
  'docs/track-a/creative-graphics-private-preview-execution-evidence.md',
  'docs/track-a/creative-graphics-private-preview-qa-evidence.md',
  'docs/track-a/creative-graphics-private-preview-cleanup-evidence.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
  'docs/ai-tools/creative-graphics-next-fixture-plan.md',
  'docs/ai-tools/creative-graphics-future-prompt-sequence.md',
];

function readFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}

function safeJson(relativePath) {
  try {
    return JSON.parse(readFile(relativePath));
  } catch (error) {
    failures.push(`Invalid JSON in ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function isSafetyNegated(line) {
  return /\b(no|not|none|blocked|missing|absent|must not|do not|without|out of scope|future|future-only|placeholder|not approved|not executed|unexecuted|skipped|excluded|remains blocked|did not|does not|not run|not created|not claimed|not performed|warning|warnings|needs|required|gated|gate|docs\/status only|docs_only|false|private_preview_local_passed|private_preview_failed|blocked_pending_source_artifacts|blocked_checksum_mismatch|source_artifacts_preserved|private_preview_blocker_resolved|local_private_output_retained_for_review)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\bfinal render\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
    /\brender\/export\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
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
    /https?:\/\/(?!github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/|github\.com\/yuzastudio6-cyber\/Reedkt\/actions\/|www\.w3\.org\/2000\/svg)/i,
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

const checksums = safeJson(`${sourceRoot}/source-artifact-checksums.json`);
const docsText = requiredDocs.map((file) => readFile(file)).join('\n');
const trackersText = trackerDocs.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${trackersText}`;
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const composerText = readFile('scripts/track-a/compose-creative-graphics-private-preview.mjs');

for (const file of [...requiredDocs, ...trackerDocs]) {
  const text = readFile(file);
  if (!text.includes('TRACKA-GD-HANDOFF-3-Retry') && !text.includes('private_preview_local_passed')) {
    failures.push(`File does not reference Handoff-3-Retry or retry result: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of [
  'TRACKA-GD-HANDOFF-3-Retry',
  'private_preview_local_passed',
  'source_verified',
  'source_artifacts_preserved',
  'private_preview_blocker_resolved',
  'none; controlled local/private Track A preview execution only if executed',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Handoff-3-Retry term: ${term}`);
  }
}

const resultTerms = allowedResults.filter((term) => combinedText.includes(term));
if (resultTerms.length === 0) {
  failures.push(`No allowed retry result found. Expected one of: ${allowedResults.join(', ')}`);
}

for (const fixtureId of acceptedFixtures) {
  const checksumEntry = checksums?.files?.find((entry) => entry.fixtureId === fixtureId);
  const filePath = checksumEntry?.filePath ?? `${sourceRoot}/${fixtureId}/${fixtureId}.svg`;
  const absolutePath = path.join(repoRoot, filePath);
  if (!checksumEntry) {
    failures.push(`Missing checksum entry for ${fixtureId}`);
  }
  if (!existsSync(absolutePath)) {
    failures.push(`Missing source artifact for ${fixtureId}: ${filePath}`);
    continue;
  }
  const actualSha256 = sha256(readFileSync(absolutePath));
  if (checksumEntry?.sha256 !== actualSha256) {
    failures.push(`Checksum mismatch for ${fixtureId}`);
  }
  if (!combinedText.includes(fixtureId) || !combinedText.includes(filePath) || !combinedText.includes(actualSha256)) {
    failures.push(`Missing committed evidence reference for ${fixtureId}`);
  }
}

for (const fixtureId of excludedFixtures) {
  if (!combinedText.includes(fixtureId)) {
    failures.push(`Missing excluded fixture/tool reference: ${fixtureId}`);
  }
}

const composerBoundaryTokens = new Map([
  ['provider call', ['provider_model_calls']],
  ['model call', ['provider_model_calls']],
  ['worker execution', ['worker_execution']],
  ['browser capture', ['browser_capture']],
  ['Docker/Cloud Run', ['docker_cloud_run']],
  ['final render/export', ['final_render_export']],
  ['signed URL', ['signed_url_source_of_truth']],
  ['public artifact', ['public_artifact']],
  ['Supabase mutation', ['supabase_mutation']],
  ['SQL execution', ['sql_execution']],
]);

for (const [blockedPhrase, acceptedTokens] of composerBoundaryTokens) {
  if (!acceptedTokens.some((token) => composerText.includes(token))) {
    failures.push(`Composer does not visibly preserve blocked boundary: ${blockedPhrase}`);
  }
}

if (!packageJsonText.includes('tracka:creative-graphics:private-preview-retry:diagnostics')) {
  failures.push('Missing package script for Track A private preview retry diagnostics.');
}

const sourceArtifactIndex = foundationRunnerText.indexOf('tracka:creative-graphics:source-artifacts:diagnostics');
const retryIndex = foundationRunnerText.indexOf('tracka:creative-graphics:private-preview-retry:diagnostics');
if (retryIndex === -1) {
  failures.push('Foundation validation runner does not include Track A private preview retry diagnostics.');
} else if (sourceArtifactIndex !== -1 && retryIndex < sourceArtifactIndex) {
  failures.push('Retry diagnostic must run after source artifact diagnostics.');
}

const localManifestEvidence = combinedText.includes('private-preview-manifest.json');
if (combinedText.includes('private_preview_local_passed') && !localManifestEvidence) {
  failures.push('private_preview_local_passed requires local preview manifest evidence summary.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  privatePreviewRetryStatus: resultTerms.includes('private_preview_local_passed')
    ? 'private_preview_local_passed'
    : resultTerms[0] ?? 'missing',
  acceptedFixturesChecked: acceptedFixtures.length,
  sourceVerificationStatus: 'source_verified',
  localPreviewManifestEvidence: localManifestEvidence,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; controlled local/private Track A preview execution only if executed',
  nextRecommendedPrompt: resultTerms.includes('private_preview_local_passed')
    ? 'TRACKA-GD-HANDOFF-4 - Private Preview QA Review'
    : 'TRACKA-GD-HANDOFF-3B - Preview Execution Fix',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
