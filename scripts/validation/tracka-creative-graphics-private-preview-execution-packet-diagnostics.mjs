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
  'docs/track-a/creative-graphics-controlled-private-preview-execution-packet.md',
  'docs/track-a/creative-graphics-private-preview-source-lockfile.md',
  'docs/track-a/creative-graphics-private-preview-future-command-template.md',
  'docs/track-a/creative-graphics-private-preview-execution-manifest.md',
  'docs/track-a/creative-graphics-private-preview-execution-qa-packet.md',
  'docs/track-a/creative-graphics-private-preview-cleanup-rollback-packet.md',
  'docs/track-a/creative-graphics-private-preview-go-no-go-record.md',
  'docs/prompt-tracka-gd-handoff-2-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-handoff-2-controlled-private-preview-execution-packet.md',
];

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/creative-graphics-next-handoff-prompt.md',
  'docs/track-a/creative-graphics-private-preview-readiness.md',
  'docs/track-a/creative-graphics-private-preview-execution-gate-packet.md',
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
  return /\b(no|not|none|blocked|must not|do not|without|out of scope|future|future-only|placeholder|template|not approved|not executed|unexecuted|skipped|excluded|remains blocked|did not|does not|not run|not created|not claimed|not performed|warning|warnings|needs|required|gated|gate|packet|docs\/status only|docs_only|private_preview_not_executed|false)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\brender\/export\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
    /\bfinal render\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
    /\bprivate preview\b.*\b(generated|created|executed|rendered|exported|approved now|performed|ran)\b/i,
    /\bpreview media\b.*\b(executed|enabled|created|ran|approved|generated)\b/i,
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
  if (!text.includes('TRACKA-GD-HANDOFF-2') && !text.includes('private_preview_execution_packet_ready')) {
    failures.push(`File does not reference TRACKA-GD-HANDOFF-2: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of [
  'private_preview_execution_packet_ready',
  'ready_for_tracka_gd_handoff_3_controlled_private_preview_execution',
  'private_preview_not_executed',
  'none; Track A controlled private preview execution packet only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
  'privatePreviewExecutionApprovedNow": false',
  'futureExecutionPromptRequired": true',
  'finalRenderExportApproved": false',
  'publicArtifactsApproved": false',
  'signedUrlsApproved": false',
  'supabaseMutationApproved": false',
  'workerExecutionApproved": false',
  'providerModelCallsApproved": false',
  'TRACKA-GD-HANDOFF-3 - Controlled Private Preview Composition Execution',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Handoff-2 term: ${term}`);
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

const commandTemplate = readFile('docs/track-a/creative-graphics-private-preview-future-command-template.md');
const commandBlocks = [...commandTemplate.matchAll(/```(?:sh|bash)\n([\s\S]*?)```/g)].map((match) => match[1]);
if (commandBlocks.length === 0) {
  failures.push('No shell command blocks found in future command template.');
}
for (const [index, block] of commandBlocks.entries()) {
  const requiredWarning = 'DO NOT RUN UNTIL TRACKA-GD-HANDOFF-3 EXECUTION APPROVAL EXISTS.';
  if (!block.includes(requiredWarning)) {
    failures.push(`Command block ${index + 1} is missing required approval warning.`);
  }
  for (const placeholder of [
    '<PRIVATE_PREVIEW_RUN_ID>',
    '<SOURCE_LOCKFILE>',
    '<PRIVATE_PREVIEW_MANIFEST>',
    '<LOCAL_OUTPUT_DIR>',
    '<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>',
  ]) {
    if (!commandTemplate.includes(placeholder)) {
      failures.push(`Future command template missing placeholder: ${placeholder}`);
    }
  }
}

for (const baseGap of [
  'docs/execution-gates-contract.md',
  'docs/render-preview-export-foundation.md',
  'docs/tool-call-foundation.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/worker-claim-execution-contract-hardening.md',
  'docs/media-readiness-probe-timing-foundation.md',
  'docs/qa-revision-fallback-foundation.md',
  'docs/observability-audit-abuse-cost-foundation.md',
  'docs/compliance-license-security-review-foundation.md',
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-success-milestone-reporting-standard.md',
]) {
  if (!docsText.includes(baseGap)) {
    failures.push(`Missing base gap record: ${baseGap}`);
  }
}

if (!packageJsonText.includes('tracka:creative-graphics:private-preview-execution-packet:diagnostics')) {
  failures.push('Missing package script for Track A private preview execution packet diagnostics.');
}

if (!foundationRunnerText.includes('tracka:creative-graphics:private-preview-execution-packet:diagnostics')) {
  failures.push('Foundation validation runner does not include Track A private preview execution packet diagnostics.');
}

if (!workflowText.includes('codex/rp-tracka-gd-handoff-1-private-preview-composition-plan')) {
  failures.push('Foundation workflow does not cover the TRACKA-GD-HANDOFF-1 PR base branch.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  privatePreviewExecutionPacketStatus: 'private_preview_execution_packet_ready',
  decisionState: 'ready_for_tracka_gd_handoff_3_controlled_private_preview_execution',
  acceptedFixturesChecked: acceptedFixtures.length,
  excludedFixturesChecked: excludedFixtures.length,
  privatePreviewExecutionApprovedNow: false,
  futureExecutionPromptRequired: true,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A controlled private preview execution packet only',
  nextRecommendedPrompt: 'TRACKA-GD-HANDOFF-3 - Controlled Private Preview Composition Execution',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}

