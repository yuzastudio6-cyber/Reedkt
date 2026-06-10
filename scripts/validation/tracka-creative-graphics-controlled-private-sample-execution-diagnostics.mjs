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
  'controlled_private_sample_passed',
  'controlled_private_sample_passed_with_warnings',
  'controlled_private_sample_failed',
  'blocked_pending_private_sample_prerequisites',
];

const requiredDocs = [
  'docs/track-a/creative-graphics-controlled-private-sample-prerequisite-check.md',
  'docs/track-a/creative-graphics-controlled-private-sample-execution-evidence.md',
  'docs/track-a/creative-graphics-controlled-private-sample-qa-evidence.md',
  'docs/track-a/creative-graphics-controlled-private-sample-observability-evidence.md',
  'docs/track-a/creative-graphics-controlled-private-sample-cleanup-evidence.md',
  'docs/track-a/creative-graphics-controlled-private-sample-go-no-go-record.md',
  'docs/prompt-tracka-gd-handoff-6-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-handoff-6-controlled-private-sample-execution.md',
];

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/creative-graphics-controlled-private-sample-plan.md',
  'docs/track-a/creative-graphics-controlled-private-sample-evidence-lockfile.md',
  'docs/track-a/creative-graphics-controlled-private-sample-warning-remediation.md',
  'docs/track-a/creative-graphics-controlled-private-sample-execution-gate.md',
  'docs/track-a/creative-graphics-controlled-private-sample-qa-observability-plan.md',
  'docs/track-a/creative-graphics-controlled-private-sample-cleanup-rollback-plan.md',
  'docs/track-a/creative-graphics-controlled-private-sample-next-prompt.md',
  'docs/track-a/creative-graphics-controlled-private-sample-readiness.md',
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
  return /\b(no|not|none|blocked|missing|absent|must not|do not|without|unless|out of scope|future|future-only|placeholder|not approved|not executed|unexecuted|skipped|excluded|remains blocked|did not|does not|not run|not created|not claimed|not performed|warning|warnings|required|gated|gate|docs\/status only|docs_only|false|controlled_private_sample_passed_with_warnings|controlled_private_sample_failed|blocked_pending_private_sample_prerequisites|private_preview_qa_passed_with_warnings|ready_with_warnings_for_tracka_gd_handoff_6|passed_with_warnings|source_verified|local_private_evidence_retained_for_review|pending|environment_blocked)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\bAI tool execution\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
    /\bfixture regeneration\b.*\b(enabled|yes|true|performed|ran|approved)\b/i,
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
const executorText = readFile('scripts/track-a/run-creative-graphics-controlled-private-sample.mjs');

for (const file of [...requiredDocs, ...trackerDocs]) {
  const text = readFile(file);
  if (!text.includes('TRACKA-GD-HANDOFF-6') && !text.includes('controlled_private_sample_passed_with_warnings')) {
    failures.push(`File does not reference Handoff-6 controlled private sample status: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of [
  'TRACKA-GD-HANDOFF-6',
  'controlled_private_sample_passed_with_warnings',
  'tracka-gd-handoff-6-2026-06-10T21-32-06-022Z',
  'generated_local_fixture_partially_passed / source_artifacts_preserved / private_preview_local_passed / private_preview_qa_passed_with_warnings / controlled_private_sample_passed_with_warnings',
  'none; Track A creative graphics controlled private sample execution only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
  'TRACKA-GD-HANDOFF-7 - Controlled Private Sample QA and Internal Beta Readiness Review',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Handoff-6 term: ${term}`);
  }
}

const resultTerms = allowedResults.filter((term) => combinedText.includes(term));
if (resultTerms.length === 0) {
  failures.push(`No allowed controlled private sample result found. Expected one of: ${allowedResults.join(', ')}`);
}

for (const fixtureId of acceptedFixtures) {
  if (!combinedText.includes(fixtureId)) {
    failures.push(`Missing accepted fixture reference: ${fixtureId}`);
  }
  if (!combinedText.includes(`${fixtureId}.svg`)) {
    failures.push(`Missing source artifact reference for ${fixtureId}`);
  }
}

for (const fixtureId of excludedFixtures) {
  if (!combinedText.includes(fixtureId)) {
    failures.push(`Missing excluded fixture/tool reference: ${fixtureId}`);
  }
}

for (const booleanTerm of [
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
    failures.push(`Missing required go/no-go boolean: ${booleanTerm}`);
  }
}

if (combinedText.includes('controlled_private_sample_passed') && !combinedText.includes('controlled-private-sample-manifest.json')) {
  failures.push('Sample pass result requires committed sample manifest evidence summary.');
}

for (const checksum of [
  '59de2bc6d83fd029b53f84cec02d957920fbbeb819f8e6f7da5f57616fb4d992',
  'd0ee9cf2299136aea4cc83a75a769a745e895861e8b5ab2ec05727a6a1639a3e',
  '965a1747bf6df1446450180cecec567a0b7712b5bcdd3460097fd2c00210a63c',
  '8f66d82cad169fb9599c114d8a5eb1d209293f3d5d507d8bc27fd37301191d6d',
  'ab13c9b3a75bdc7f1a0adde427db259d7f764bfdd48cd642db2fa7771009d2f9',
  '10e1dca509d8612cebe3d9909e79cd24a813e173aaef9832a1d9bffe80ef3a0c',
]) {
  if (!combinedText.includes(checksum)) {
    failures.push(`Missing local output checksum summary: ${checksum}`);
  }
}

for (const forbiddenExecutorPattern of [
  /from 'node:child_process'/,
  /from 'node:http'/,
  /from 'node:https'/,
  /\bfetch\s*\(/,
  /\bexec(?:File|Sync)?\s*\(/,
  /\bspawn(?:Sync)?\s*\(/,
  /\bgcloud\b/i,
  /\bpsql\b/i,
]) {
  if (forbiddenExecutorPattern.test(executorText)) {
    failures.push(`Executor includes forbidden runtime surface: ${forbiddenExecutorPattern}`);
  }
}

for (const requiredExecutorToken of [
  '.local-artifacts/track-a/gd-controlled-private-sample',
  'source-artifact-manifest.json',
  'source-artifact-checksums.json',
  'controlled-private-sample-manifest.json',
  'observability-audit-evidence.json',
  'cleanup-evidence.json',
  'signedUrlCreation: false',
  'publicArtifactCreation: false',
]) {
  if (!executorText.includes(requiredExecutorToken)) {
    failures.push(`Executor missing required token: ${requiredExecutorToken}`);
  }
}

if (!packageJsonText.includes('tracka:creative-graphics:controlled-private-sample:diagnostics')) {
  failures.push('Missing package script for Track A controlled private sample diagnostics.');
}

const planIndex = foundationRunnerText.indexOf('tracka:creative-graphics:controlled-private-sample-plan:diagnostics');
const sampleIndex = foundationRunnerText.indexOf('tracka:creative-graphics:controlled-private-sample:diagnostics');
if (sampleIndex === -1) {
  failures.push('Foundation validation runner does not include controlled private sample diagnostics.');
} else if (planIndex !== -1 && sampleIndex < planIndex) {
  failures.push('Controlled private sample diagnostics must run after Handoff-5 plan diagnostics.');
}

if (!workflowText.includes('codex/rp-tracka-gd-handoff-5-controlled-private-sample-planning')) {
  failures.push('Foundation workflow does not cover PRs targeting the Handoff-5 base branch.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  controlledPrivateSampleStatus: resultTerms.includes('controlled_private_sample_passed_with_warnings')
    ? 'controlled_private_sample_passed_with_warnings'
    : resultTerms[0] ?? 'missing',
  acceptedFixturesChecked: acceptedFixtures.length,
  qaEvidenceCreated: combinedText.includes('creative-graphics-controlled-private-sample-qa-evidence.md'),
  observabilityEvidenceCreated: combinedText.includes('creative-graphics-controlled-private-sample-observability-evidence.md'),
  cleanupEvidenceCreated: combinedText.includes('creative-graphics-controlled-private-sample-cleanup-evidence.md'),
  goNoGoRecordCreated: combinedText.includes('creative-graphics-controlled-private-sample-go-no-go-record.md'),
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A creative graphics controlled private sample execution only',
  nextRecommendedPrompt: resultTerms.includes('controlled_private_sample_passed_with_warnings')
    ? 'TRACKA-GD-HANDOFF-7 - Controlled Private Sample QA and Internal Beta Readiness Review'
    : 'TRACKA-GD-HANDOFF-6A - Controlled Private Sample Fixes',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
