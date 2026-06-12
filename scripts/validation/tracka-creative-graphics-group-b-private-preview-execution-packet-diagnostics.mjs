import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const groupBTools = ['anime_js_motion', 'lottie_web_overlays', 'remotion_graphics'];

const requiredDocs = [
  'docs/track-a/creative-graphics-group-b-private-preview-execution-packet.md',
  'docs/track-a/creative-graphics-group-b-source-evidence-lockfile.md',
  'docs/track-a/creative-graphics-group-b-private-preview-future-command-template.md',
  'docs/track-a/creative-graphics-group-b-private-preview-execution-manifest.md',
  'docs/track-a/creative-graphics-group-b-private-preview-execution-qa-packet.md',
  'docs/track-a/creative-graphics-group-b-private-preview-cleanup-rollback-packet.md',
  'docs/track-a/creative-graphics-group-b-private-preview-go-no-go-record.md',
  'docs/prompt-tracka-gd-groupb-handoff-2-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-groupb-handoff-2-private-preview-execution-packet.md',
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
  'docs/track-a/creative-graphics-group-b-next-private-preview-prompt.md',
  'docs/track-a/creative-graphics-group-b-private-preview-readiness.md',
  'docs/track-a/creative-graphics-group-b-private-preview-execution-gate.md',
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
  return /\b(no|not|none|false|blocked|without|do not|must not|never|out of scope|future|future-only|placeholder|placeholders|template|packet|docs_only|docs\/status only|not approved|not enabled|not run|not executed|not performed|not created|not claimed|required|unrun|remains blocked|with warnings|ready_with_warnings|accepted with warnings|accepted_with_warnings|source lock|lockfile|manifest-only|manifest_only)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\bGroup B tool execution\b.*\b(enabled|approved|executed|ran|created|yes|true)\b/i,
    /\bAnime\.js\b.*\b(executed|ran|re-ran|created|approved|yes|true)\b/i,
    /\bLottie\b.*\b(browser|player)\b.*\b(rendered|executed|ran|approved|created|yes|true)\b/i,
    /\bRemotion\b.*\b(rendered|exported|renderer executed|render\/export executed|approved|created|yes|true)\b/i,
    /\bprivate preview\b.*\b(generated|executed|rendered|exported|approved now|performed|ran|created)\b/i,
    /\bpreview generation\b.*\b(executed|enabled|created|ran|approved|yes|true)\b/i,
    /\brender\/export\b.*\b(executed|enabled|created|ran|passed|ready|approved|yes|true)\b/i,
    /\bfinal render\b.*\b(executed|enabled|created|ran|passed|ready|approved|yes|true)\b/i,
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
    /\bInternal beta approved:\s*`?true/i,
    /\bExternal beta approved:\s*`?true/i,
    /\bProduction approved:\s*`?true/i,
    /\bdependency mutation\b.*\b(enabled|yes|true|performed)\b/i,
    /\braw prompt execution\b.*\b(enabled|yes|true|executed|ran)\b/i,
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
  if (
    !text.includes('TRACKA-GD-GROUPB-HANDOFF-2') ||
    !text.includes('ready_with_warnings_for_tracka_gd_groupb_handoff_3')
  ) {
    failures.push(`File does not reference TRACKA-GD-GROUPB-HANDOFF-2 result: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const toolId of groupBTools) {
  if (!docsText.includes(toolId) || !trackersText.includes(toolId)) {
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
  'group_b_private_preview_execution_packet_ready_with_warnings',
  'group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_execution_packet_ready_with_warnings / group_b_private_preview_not_executed',
  'none; Track A Group B creative graphics private preview execution packet only',
  'Fully accepted fixtures: none',
  'Rejected or blocked fixtures: none',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
  '"futureExecutionPromptRequired": true',
  'TRACKA-GD-GROUPB-HANDOFF-3 - Group B Private Preview Execution',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Handoff-2 term: ${term}`);
  }
}

for (const metadataTerm of [
  'timing',
  'fps',
  'duration',
  'dimensions/aspect ratio',
  'alpha/transparency',
  'safe-zone',
  'checksum/provenance',
  'approved plan snapshot',
  'cleanup evidence',
  'source evidence lockfile',
]) {
  if (!combinedText.toLowerCase().includes(metadataTerm.toLowerCase())) {
    failures.push(`Missing metadata term: ${metadataTerm}`);
  }
}

const commandTemplate = readFile(
  'docs/track-a/creative-graphics-group-b-private-preview-future-command-template.md',
);
const commandBlocks = [...commandTemplate.matchAll(/```(?:sh|bash)\n([\s\S]*?)```/g)].map(
  (match) => match[1],
);
if (commandBlocks.length === 0) {
  failures.push('No shell command blocks found in Group B future command template.');
}

for (const [index, block] of commandBlocks.entries()) {
  const requiredWarning = 'DO NOT RUN UNTIL TRACKA-GD-GROUPB-HANDOFF-3 EXECUTION APPROVAL EXISTS.';
  const occurrences = block.split(requiredWarning).length - 1;
  if (occurrences !== 1) {
    failures.push(`Command block ${index + 1} must include the required approval warning exactly once.`);
  }
}

for (const placeholder of [
  '<GROUP_B_PRIVATE_PREVIEW_RUN_ID>',
  '<SOURCE_EVIDENCE_LOCKFILE>',
  '<GROUP_B_PRIVATE_PREVIEW_MANIFEST>',
  '<LOCAL_OUTPUT_DIR>',
  '<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>',
]) {
  if (!commandTemplate.includes(placeholder)) {
    failures.push(`Future command template missing placeholder: ${placeholder}`);
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

if (
  !packageJsonText.includes(
    'tracka:creative-graphics:group-b-private-preview-execution-packet:diagnostics',
  )
) {
  failures.push('Missing package script tracka:creative-graphics:group-b-private-preview-execution-packet:diagnostics.');
}

if (
  !foundationRunnerText.includes(
    "'tracka:creative-graphics:group-b-private-preview-plan:diagnostics',\n  'tracka:creative-graphics:group-b-private-preview-execution-packet:diagnostics'",
  )
) {
  failures.push('Group B private preview execution packet diagnostic must run immediately after the Handoff-1 plan diagnostic.');
}

if (!workflowText.includes('codex/rp-tracka-gd-groupb-handoff-1-private-preview-composition-plan')) {
  failures.push('Foundation workflow missing Handoff-1 PR base trigger.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  groupBPrivatePreviewExecutionPacketStatus: 'group_b_private_preview_execution_packet_ready_with_warnings',
  decisionState: 'ready_with_warnings_for_tracka_gd_groupb_handoff_3',
  groupBToolsCovered: groupBTools.length,
  groupBPrivatePreviewExecutionApprovedNow: false,
  futureExecutionPromptRequired: true,
  runtimeUnlockStatus:
    'group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_execution_packet_ready_with_warnings / group_b_private_preview_not_executed',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A Group B creative graphics private preview execution packet only',
  nextRecommendedPrompt: 'TRACKA-GD-GROUPB-HANDOFF-3 - Group B Private Preview Execution',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
