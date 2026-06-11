import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const groupBTools = [
  {
    toolId: 'anime_js_motion',
    packageName: 'animejs',
    expectedClassification: 'approved_for_gd10_controlled_local_fixture_execution',
  },
  {
    toolId: 'lottie_web_overlays',
    packageName: 'lottie-web',
    expectedClassification: 'approved_for_gd10_manifest_only_fixture',
  },
  {
    toolId: 'remotion_graphics',
    packageName: 'remotion',
    expectedClassification: 'approved_for_gd10_manifest_only_fixture',
  },
];

const requiredDocs = [
  'docs/ai-tools/creative-graphics-group-b-runtime-review.md',
  'docs/ai-tools/creative-graphics-group-b-fixture-gate.md',
  'docs/ai-tools/creative-graphics-group-b-gd10-allowed-scope.md',
  'docs/ai-tools/creative-graphics-group-b-gd10-blocked-scope.md',
  'docs/ai-tools/creative-graphics-group-b-qa-evidence-requirements.md',
  'docs/ai-tools/creative-graphics-group-b-warning-blocker-register.md',
  'docs/ai-tools/creative-graphics-group-b-gate-decision-record.md',
  'docs/prompt-gd-9-validation-results.md',
  'docs/implementation-prompts/prompt-gd-9-group-b-package-runtime-review-fixture-gate.md',
];

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/internal-beta/cross-workstream-readiness-matrix.md',
  'docs/internal-beta/internal-beta-blocker-register.md',
  'docs/internal-beta/internal-beta-next-prompt-queue.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
  'docs/ai-tools/creative-graphics-next-fixture-plan.md',
  'docs/ai-tools/creative-graphics-future-prompt-sequence.md',
  'docs/ai-tools/creative-graphics-package-runtime-matrix.md',
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
  return /\b(no|not|none|blocked|false|future|only|placeholder|placeholders|must not|do not|without|out of scope|remains|blocked|skip|skipped|unavailable|manifest-only|docs\/status only|docs_only|not approved|not enabled|not run|not executed|no-scope|required|deferred|gate|review)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /Group B fixture execution:\s*`?(yes|true|executed|ran|enabled|approved)`?/i,
    /generated artifacts?:\s*`?(yes|true|created|present|enabled)`?/i,
    /Remotion render\/export:\s*`?(yes|true|executed|ran|enabled|approved)`?/i,
    /\b(AI tool|tool|worker|provider|model) execution\b.*\b(enabled|approved|executed|ran|created)\b/i,
    /\bprovider\/model calls?\b.*\b(enabled|approved|executed|ran|created)\b/i,
    /\bbrowser capture\b.*\b(enabled|approved|executed|ran|created)\b/i,
    /\bmedia processing\b.*\b(enabled|approved|executed|ran|created)\b/i,
    /\bDocker\/Cloud Run\b.*\b(enabled|approved|executed|ran|used)\b/i,
    /\bSupabase mutation\b.*\b(enabled|approved|executed|ran|used)\b/i,
    /\bSupabase environment touched:\s*`?(?!none)/i,
    /\bSQL executed:\s*`?(?!none)/i,
    /\bMigration deployed:\s*`?(?!no)/i,
    /\bGoogle Cloud\b.*\b(enabled|approved|executed|called|used|fetched)\b/i,
    /\bSecret Manager\b.*\b(enabled|approved|executed|called|used|fetched)\b/i,
    /\bupload\b.*\b(enabled|approved|created|performed|executed|ran)\b/i,
    /\bstorage transfer\b.*\b(enabled|approved|created|performed|executed|ran)\b/i,
    /\bsigned URL(?:s)?\b.*\b(created|enabled|approved|source of truth)\b/i,
    /\bpublic artifact(?:s)?\b.*\b(created|enabled|approved)\b/i,
    /\bdependency mutation\b.*\b(enabled|approved|performed)\b/i,
    /\b(beta|production)\b.*\b(unlocked|approved now|approved:\s*true)\b/i,
    /\braw prompt execution\b.*\b(enabled|approved|performed)\b/i,
    /\bbroad service-role handler\b.*\b(enabled|approved|created)\b/i,
    /\bsupabase\s+(start|status|link|db|migration|functions|projects)\b/i,
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
const decisionText = readFile('docs/ai-tools/creative-graphics-group-b-gate-decision-record.md');
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const workflowText = readFile('.github/workflows/foundation-validation.yml');

for (const file of requiredDocs) {
  scanUnsafeLines(file, readFile(file));
}

for (const file of trackerDocs) {
  const text = readFile(file);
  if (!text.includes('GD-9') || !text.includes('group_b_partially_ready_for_gd10')) {
    failures.push(`Tracker does not reference GD-9 Group B decision: ${file}`);
  }
}

for (const { toolId, packageName, expectedClassification } of groupBTools) {
  for (const file of requiredDocs) {
    const text = readFile(file);
    if (!text.includes(toolId)) {
      failures.push(`Missing ${toolId} in ${file}`);
    }
  }
  if (!docsText.includes(packageName)) {
    failures.push(`Missing package reference in GD-9 docs: ${packageName}`);
  }
  if (!combinedText.includes(expectedClassification)) {
    failures.push(`Missing GD-9 classification for ${toolId}: ${expectedClassification}`);
  }
  if (!combinedText.includes('package_runtime_probe_passed')) {
    failures.push(`Missing package_runtime_probe_passed status for ${toolId}`);
  }
}

for (const term of [
  'group_b_partially_ready_for_gd10',
  'group_b_runtime_import_review_passed',
  'group_b_fixture_gate_created',
  'none; Group B creative graphics package runtime review and fixture gate only',
  'Group B fixture execution: none',
  'Remotion render/export: none',
  'Dependency mutation: none',
  'Beta/production unlock: none',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'GD-10 - Group B Controlled Local Fixture Execution',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required GD-9 term: ${term}`);
  }
}

for (const booleanTerm of [
  '"groupBExecutionApprovedNow": false',
  '"futureExecutionPromptRequired": true',
  '"remotionFinalRenderApproved": false',
  '"workerExecutionApproved": false',
  '"providerModelCallsApproved": false',
  '"supabaseMutationApproved": false',
  '"publicArtifactsApproved": false',
  '"signedUrlsApproved": false',
  '"internalBetaApproved": false',
  '"externalBetaApproved": false',
  '"productionApproved": false',
]) {
  if (!decisionText.includes(booleanTerm)) {
    failures.push(`GD-9 decision record missing ${booleanTerm}`);
  }
}

if (!packageJsonText.includes('"ai-tools:creative-graphics:group-b-runtime-gate:diagnostics"')) {
  failures.push('Missing package script ai-tools:creative-graphics:group-b-runtime-gate:diagnostics');
}

if (!packageJsonText.includes('"internal-beta:cross-workstream-gate:diagnostics"')) {
  failures.push('Missing compatibility alias internal-beta:cross-workstream-gate:diagnostics');
}

if (!foundationRunnerText.includes("'ai-tools:creative-graphics:group-b-runtime-gate:diagnostics'")) {
  failures.push('Foundation validation runner does not include GD-9 diagnostic');
}

if (!foundationRunnerText.includes("'cross-beta:internal-gate:diagnostics',\n  'ai-tools:creative-graphics:group-b-runtime-gate:diagnostics'")) {
  failures.push('GD-9 diagnostic must run immediately after cross-beta internal gate diagnostic');
}

if (!workflowText.includes('codex/rp-cross-beta-0-cross-workstream-internal-beta-gate-review')) {
  failures.push('Foundation workflow missing CROSS-BETA-0 PR base trigger');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decisionState: 'group_b_partially_ready_for_gd10',
  groupBToolsReviewed: groupBTools.length,
  animeJsMotionStatus: 'approved_for_gd10_controlled_local_fixture_execution',
  lottieWebOverlaysStatus: 'approved_for_gd10_manifest_only_fixture',
  remotionGraphicsStatus: 'approved_for_gd10_manifest_only_fixture',
  groupBExecutionApprovedNow: false,
  remotionFinalRenderApproved: false,
  internalBetaApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Group B creative graphics package runtime review and fixture gate only',
  nextRecommendedPrompt: 'GD-10 - Group B Controlled Local Fixture Execution',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
