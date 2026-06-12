import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const groupBTools = ['anime_js_motion', 'lottie_web_overlays', 'remotion_graphics'];

const requiredDocs = [
  'docs/track-a/creative-graphics-group-b-private-preview-composition-plan.md',
  'docs/track-a/creative-graphics-group-b-private-preview-fixture-layout-plan.md',
  'docs/track-a/creative-graphics-group-b-private-preview-manifest-template.md',
  'docs/track-a/creative-graphics-group-b-private-preview-qa-plan.md',
  'docs/track-a/creative-graphics-group-b-missing-metadata-remediation.md',
  'docs/track-a/creative-graphics-group-b-private-preview-execution-gate.md',
  'docs/track-a/creative-graphics-group-b-private-preview-failure-rollback-cleanup-plan.md',
  'docs/track-a/creative-graphics-group-b-next-private-preview-prompt.md',
  'docs/prompt-tracka-gd-groupb-handoff-1-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-groupb-handoff-1-private-preview-composition-plan.md',
];

const sourceEvidenceDocs = [
  'docs/track-a/creative-graphics-group-b-handoff-review.md',
  'docs/track-a/creative-graphics-group-b-fixture-acceptance-matrix.md',
  'docs/track-a/creative-graphics-group-b-private-preview-readiness.md',
  'docs/track-a/creative-graphics-group-b-missing-metadata-checklist.md',
  'docs/track-a/creative-graphics-group-b-next-handoff-prompt.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-local-execution-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-artifact-manifest-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-qa-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-observability-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-cleanup-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-go-no-go-record.md',
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
  'docs/track-a/creative-graphics-group-b-next-handoff-prompt.md',
  'docs/track-a/creative-graphics-group-b-private-preview-readiness.md',
];

const requiredFalseBooleans = [
  'groupBPrivatePreviewExecutionApprovedNow',
  'remotionFinalRenderApproved',
  'lottieBrowserPlayerApproved',
  'finalRenderExportApproved',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'supabaseMutationApproved',
  'workerExecutionApproved',
  'providerModelCallsApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
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
  return /\b(no|not|none|false|blocked|without|do not|must not|never|out of scope|future|future-only|placeholder|placeholders|docs_only|docs\/status only|not approved|not enabled|not run|not executed|required|unrun|not reviewed|remains blocked|planning only|manifest-only|manifest_only|ready with warnings|accepted with warnings|accepted_with_warnings)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\bGroup B tool execution\b.*\b(enabled|approved|executed|ran|created|yes|true)\b/i,
    /\bAnime\.js\b.*\b(executed|ran|re-ran|created)\b/i,
    /\bLottie\b.*\b(browser|player)\b.*\b(rendered|executed|ran|approved|created|yes|true)\b/i,
    /\bRemotion\b.*\b(rendered|exported|renderer executed|render\/export executed|approved|created|yes|true)\b/i,
    /\bprivate preview\b.*\b(generated|executed|rendered|exported|approved now|yes|true)\b/i,
    /\bpreview generation\b.*\b(executed|enabled|created|ran|approved|yes|true)\b/i,
    /\brender\/export\b.*\b(executed|enabled|created|ran|passed|ready|approved|yes|true)\b/i,
    /\bfinal render\b.*\b(executed|enabled|created|ran|passed|ready|approved|yes|true)\b/i,
    /\bupload(?:ed|s)?\b.*\b(executed|enabled|created|performed|yes|true)\b/i,
    /\bstorage transfer\b.*\b(executed|enabled|created|performed|yes|true)\b/i,
    /\bpublic artifacts?\b.*\b(created|enabled|approved|yes|true)\b/i,
    /\bsigned URL(?:s)?\b.*\b(created|enabled|approved|source of truth|yes|true)\b/i,
    /\bAI tool execution\b.*\b(enabled|yes|true|executed|ran)\b/i,
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
    /\bInternal beta approved:\s*`?true/i,
    /\bExternal beta approved:\s*`?true/i,
    /\bProduction approved:\s*`?true/i,
    /\bdependency mutation\b.*\b(enabled|yes|true|performed)\b/i,
    /\braw prompt execution\b.*\b(enabled|yes|true|executed|ran)\b/i,
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
const sourceEvidenceText = sourceEvidenceDocs.map((file) => readFile(file)).join('\n');
const trackerText = trackerDocs.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${sourceEvidenceText}\n${trackerText}`;
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const workflowText = readFile('.github/workflows/foundation-validation.yml');

for (const file of [...requiredDocs, ...trackerDocs]) {
  const text = readFile(file);
  if (
    !text.includes('TRACKA-GD-GROUPB-HANDOFF-1') ||
    !text.includes('ready_with_warnings_for_tracka_gd_groupb_handoff_2')
  ) {
    failures.push(`File does not reference TRACKA-GD-GROUPB-HANDOFF-1 result: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const toolId of groupBTools) {
  if (!combinedText.includes(toolId)) {
    failures.push(`Missing Group B tool reference: ${toolId}`);
  }
}

for (const booleanName of requiredFalseBooleans) {
  const falsePattern = new RegExp(`"${booleanName}"\\s*:\\s*false|${booleanName}: false`);
  if (!combinedText.match(falsePattern)) {
    failures.push(`Missing false approval boolean: ${booleanName}`);
  }
}

for (const term of [
  'ready_with_warnings_for_tracka_gd_groupb_handoff_2',
  'group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_not_executed',
  'none; Track A Group B creative graphics private preview composition plan only',
  'Fully accepted fixtures: none',
  'Rejected or blocked fixtures: none',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'TRACKA-GD-GROUPB-HANDOFF-2',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Handoff-1 term: ${term}`);
  }
}

for (const metadataTerm of [
  'timing/duration',
  'fps',
  'dimensions/aspect ratio',
  'alpha support',
  'safe zones',
  'Lottie schema validation evidence',
  'Remotion manifest completeness',
  'approved plan snapshot',
  'private artifact source-of-truth binding',
  'checksum/provenance',
  'cleanup evidence',
]) {
  if (!combinedText.toLowerCase().includes(metadataTerm.toLowerCase())) {
    failures.push(`Missing metadata remediation term: ${metadataTerm}`);
  }
}

if (!packageJsonText.includes('"tracka:creative-graphics:group-b-private-preview-plan:diagnostics"')) {
  failures.push('Missing package script tracka:creative-graphics:group-b-private-preview-plan:diagnostics.');
}

if (
  !foundationRunnerText.includes(
    "'tracka:creative-graphics:group-b-handoff:diagnostics',\n  'tracka:creative-graphics:group-b-private-preview-plan:diagnostics'",
  )
) {
  failures.push('Group B private preview plan diagnostic must run immediately after Group B handoff diagnostic.');
}

if (!workflowText.includes('codex/rp-tracka-gd-groupb-handoff-0-review')) {
  failures.push('Foundation workflow missing Handoff-0 PR base trigger.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  groupBPrivatePreviewPlanStatus: 'ready_with_warnings_for_tracka_gd_groupb_handoff_2',
  groupBToolsPlanned: groupBTools.length,
  groupBPrivatePreviewExecutionApprovedNow: false,
  futureExecutionPromptRequired: true,
  runtimeUnlockStatus:
    'group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_not_executed',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A Group B creative graphics private preview composition plan only',
  nextRecommendedPrompt: 'TRACKA-GD-GROUPB-HANDOFF-2 - Group B Private Preview Execution Packet',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
