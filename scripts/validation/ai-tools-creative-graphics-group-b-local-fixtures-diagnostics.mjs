import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const groupBTools = ['anime_js_motion', 'lottie_web_overlays', 'remotion_graphics'];
const requiredDocs = [
  'docs/ai-tools/creative-graphics-gd10-group-b-local-execution-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-artifact-manifest-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-qa-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-observability-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-cleanup-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-go-no-go-record.md',
  'docs/prompt-gd-10-validation-results.md',
  'docs/implementation-prompts/prompt-gd-10-group-b-controlled-local-fixture-execution.md',
];

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/ai-tools/creative-graphics-group-b-runtime-review.md',
  'docs/ai-tools/creative-graphics-group-b-fixture-gate.md',
  'docs/ai-tools/creative-graphics-group-b-warning-blocker-register.md',
  'docs/ai-tools/creative-graphics-group-b-gate-decision-record.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
  'docs/ai-tools/creative-graphics-all-tools-readiness-matrix.md',
  'docs/ai-tools/creative-graphics-next-fixture-plan.md',
  'docs/ai-tools/creative-graphics-future-prompt-sequence.md',
  'docs/internal-beta/cross-workstream-readiness-matrix.md',
  'docs/internal-beta/internal-beta-blocker-register.md',
  'docs/internal-beta/internal-beta-next-prompt-queue.md',
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
  return /\b(no|not|none|false|blocked|skipped|manifest-only|manifest_only|without|do not|must not|never|out of scope|future|placeholder|placeholders|docs_only|docs\/status only|not approved|not enabled|not run|not executed|required|blocked|none)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /lottie.*\b(rendered|browser player ran|player executed|browser rendered)\b/i,
    /remotion.*\b(rendered|exported|video created|renderer executed|render\/export executed)\b/i,
    /\bworker execution\b.*\b(enabled|approved|executed|ran|created)\b/i,
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
const runnerText = readFile('scripts/fixtures/ai-tools/run-creative-graphics-gd10-group-b-fixtures.mjs');
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const workflowText = readFile('.github/workflows/foundation-validation.yml');
const decisionText = readFile('docs/ai-tools/creative-graphics-gd10-group-b-go-no-go-record.md');

for (const file of requiredDocs) {
  scanUnsafeLines(file, readFile(file));
}

for (const file of trackerDocs) {
  const text = readFile(file);
  if (!text.includes('GD-10') || !text.includes('group_b_partially_passed')) {
    failures.push(`Tracker does not reference GD-10 result: ${file}`);
  }
}

for (const toolId of groupBTools) {
  if (!combinedText.includes(toolId)) {
    failures.push(`Missing Group B tool in GD-10 docs/trackers: ${toolId}`);
  }
}

for (const term of [
  'group_b_partially_passed',
  'none; Group B controlled local fixture execution only',
  'anime_js_motion.motion-timing.json',
  'lottie_web_overlays.manifest-only.json',
  'remotion_graphics.manifest-only.json',
  'manifest_only',
  'Group B Track A handoff approved now: false',
  'Internal beta approved: false',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'TRACKA-GD-GROUPB-HANDOFF-0',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required GD-10 term: ${term}`);
  }
}

for (const booleanTerm of [
  '"groupBTrackAHandoffApprovedNow": false',
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
  if (!decisionText.includes(booleanTerm)) {
    failures.push(`GD-10 go/no-go record missing ${booleanTerm}`);
  }
}

for (const runnerTerm of [
  'anime_js_motion.motion-timing.json',
  'lottie_web_overlays.manifest-only.json',
  'remotion_graphics.manifest-only.json',
  'autoplay: false',
  'animation.seek',
  'renderExportUsed: false',
  'browserRuntimeUsed: false',
]) {
  if (!runnerText.includes(runnerTerm)) {
    failures.push(`Runner missing required term: ${runnerTerm}`);
  }
}

for (const forbiddenRunnerPattern of [
  /child_process/,
  /\bfetch\s*\(/,
  /https?:\/\//,
  /\bsupabase\s+(start|status|link|db|migration|functions|projects)\b/i,
  /\bgcloud\b/i,
  /\bpsql\b/i,
  /\bdocker\s+(run|build|compose|pull|push|exec)\b/i,
  /@remotion\/renderer/,
]) {
  if (forbiddenRunnerPattern.test(runnerText)) {
    failures.push(`Runner contains forbidden pattern: ${forbiddenRunnerPattern}`);
  }
}

if (!packageJsonText.includes('"ai-tools:creative-graphics:group-b-local-fixtures:diagnostics"')) {
  failures.push('Missing package script ai-tools:creative-graphics:group-b-local-fixtures:diagnostics');
}

if (!foundationRunnerText.includes("'ai-tools:creative-graphics:group-b-runtime-gate:diagnostics',\n  'ai-tools:creative-graphics:group-b-local-fixtures:diagnostics'")) {
  failures.push('GD-10 diagnostic must run immediately after GD-9 Group B runtime gate diagnostic');
}

if (!workflowText.includes('codex/rp-gd-9-group-b-package-runtime-review-fixture-gate')) {
  failures.push('Foundation workflow missing GD-9 PR base trigger');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decisionState: 'group_b_partially_passed',
  toolsReviewed: groupBTools.length,
  animeJsMotionResult: 'executed',
  lottieWebOverlaysResult: 'manifest_only',
  remotionGraphicsResult: 'manifest_only',
  groupBTrackAHandoffApprovedNow: false,
  internalBetaApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Group B controlled local fixture execution only',
  nextRecommendedPrompt: 'TRACKA-GD-GROUPB-HANDOFF-0 - Track A Group B Creative Graphics Handoff Review',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
