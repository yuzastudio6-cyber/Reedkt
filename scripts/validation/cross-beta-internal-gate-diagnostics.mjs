import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const requiredDocs = [
  'docs/internal-beta/cross-workstream-internal-beta-gate-review.md',
  'docs/internal-beta/cross-workstream-readiness-matrix.md',
  'docs/internal-beta/accepted-lane-evidence-register.md',
  'docs/internal-beta/internal-beta-blocker-register.md',
  'docs/internal-beta/internal-beta-no-go-scope-register.md',
  'docs/internal-beta/internal-beta-next-prompt-queue.md',
  'docs/internal-beta/internal-beta-gate-decision-record.md',
  'docs/prompt-cross-beta-0-validation-results.md',
  'docs/implementation-prompts/prompt-cross-beta-0-cross-workstream-internal-beta-gate-review.md',
];

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/creative-graphics-next-internal-beta-gate-prompt.md',
  'docs/track-a/creative-graphics-internal-beta-readiness-review.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
  'docs/ai-tools/creative-graphics-next-fixture-plan.md',
  'docs/ai-tools/creative-graphics-future-prompt-sequence.md',
];

const workstreams = [
  'TRACK_A_RENDER_EXPORT',
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'MAP_GEOSPATIAL',
  'SOUND_MUSIC_AUDIO',
  'TRACK_B_MEDIA_PROCESSING',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'OBSERVABILITY_AUDIT_COST',
  'COMPLIANCE_SECURITY',
  'FRONTEND_PRODUCT_UX',
  'BILLING_STRIPE_CREDITS',
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
  return /\b(no|not|none|blocked|missing|absent|gap|gaps|false|future|deferred|required|only|warning|warnings|with warnings|docs\/status only|docs_only|not accepted|not approve|not approved|does not|did not|must not|do not|no-go|remain blocked|remains blocked|unresolved|owner confirmation|owner-gate|evidence_missing|blocked_pending_workstream_gates)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\b(runtime|tool|worker|provider|model|render|export|media processing|browser capture)\b.*\b(enabled|approved|executed|ran|passed now|ready now)\b/i,
    /\bDocker\/Cloud Run\b.*\b(enabled|approved|executed|ran|used)\b/i,
    /\bSupabase mutation\b.*\b(enabled|approved|executed|ran|used)\b/i,
    /\bSQL executed:\s*`?(?!none)/i,
    /\bMigration deployed:\s*`?(?!no)/i,
    /\bSupabase environment touched:\s*`?(?!none)/i,
    /\bGoogle Cloud API call\b.*\b(enabled|approved|executed|called|used)\b/i,
    /\bSecret Manager API call\b.*\b(enabled|approved|executed|called|used)\b/i,
    /\buploads?\b.*\b(enabled|approved|created|performed|executed|ran)\b/i,
    /\bstorage transfer\b.*\b(enabled|approved|created|performed|executed|ran)\b/i,
    /\bsigned URL(?:s)?\b.*\b(created|enabled|approved|source of truth)\b/i,
    /\bpublic artifact(?:s)?\b.*\b(created|enabled|approved)\b/i,
    /\bdependency mutation\b.*\b(enabled|approved|performed)\b/i,
    /\b(beta|production)\b.*\b(unlocked|approved now|approved:\s*true)\b/i,
    /\braw prompt execution\b.*\b(enabled|approved|performed)\b/i,
    /\bbroad service-role handler\b.*\b(enabled|approved|created)\b/i,
    /\bsupabase\s+(start|link|db|migration|functions|projects)\b/i,
    /\bgcloud\b/i,
    /\bpsql\b/i,
    /\bdocker\s+(run|build|compose|pull|push|exec)\b/i,
    /postgres(?:ql)?:\/\/[^@\s]+@/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /X-Goog-Signature|X-Amz-Signature|sig=|signature=/i,
    /https?:\/\/(?!github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/|github\.com\/yuzastudio6-cyber\/Reedkt\/actions\/)/i,
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
const trackerText = trackerDocs.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${trackerText}`;
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const workflowText = readFile('.github/workflows/foundation-validation.yml');

for (const file of requiredDocs) {
  scanUnsafeLines(file, readFile(file));
}

for (const file of trackerDocs) {
  const text = readFile(file);
  if (!text.includes('CROSS-BETA-0') || !text.includes('blocked_pending_workstream_gates')) {
    failures.push(`Tracker does not reference CROSS-BETA-0 blocked decision: ${file}`);
  }
}

for (const workstream of workstreams) {
  const matches = docsText.match(new RegExp(workstream, 'g')) ?? [];
  if (matches.length === 0) {
    failures.push(`Missing workstream in CROSS-BETA docs: ${workstream}`);
  }
}

for (const term of [
  'blocked_pending_workstream_gates',
  'controlled_private_sample_qa_passed_with_warnings',
  'controlled_private_sample_passed_with_warnings',
  'Phase 53A',
  'Phase 52G',
  'Phase 50G',
  'fullInternalBetaApprovedNow": false',
  'futureExecutionPromptRequired": true',
  'externalBetaApproved": false',
  'productionApproved": false',
  'publicArtifactsApproved": false',
  'signedUrlsApproved": false',
  'rawPromptExecutionApproved": false',
  'supabaseMutationApproved": false',
  'workerExecutionApproved": false',
  'providerModelCallsApproved": false',
  'finalRenderExportApproved": false',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'later Supabase 20-26',
  'docs/supabase-milestone-sync-policy.md',
  'GD-9 - Group B Package Runtime Review and Fixture Gate',
  'CROSS-BETA-1 - Internal Beta Execution Packet',
  'none; cross-workstream internal beta gate review packet only',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required CROSS-BETA-0 term: ${term}`);
  }
}

for (const status of ['ready_with_warnings', 'blocked', 'evidence_missing']) {
  if (!docsText.includes(status)) {
    failures.push(`Missing workstream status term: ${status}`);
  }
}

if (!packageJsonText.includes('"cross-beta:internal-gate:diagnostics"')) {
  failures.push('Missing package script cross-beta:internal-gate:diagnostics');
}

if (!foundationRunnerText.includes("'cross-beta:internal-gate:diagnostics'")) {
  failures.push('Foundation validation runner does not include cross-beta diagnostic');
}

if (!workflowText.includes('codex/rp-tracka-gd-handoff-7-controlled-private-sample-qa-internal-beta-readiness')) {
  failures.push('Foundation workflow missing Handoff-7 PR base trigger');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decisionState: 'blocked_pending_workstream_gates',
  workstreamsReviewed: workstreams.length,
  fullInternalBetaApprovedNow: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; cross-workstream internal beta gate review packet only',
  nextRecommendedPrompt: 'GD-9 - Group B Package Runtime Review and Fixture Gate',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
