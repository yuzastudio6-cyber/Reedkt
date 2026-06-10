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
  'docs/track-a/creative-graphics-controlled-private-sample-qa-review.md',
  'docs/track-a/creative-graphics-controlled-private-sample-qa-acceptance-matrix.md',
  'docs/track-a/creative-graphics-controlled-private-sample-warning-disposition.md',
  'docs/track-a/creative-graphics-internal-beta-readiness-review.md',
  'docs/track-a/creative-graphics-cross-workstream-dependencies.md',
  'docs/track-a/creative-graphics-controlled-private-sample-cleanup-review.md',
  'docs/track-a/creative-graphics-next-internal-beta-gate-prompt.md',
  'docs/prompt-tracka-gd-handoff-7-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-handoff-7-controlled-private-sample-qa-internal-beta-readiness.md',
];

const evidenceDocs = [
  'docs/track-a/creative-graphics-controlled-private-sample-prerequisite-check.md',
  'docs/track-a/creative-graphics-controlled-private-sample-execution-evidence.md',
  'docs/track-a/creative-graphics-controlled-private-sample-qa-evidence.md',
  'docs/track-a/creative-graphics-controlled-private-sample-observability-evidence.md',
  'docs/track-a/creative-graphics-controlled-private-sample-cleanup-evidence.md',
  'docs/track-a/creative-graphics-controlled-private-sample-go-no-go-record.md',
  'docs/prompt-tracka-gd-handoff-6-validation-results.md',
];

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/creative-graphics-controlled-private-sample-next-prompt.md',
  'docs/track-a/creative-graphics-controlled-private-sample-readiness.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
  'docs/ai-tools/creative-graphics-next-fixture-plan.md',
  'docs/ai-tools/creative-graphics-future-prompt-sequence.md',
];

const allowedQaResults = [
  'controlled_private_sample_qa_passed',
  'controlled_private_sample_qa_passed_with_warnings',
  'controlled_private_sample_qa_blocked',
];

const allowedReadinessDecisions = [
  'ready_for_cross_workstream_internal_beta_gate_review',
  'ready_with_warnings_for_cross_workstream_internal_beta_gate_review',
  'blocked_pending_private_sample_fixes',
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
  return /\b(no|not|none|blocked|missing|absent|must not|do not|without|unless|out of scope|future|future-only|placeholder|not approved|not executed|unexecuted|skipped|excluded|remains blocked|did not|does not|not run|not created|not claimed|not performed|warning|warnings|required|gated|gate|docs\/status only|docs_only|false|controlled_private_sample_qa_passed_with_warnings|controlled_private_sample_passed_with_warnings|ready_with_warnings_for_cross_workstream_internal_beta_gate_review|accepted_with_warnings|passed_with_warnings|laneReadyForInternalBetaGateReview|accepted_for_internal_beta_gate_review|must_fix_before_internal_beta|base gaps|base-gap|pending|environment_blocked)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\bAI tool execution\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
    /\bfixture regeneration\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
    /\bcontrolled private sample execution\b.*\b(enabled|yes|true|performed|ran|approved now|approved)\b/i,
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
    /\bbeta\b.*\b(unlocked|approved)\b/i,
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
  if (
    !text.includes('TRACKA-GD-HANDOFF-7') &&
    !text.includes('controlled_private_sample_qa_passed_with_warnings') &&
    !text.includes('ready_with_warnings_for_cross_workstream_internal_beta_gate_review')
  ) {
    failures.push(`File does not reference Handoff-7 QA/readiness status: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const file of evidenceDocs) {
  scanUnsafeLines(file, readFile(file));
}

for (const term of [
  'TRACKA-GD-HANDOFF-7',
  'controlled_private_sample_passed_with_warnings',
  'controlled_private_sample_qa_passed_with_warnings',
  'ready_with_warnings_for_cross_workstream_internal_beta_gate_review',
  'CROSS-BETA-0 - Cross-Workstream Internal Beta Gate Review',
  'GD-9 - Group B Package Runtime Review and Fixture Gate',
  'TRACKA-GD-HANDOFF-7A - Private Sample QA Fixes',
  'none; Track A creative graphics controlled private sample QA/readiness review only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Handoff-7 term: ${term}`);
  }
}

for (const result of allowedQaResults) {
  if (result === 'controlled_private_sample_qa_passed_with_warnings') {
    continue;
  }
  if (docsText.includes(`QA result: \`${result}\``)) {
    failures.push(`Unexpected primary QA result found: ${result}`);
  }
}

if (!docsText.includes('QA result: `controlled_private_sample_qa_passed_with_warnings`')) {
  failures.push(`Missing expected QA result. Expected one of: ${allowedQaResults.join(', ')}`);
}

const readinessMatches = allowedReadinessDecisions.filter((decision) => docsText.includes(decision));
if (!readinessMatches.includes('ready_with_warnings_for_cross_workstream_internal_beta_gate_review')) {
  failures.push(`Missing expected lane readiness decision. Expected one of: ${allowedReadinessDecisions.join(', ')}`);
}

for (const fixtureId of acceptedFixtures) {
  if (!combinedText.includes(fixtureId)) {
    failures.push(`Missing accepted fixture reference: ${fixtureId}`);
  }
  const acceptedPattern = new RegExp(`\\|\\s*\`${fixtureId}\`[\\s\\S]*?\`accepted_with_warnings\`\\s*\\|`);
  if (!acceptedPattern.test(docsText)) {
    failures.push(`Missing accepted_with_warnings QA matrix row for ${fixtureId}`);
  }
}

for (const fixtureId of excludedFixtures) {
  if (!combinedText.includes(fixtureId)) {
    failures.push(`Missing excluded fixture/tool reference: ${fixtureId}`);
  }
}

for (const warning of [
  'tracka_warning_safe_zone_readability',
  'tracka_warning_synthetic_data_correctness',
  'tracka_warning_source_of_truth_binding',
  'tracka_warning_final_render_export_not_reviewed',
]) {
  if (!combinedText.includes(warning)) {
    failures.push(`Missing warning disposition: ${warning}`);
  }
}

for (const booleanTerm of [
  '"laneReadyForInternalBetaGateReview": true',
  '"fullInternalBetaApproved": false',
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
    failures.push(`Missing required readiness boolean: ${booleanTerm}`);
  }
}

for (const dependency of [
  'TRACK_B_MEDIA_PROCESSING',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'OBSERVABILITY_AUDIT_COST',
  'COMPLIANCE_SECURITY',
  'PROVIDER_GATEWAY_MODELS',
  'FRONTEND_PRODUCT_UX',
  'MAP_GEOSPATIAL',
  'SOUND_MUSIC_AUDIO',
]) {
  if (!combinedText.includes(dependency)) {
    failures.push(`Missing cross-workstream dependency: ${dependency}`);
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
    failures.push(`Missing base-gap record: ${baseGap}`);
  }
}

if (!packageJsonText.includes('tracka:creative-graphics:controlled-private-sample-qa:diagnostics')) {
  failures.push('Missing package script for Track A controlled private sample QA diagnostics.');
}

const sampleIndex = foundationRunnerText.indexOf('tracka:creative-graphics:controlled-private-sample:diagnostics');
const qaIndex = foundationRunnerText.indexOf('tracka:creative-graphics:controlled-private-sample-qa:diagnostics');
if (qaIndex === -1) {
  failures.push('Foundation validation runner does not include controlled private sample QA diagnostics.');
} else if (sampleIndex !== -1 && qaIndex < sampleIndex) {
  failures.push('Controlled private sample QA diagnostics must run after Handoff-6 sample diagnostics.');
}

if (!workflowText.includes('codex/rp-tracka-gd-handoff-6-controlled-private-sample-execution')) {
  failures.push('Foundation workflow does not cover PRs targeting the Handoff-6 base branch.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  controlledPrivateSampleQaResult: combinedText.includes('controlled_private_sample_qa_passed_with_warnings')
    ? 'controlled_private_sample_qa_passed_with_warnings'
    : 'missing',
  laneReadinessDecision: combinedText.includes('ready_with_warnings_for_cross_workstream_internal_beta_gate_review')
    ? 'ready_with_warnings_for_cross_workstream_internal_beta_gate_review'
    : 'missing',
  fixturesReviewed: acceptedFixtures.length,
  fullInternalBetaApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A creative graphics controlled private sample QA/readiness review only',
  nextRecommendedPrompt: 'CROSS-BETA-0 - Cross-Workstream Internal Beta Gate Review',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}

