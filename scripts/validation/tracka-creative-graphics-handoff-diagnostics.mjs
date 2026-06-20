import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const executedTools = [
  'satori_social_cards',
  'd3_dataviz',
  'echarts_dataviz',
  'vega_lite_dataviz',
  'viz_graphviz_diagrams',
];

const skippedTools = ['svg_js_vector_graphics'];
const blockedTools = ['resvg_js_svg_rasterization'];
const groupB = ['anime_js_motion', 'lottie_web_overlays', 'remotion_graphics'];
const groupC = ['pixijs_canvas_graphics', 'three_js_visuals'];

const requiredDocs = [
  'docs/track-a/creative-graphics-handoff-review.md',
  'docs/track-a/creative-graphics-fixture-acceptance-matrix.md',
  'docs/track-a/creative-graphics-private-preview-readiness.md',
  'docs/track-a/creative-graphics-missing-metadata-checklist.md',
  'docs/track-a/creative-graphics-next-handoff-prompt.md',
  'docs/prompt-tracka-gd-handoff-0-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-handoff-0-creative-graphics-review.md',
];

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
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
  return /\b(no|not|none|blocked|must not|do not|without|out of scope|future|future-only|placeholder|unexecuted|not executed|not applicable|skipped|remains blocked|blocked\/skipped|did not|does not|not approved|not run|not created|not claimed|not performed|not present|warning|warnings|needs|required next action|private_preview_not_executed)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\brender\/export\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
    /\bfinal render\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
    /\bprivate preview\b.*\b(generated|created|executed|rendered|exported|approved)\b/i,
    /\bpreview generation\b.*\b(executed|enabled|created|ran|approved)\b/i,
    /\bupload(?:ed|s)?\b.*\b(executed|enabled|created|performed|yes|true)\b/i,
    /\bstorage transfer\b.*\b(executed|enabled|created|performed|yes|true)\b/i,
    /\bpublic artifacts?\b.*\b(created|enabled|approved|yes|true)\b/i,
    /\bsigned URL(?:s)?\b.*\b(created|enabled|approved|source of truth|yes|true)\b/i,
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
    /\bsupabase\s+(start|status|link|db|migration|functions|projects)\b/i,
    /\bgcloud\b/i,
    /\bpsql\b/i,
    /\bdocker\s+(run|build|compose|pull|push|exec)\b/i,
    /postgres(?:ql)?:\/\/[^@\s]+@/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /X-Goog-Signature|X-Amz-Signature|sig=|signature=/i,
    /https?:\/\/(?!github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/|github\.com\/yuzastudio6-cyber\/Reedkt\/actions\/)/i,
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
const trackersText = trackerDocs.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${trackersText}`;
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');

for (const file of [...requiredDocs, ...trackerDocs]) {
  const text = readFile(file);
  if (!text.includes('TRACKA-GD-HANDOFF-0') && !text.includes('tracka_handoff_ready_with_warnings')) {
    failures.push(`File does not reference TRACKA-GD-HANDOFF-0: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of [
  'tracka_handoff_ready_with_warnings',
  'generated_local_fixture_partially_passed / tracka_handoff_ready_with_warnings / private_preview_not_executed',
  'none; Track A creative graphics handoff review only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required handoff term: ${term}`);
  }
}

for (const toolId of executedTools) {
  if (!docsText.includes(toolId) || !trackersText.includes(toolId)) {
    failures.push(`Missing executed tool reference: ${toolId}`);
  }
  if (!docsText.includes('accepted_with_warnings')) {
    failures.push(`Missing accepted_with_warnings classification for executed tools.`);
    break;
  }
}

for (const toolId of skippedTools) {
  if (!combinedText.includes(toolId) || !combinedText.includes('not_applicable_skipped')) {
    failures.push(`Missing skipped tool classification: ${toolId}`);
  }
}

for (const toolId of blockedTools) {
  if (!combinedText.includes(toolId) || !combinedText.includes('tracka_handoff_blocked')) {
    failures.push(`Missing blocked tool classification: ${toolId}`);
  }
}

for (const toolId of [...groupB, ...groupC]) {
  if (!combinedText.includes(toolId)) {
    failures.push(`Missing related out-of-scope tool reference: ${toolId}`);
  }
}

for (const metadataTerm of [
  'safe-zone',
  'text readability',
  'data correctness',
  'graph correctness',
  'approved plan snapshot',
  'private GCS',
  'Supabase artifact row',
  'checksum',
]) {
  if (!docsText.includes(metadataTerm)) {
    failures.push(`Missing metadata warning/checklist term: ${metadataTerm}`);
  }
}

if (!packageJsonText.includes('tracka:creative-graphics:handoff:diagnostics')) {
  failures.push('Missing package script for Track A handoff diagnostics.');
}

if (!foundationRunnerText.includes('tracka:creative-graphics:handoff:diagnostics')) {
  failures.push('Foundation validation runner does not include Track A handoff diagnostics.');
}

const workflowText = readFile('.github/workflows/foundation-validation.yml');
if (!workflowText.includes('codex/rp-gd-7-retry-ai-tools-creative-graphics-controlled-local-fixture-execution')) {
  failures.push('Foundation workflow does not cover the GD-7-Retry PR base branch.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  handoffResult: 'tracka_handoff_ready_with_warnings',
  acceptedWithWarningsCount: executedTools.length,
  skippedCount: skippedTools.length,
  blockedCount: blockedTools.length,
  privatePreviewStatus: 'private_preview_not_executed',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A creative graphics handoff review only',
  nextRecommendedPrompt:
    'TRACKA-GD-HANDOFF-1 - Private Preview Composition Plan for Accepted Creative Graphics Fixtures',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
