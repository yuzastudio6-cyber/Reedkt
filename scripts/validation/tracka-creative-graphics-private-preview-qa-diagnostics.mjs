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

const requiredDocs = [
  'docs/track-a/creative-graphics-private-preview-qa-review.md',
  'docs/track-a/creative-graphics-private-preview-qa-acceptance-matrix.md',
  'docs/track-a/creative-graphics-private-preview-warning-blocker-register.md',
  'docs/track-a/creative-graphics-controlled-private-sample-readiness.md',
  'docs/track-a/creative-graphics-private-preview-qa-cleanup-review.md',
  'docs/prompt-tracka-gd-handoff-4-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-handoff-4-private-preview-qa-review.md',
];

const evidenceDocs = [
  'docs/track-a/creative-graphics-private-preview-retry-execution-evidence.md',
  'docs/track-a/creative-graphics-private-preview-retry-qa-evidence.md',
  'docs/track-a/creative-graphics-private-preview-retry-cleanup-evidence.md',
  'docs/track-a/creative-graphics-private-preview-source-verification.md',
  'docs/track-a/creative-graphics-source-artifacts/source-artifact-manifest.json',
  'docs/track-a/creative-graphics-source-artifacts/source-artifact-checksums.json',
];

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/creative-graphics-private-preview-go-no-go-record.md',
  'docs/track-a/creative-graphics-private-preview-readiness.md',
  'docs/track-a/creative-graphics-next-handoff-prompt.md',
  'docs/track-a/creative-graphics-private-preview-retry-qa-evidence.md',
  'docs/track-a/creative-graphics-private-preview-retry-execution-evidence.md',
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

function isSafetyNegated(line) {
  return /\b(no|not|none|blocked|missing|absent|must not|do not|without|out of scope|future|future-only|placeholder|not approved|not executed|unexecuted|skipped|excluded|remains blocked|did not|does not|not run|not created|not claimed|not performed|warning|warnings|required|gated|gate|docs\/status only|docs_only|false|private_preview_qa_passed_with_warnings|ready_with_warnings_for_controlled_private_sample_plan|accepted_with_warnings|private_preview_local_passed)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\bAI tool execution\b.*\b(enabled|yes|true|performed|ran)\b/i,
    /\bfixture regeneration\b.*\b(enabled|yes|true|performed|ran)\b/i,
    /\bfinal render\b.*\b(enabled|created|ran|approved|ready|passed)\b/i,
    /\brender\/export\b.*\b(enabled|created|ran|approved|ready|passed)\b/i,
    /\bupload(?:ed|s)?\b.*\b(enabled|created|performed|yes|true)\b/i,
    /\bstorage transfer\b.*\b(enabled|created|performed|yes|true)\b/i,
    /\bpublic artifacts?\b.*\b(created|enabled|approved|yes|true)\b/i,
    /\bsigned URL(?:s)?\b.*\b(created|enabled|approved|source of truth|yes|true)\b/i,
    /\bworker execution\b.*\b(enabled|yes|true|performed|ran)\b/i,
    /\b(provider|model) (call|calls|execution)\b.*\b(enabled|yes|true|performed|ran)\b/i,
    /\bbrowser capture\b.*\b(enabled|yes|true|performed|ran)\b/i,
    /\bDocker\/Cloud Run\b.*\b(enabled|yes|true|performed|ran)\b/i,
    /\bmedia processing\b.*\b(enabled|yes|true|performed|ran)\b/i,
    /\bSupabase environment touched:\s*`?(?!none)/i,
    /\bSupabase mutation\b.*\b(enabled|yes|true|performed|ran)\b/i,
    /\bSQL executed:\s*`?(?!none)/i,
    /\bMigration deployed:\s*`?(?!no)/i,
    /\bGoogle Cloud\b.*\b(enabled|yes|true|called|fetched|used)\b/i,
    /\bSecret Manager\b.*\b(enabled|yes|true|called|fetched|used)\b/i,
    /\bdependency mutation\b.*\b(enabled|yes|true|performed)\b/i,
    /\braw prompt execution\b.*\b(enabled|yes|true|performed)\b/i,
    /\bproduction\/beta unlock\b.*\b(enabled|yes|true|approved|unlocked)\b/i,
    /\bbeta\b.*\b(unlocked|approved|ready)\b/i,
    /\bproduction\b.*\b(unlocked|approved|ready)\b/i,
    /\bfake QA evidence\b.*\b(enabled|yes|true|used|accepted)\b/i,
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

const docsText = requiredDocs.map((file) => readFile(file)).join('\n');
const evidenceText = evidenceDocs.map((file) => readFile(file)).join('\n');
const trackersText = trackerDocs.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${evidenceText}\n${trackersText}`;
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const workflowText = readFile('.github/workflows/foundation-validation.yml');

for (const file of [...requiredDocs, ...trackerDocs]) {
  const text = readFile(file);
  if (!text.includes('TRACKA-GD-HANDOFF-4') && !text.includes('private_preview_qa_passed_with_warnings')) {
    failures.push(`File does not reference Handoff-4 QA status: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of [
  'TRACKA-GD-HANDOFF-4',
  'private_preview_qa_passed_with_warnings',
  'ready_with_warnings_for_controlled_private_sample_plan',
  'accepted_with_warnings',
  'TRACKA-GD-HANDOFF-5 - Controlled Private Sample Planning',
  'none; Track A creative graphics private preview QA review only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Handoff-4 term: ${term}`);
  }
}

for (const fixtureId of acceptedFixtures) {
  if (!combinedText.includes(fixtureId)) {
    failures.push(`Missing accepted fixture reference: ${fixtureId}`);
  }
  const matrixPattern = new RegExp(`\\|\\s*\`${fixtureId}\`[\\s\\S]*?\`accepted_with_warnings\`\\s*\\|`);
  if (!matrixPattern.test(docsText)) {
    failures.push(`Missing accepted_with_warnings matrix row for ${fixtureId}`);
  }
}

for (const fixtureId of excludedFixtures) {
  if (!combinedText.includes(fixtureId)) {
    failures.push(`Missing excluded fixture/tool reference: ${fixtureId}`);
  }
}

const acceptedWarningCount = (docsText.match(/`accepted_with_warnings`/g) ?? []).length;
if (acceptedWarningCount < acceptedFixtures.length) {
  failures.push('Expected at least five accepted_with_warnings rows in Handoff-4 docs.');
}

for (const evidenceTerm of [
  'private_preview_local_passed',
  'source_verified',
  'private-preview-manifest.json',
  'qa-evidence.json',
  'cleanup-evidence.json',
]) {
  if (!evidenceText.includes(evidenceTerm) && !docsText.includes(evidenceTerm)) {
    failures.push(`Missing prior evidence term: ${evidenceTerm}`);
  }
}

if (!packageJsonText.includes('tracka:creative-graphics:private-preview-qa:diagnostics')) {
  failures.push('Missing package script for Track A private preview QA diagnostics.');
}

const retryIndex = foundationRunnerText.indexOf('tracka:creative-graphics:private-preview-retry:diagnostics');
const qaIndex = foundationRunnerText.indexOf('tracka:creative-graphics:private-preview-qa:diagnostics');
if (qaIndex === -1) {
  failures.push('Foundation validation runner does not include Track A private preview QA diagnostics.');
} else if (retryIndex !== -1 && qaIndex < retryIndex) {
  failures.push('Private preview QA diagnostics must run after private preview retry diagnostics.');
}

if (!workflowText.includes('codex/rp-tracka-gd-handoff-3-retry-controlled-private-preview-execution')) {
  failures.push('Foundation workflow does not cover PRs targeting the Handoff-3-Retry base branch.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  privatePreviewQaResult: combinedText.includes('private_preview_qa_passed_with_warnings')
    ? 'private_preview_qa_passed_with_warnings'
    : 'missing',
  fixturesReviewed: acceptedFixtures.length,
  fixturesAcceptedWithWarnings: acceptedFixtures.length,
  controlledPrivateSampleReadiness: combinedText.includes('ready_with_warnings_for_controlled_private_sample_plan')
    ? 'ready_with_warnings_for_controlled_private_sample_plan'
    : 'missing',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A creative graphics private preview QA review only',
  nextRecommendedPrompt: 'TRACKA-GD-HANDOFF-5 - Controlled Private Sample Planning',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
