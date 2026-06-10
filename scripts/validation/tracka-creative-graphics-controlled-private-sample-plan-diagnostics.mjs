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
  'docs/track-a/creative-graphics-controlled-private-sample-plan.md',
  'docs/track-a/creative-graphics-controlled-private-sample-evidence-lockfile.md',
  'docs/track-a/creative-graphics-controlled-private-sample-warning-remediation.md',
  'docs/track-a/creative-graphics-controlled-private-sample-execution-gate.md',
  'docs/track-a/creative-graphics-controlled-private-sample-qa-observability-plan.md',
  'docs/track-a/creative-graphics-controlled-private-sample-cleanup-rollback-plan.md',
  'docs/track-a/creative-graphics-controlled-private-sample-next-prompt.md',
  'docs/prompt-tracka-gd-handoff-5-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-handoff-5-controlled-private-sample-planning.md',
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
  'docs/track-a/creative-graphics-controlled-private-sample-readiness.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
  'docs/ai-tools/creative-graphics-next-fixture-plan.md',
  'docs/ai-tools/creative-graphics-future-prompt-sequence.md',
];

const allowedDecisionStates = [
  'ready_for_tracka_gd_handoff_6_controlled_private_sample_execution',
  'ready_with_warnings_for_tracka_gd_handoff_6',
  'blocked_pending_private_preview_qa_fixes',
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
  return /\b(no|not|none|blocked|missing|absent|must not|do not|without|unless|out of scope|future|future-only|placeholder|not approved|not executed|unexecuted|skipped|excluded|remains blocked|did not|does not|not run|not created|not claimed|not performed|warning|warnings|required|gated|gate|docs\/status only|docs_only|false|controlled_private_sample_plan_ready_with_warnings|ready_with_warnings_for_tracka_gd_handoff_6|accepted_with_warnings|private_preview_qa_passed_with_warnings)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\bAI tool execution\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
    /\bfixture regeneration\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
    /\bprivate sample execution\b.*\b(enabled|yes|true|performed|ran|approved now|approved)\b/i,
    /\bfinal render\b.*\b(enabled|created|ran|approved|ready|passed)\b/i,
    /\brender\/export\b.*\b(enabled|created|ran|approved|ready|passed)\b/i,
    /\bupload(?:ed|s)?\b.*\b(enabled|created|performed|yes|true|approved)\b/i,
    /\bstorage transfer\b.*\b(enabled|created|performed|yes|true|approved)\b/i,
    /\bpublic artifacts?\b.*\b(created|enabled|approved|yes|true)\b/i,
    /\bsigned URL(?:s)?\b.*\b(created|enabled|approved|source of truth|yes|true)\b/i,
    /\bworker execution\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
    /\b(provider|model) (call|calls|execution)\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
    /\bbrowser capture\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
    /\bDocker\/Cloud Run\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
    /\bmedia processing\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
    /\bSupabase environment touched:\s*`?(?!none)/i,
    /\bSupabase mutation\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
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
const trackersText = trackerDocs.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${trackersText}`;
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const workflowText = readFile('.github/workflows/foundation-validation.yml');

for (const file of [...requiredDocs, ...trackerDocs]) {
  const text = readFile(file);
  if (!text.includes('TRACKA-GD-HANDOFF-5') && !text.includes('ready_with_warnings_for_tracka_gd_handoff_6')) {
    failures.push(`File does not reference Handoff-5 sample-planning status: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of [
  'TRACKA-GD-HANDOFF-5',
  'controlled_private_sample_plan_ready_with_warnings',
  'ready_with_warnings_for_tracka_gd_handoff_6',
  'private_preview_qa_passed_with_warnings',
  'ready_with_warnings_for_controlled_private_sample_plan',
  'TRACKA-GD-HANDOFF-6 - Controlled Private Sample Execution',
  'none; Track A creative graphics controlled private sample planning only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Handoff-5 term: ${term}`);
  }
}

const decisionStateMatches = allowedDecisionStates.filter((state) => combinedText.includes(state));
if (decisionStateMatches.length === 0) {
  failures.push(`Missing allowed decision state. Expected one of: ${allowedDecisionStates.join(', ')}`);
}

for (const fixtureId of acceptedFixtures) {
  if (!combinedText.includes(fixtureId)) {
    failures.push(`Missing accepted fixture reference: ${fixtureId}`);
  }
  const lockfilePattern = new RegExp(`\\|\\s*\`${fixtureId}\`\\s*\\|\\s*yes\\s*\\|[\\s\\S]*?\`accepted_with_warnings\``);
  if (!lockfilePattern.test(docsText)) {
    failures.push(`Missing accepted fixture lockfile row for ${fixtureId}`);
  }
}

for (const fixtureId of excludedFixtures) {
  if (!combinedText.includes(fixtureId)) {
    failures.push(`Missing excluded fixture/tool reference: ${fixtureId}`);
  }
}

for (const booleanTerm of [
  '"controlledPrivateSampleExecutionApprovedNow": false',
  '"futureExecutionPromptRequired": true',
  '"internalBetaApproved": false',
  '"externalBetaApproved": false',
  '"productionApproved": false',
  '"finalRenderExportApproved": false',
  '"publicArtifactsApproved": false',
  '"signedUrlsApproved": false',
  '"supabaseMutationApproved": false',
  '"workerExecutionApproved": false',
  '"providerModelCallsApproved": false',
]) {
  if (!docsText.includes(booleanTerm)) {
    failures.push(`Missing required gate boolean: ${booleanTerm}`);
  }
}

if (!packageJsonText.includes('tracka:creative-graphics:controlled-private-sample-plan:diagnostics')) {
  failures.push('Missing package script for Track A controlled private sample plan diagnostics.');
}

const qaIndex = foundationRunnerText.indexOf('tracka:creative-graphics:private-preview-qa:diagnostics');
const sampleIndex = foundationRunnerText.indexOf('tracka:creative-graphics:controlled-private-sample-plan:diagnostics');
if (sampleIndex === -1) {
  failures.push('Foundation validation runner does not include controlled private sample plan diagnostics.');
} else if (qaIndex !== -1 && sampleIndex < qaIndex) {
  failures.push('Controlled private sample plan diagnostics must run after private preview QA diagnostics.');
}

if (!workflowText.includes('codex/rp-tracka-gd-handoff-4-private-preview-qa-review')) {
  failures.push('Foundation workflow does not cover PRs targeting the Handoff-4 base branch.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  controlledPrivateSamplePlanStatus: combinedText.includes('controlled_private_sample_plan_ready_with_warnings')
    ? 'controlled_private_sample_plan_ready_with_warnings'
    : 'missing',
  decisionState: decisionStateMatches.includes('ready_with_warnings_for_tracka_gd_handoff_6')
    ? 'ready_with_warnings_for_tracka_gd_handoff_6'
    : decisionStateMatches[0] ?? 'missing',
  fixturesLocked: acceptedFixtures.length,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A creative graphics controlled private sample planning only',
  nextRecommendedPrompt: 'TRACKA-GD-HANDOFF-6 - Controlled Private Sample Execution',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
