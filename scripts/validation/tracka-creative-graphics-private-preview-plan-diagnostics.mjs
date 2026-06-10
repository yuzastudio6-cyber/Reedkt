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
  'docs/track-a/creative-graphics-private-preview-composition-plan.md',
  'docs/track-a/creative-graphics-accepted-fixture-layout-timing-plan.md',
  'docs/track-a/creative-graphics-private-preview-manifest-template.md',
  'docs/track-a/creative-graphics-private-preview-qa-checklist.md',
  'docs/track-a/creative-graphics-private-preview-missing-metadata-remediation-plan.md',
  'docs/track-a/creative-graphics-private-preview-execution-gate-packet.md',
  'docs/track-a/creative-graphics-handoff-2-allowed-blocked-scope.md',
  'docs/prompt-tracka-gd-handoff-1-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-handoff-1-private-preview-composition-plan.md',
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
  'docs/track-a/creative-graphics-next-handoff-prompt.md',
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
  return /\b(no|not|none|blocked|must not|do not|without|out of scope|future|future-only|placeholder|template|unexecuted|not executed|not applicable|skipped|remains blocked|did not|does not|not approved|not run|not created|not claimed|not performed|not present|warning|warnings|needs|required|gated|gate|plan|planning|private_preview_not_executed)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\brender\/export\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
    /\bfinal render\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
    /\bprivate preview\b.*\b(generated|created|executed|rendered|exported|approved|performed|ran)\b/i,
    /\bpreview (media|generation)\b.*\b(executed|enabled|created|ran|approved|generated)\b/i,
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
const workflowText = readFile('.github/workflows/foundation-validation.yml');

for (const file of [...requiredDocs, ...trackerDocs]) {
  const text = readFile(file);
  if (!text.includes('TRACKA-GD-HANDOFF-1') && !text.includes('private_preview_composition_plan_ready_with_warnings')) {
    failures.push(`File does not reference TRACKA-GD-HANDOFF-1: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of [
  'private_preview_composition_plan_ready_with_warnings',
  'private_preview_not_executed',
  'none; Track A private preview composition plan only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  '<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>',
  '<PRIVATE_GCS_PATH_PLACEHOLDER>',
  '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>',
  '<CHECKSUM_PROVENANCE_PLACEHOLDER>',
  'supabase_row_private_gcs_manifest_checksum_approved_snapshot',
  'Signed URLs are not source of truth',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required private preview plan term: ${term}`);
  }
}

for (const fixture of acceptedFixtures) {
  if (!docsText.includes(fixture) || !trackersText.includes(fixture)) {
    failures.push(`Missing accepted fixture reference: ${fixture}`);
  }
}

for (const fixture of excludedFixtures) {
  if (!combinedText.includes(fixture)) {
    failures.push(`Missing excluded fixture/tool reference: ${fixture}`);
  }
}

for (const baseGap of [
  'docs/execution-gates-contract.md',
  'docs/render-preview-export-foundation.md',
  'docs/supabase-milestone-sync-policy.md',
]) {
  if (!docsText.includes(baseGap)) {
    failures.push(`Missing base gap record: ${baseGap}`);
  }
}

if (!packageJsonText.includes('tracka:creative-graphics:private-preview-plan:diagnostics')) {
  failures.push('Missing package script for Track A private preview plan diagnostics.');
}

if (!foundationRunnerText.includes('tracka:creative-graphics:private-preview-plan:diagnostics')) {
  failures.push('Foundation validation runner does not include Track A private preview plan diagnostics.');
}

if (!workflowText.includes('codex/rp-tracka-gd-handoff-0-creative-graphics-review')) {
  failures.push('Foundation workflow does not cover the TRACKA-GD-HANDOFF-0 PR base branch.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  privatePreviewPlanStatus: 'private_preview_composition_plan_ready_with_warnings',
  privatePreviewStatus: 'private_preview_not_executed',
  acceptedFixturesChecked: acceptedFixtures.length,
  excludedFixturesChecked: excludedFixtures.length,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A private preview composition plan only',
  nextRecommendedPrompt: 'TRACKA-GD-HANDOFF-2 - Controlled Private Preview Composition Execution Packet',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}

