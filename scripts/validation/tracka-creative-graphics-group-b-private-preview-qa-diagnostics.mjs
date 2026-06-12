import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const groupBTools = ['anime_js_motion', 'lottie_web_overlays', 'remotion_graphics'];
const excludedTools = ['svg_js_vector_graphics', 'resvg_js_svg_rasterization', 'pixijs_canvas_graphics', 'three_js_visuals'];

const requiredDocs = [
  'docs/track-a/creative-graphics-group-b-private-preview-qa-review.md',
  'docs/track-a/creative-graphics-group-b-private-preview-qa-acceptance-matrix.md',
  'docs/track-a/creative-graphics-group-b-private-preview-warning-blocker-register.md',
  'docs/track-a/creative-graphics-group-b-controlled-private-sample-readiness.md',
  'docs/track-a/creative-graphics-group-b-private-preview-qa-cleanup-review.md',
  'docs/track-a/creative-graphics-group-b-next-private-sample-prompt.md',
  'docs/prompt-tracka-gd-groupb-handoff-4-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-groupb-handoff-4-private-preview-qa-review.md',
];

const evidenceDocs = [
  'docs/track-a/creative-graphics-group-b-private-preview-source-verification.md',
  'docs/track-a/creative-graphics-group-b-private-preview-execution-evidence.md',
  'docs/track-a/creative-graphics-group-b-private-preview-qa-evidence.md',
  'docs/track-a/creative-graphics-group-b-private-preview-observability-evidence.md',
  'docs/track-a/creative-graphics-group-b-private-preview-cleanup-evidence.md',
  'docs/track-a/creative-graphics-group-b-private-preview-go-no-go-record.md',
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
  'docs/track-a/creative-graphics-group-b-private-preview-readiness.md',
  'docs/track-a/creative-graphics-group-b-next-private-preview-prompt.md',
];

const requiredFalseBooleans = [
  'groupBPrivateSampleExecutionApprovedNow',
  'groupBPrivatePreviewExecutionApprovedNow',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
  'finalRenderExportApproved',
  'remotionFinalRenderApproved',
  'lottieBrowserPlayerApproved',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'supabaseMutationApproved',
  'workerExecutionApproved',
  'providerModelCallsApproved',
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
  return /\b(no|not|none|false|blocked|without|do not|must not|never|out of scope|future|future-only|placeholder|placeholders|docs_only|docs\/status only|not approved|not enabled|not run|not executed|not performed|not created|not claimed|required|unrun|remains blocked|with warnings|accepted_with_warnings|manifest-only|manifest_only|review|reviewed|evidence|local\/private|ignored|summary|summaries|carried forward|not fully accepted|qa_passed_with_warnings|ready_with_warnings_for_group_b_controlled_private_sample_plan|group_b_private_preview_local_passed_with_warnings)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\bAnime\.js\b.*\b(executed|ran|re-ran|imported|started|approved|yes|true)\b/i,
    /\bLottie\b.*\b(browser|player)\b.*\b(rendered|executed|ran|started|approved|created|yes|true)\b/i,
    /\bRemotion\b.*\b(rendered|exported|renderer executed|render\/export executed|approved|created|yes|true)\b/i,
    /\bpreview generation\b.*\b(executed|enabled|created|ran|approved|yes|true)\b/i,
    /\bfinal render\b.*\b(executed|enabled|created|ran|passed|ready|approved|yes|true)\b/i,
    /\brender\/export\b.*\b(executed|enabled|created|ran|passed|ready|approved|yes|true)\b/i,
    /\bupload(?:ed|s)?\b.*\b(executed|enabled|created|performed|yes|true)\b/i,
    /\bstorage transfer\b.*\b(executed|enabled|created|performed|yes|true)\b/i,
    /\bpublic artifacts?\b.*\b(created|enabled|approved|yes|true)\b/i,
    /\bsigned URL(?:s)?\b.*\b(created|enabled|approved|source of truth|yes|true)\b/i,
    /\bAI tool execution\b.*\b(enabled|yes|true|executed|ran)\b/i,
    /\bGroup B tool execution\b.*\b(enabled|yes|true|executed|ran)\b/i,
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
    /\bInternal beta approved:\s*`?true/i,
    /\bExternal beta approved:\s*`?true/i,
    /\bProduction approved:\s*`?true/i,
    /\bproduction\/beta unlock\b.*\b(enabled|yes|true|approved|unlocked)\b/i,
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
const evidenceText = evidenceDocs.map((file) => readFile(file)).join('\n');
const trackersText = trackerDocs.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${evidenceText}\n${trackersText}`;
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const workflowText = readFile('.github/workflows/foundation-validation.yml');

for (const file of [...requiredDocs, ...trackerDocs]) {
  const text = readFile(file);
  if (!text.includes('TRACKA-GD-GROUPB-HANDOFF-4') && !text.includes('group_b_private_preview_qa_passed_with_warnings')) {
    failures.push(`File does not reference Group B Handoff-4 QA status: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of [
  'TRACKA-GD-GROUPB-HANDOFF-4',
  'group_b_private_preview_qa_passed_with_warnings',
  'ready_with_warnings_for_group_b_controlled_private_sample_plan',
  'group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_execution_packet_ready_with_warnings / group_b_private_preview_local_passed_with_warnings / group_b_private_preview_qa_passed_with_warnings',
  'accepted_with_warnings',
  'TRACKA-GD-GROUPB-HANDOFF-5 - Group B Controlled Private Sample Planning',
  'none; Track A Group B creative graphics private preview QA review only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
  'blocked_pending_workstream_gates',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Group B Handoff-4 term: ${term}`);
  }
}

for (const toolId of groupBTools) {
  if (!docsText.includes(toolId) || !trackersText.includes(toolId)) {
    failures.push(`Missing Group B tool reference: ${toolId}`);
  }
  const rowPattern = new RegExp(`\\|\\s*\`${toolId}\`[\\s\\S]*?\`accepted_with_warnings\`\\s*\\|`);
  if (!rowPattern.test(docsText)) {
    failures.push(`Missing accepted_with_warnings QA row for ${toolId}`);
  }
}

for (const toolId of excludedTools) {
  if (!combinedText.includes(toolId)) {
    failures.push(`Missing excluded/context tool reference: ${toolId}`);
  }
}

for (const evidenceTerm of [
  'group_b_source_evidence_verified',
  'group_b_private_preview_local_passed_with_warnings',
  'group-b-private-preview-manifest.json',
  'group-b-private-preview-composition.svg',
  'qa-evidence.json',
  'cleanup-evidence.json',
]) {
  if (!evidenceText.includes(evidenceTerm) && !docsText.includes(evidenceTerm)) {
    failures.push(`Missing Handoff-3 evidence term: ${evidenceTerm}`);
  }
}

for (const booleanName of requiredFalseBooleans) {
  const falsePattern = new RegExp(`"${booleanName}"\\s*:\\s*false|${booleanName}: false`);
  if (!combinedText.match(falsePattern)) {
    failures.push(`Missing false approval boolean: ${booleanName}`);
  }
}

if (!packageJsonText.includes('tracka:creative-graphics:group-b-private-preview-qa:diagnostics')) {
  failures.push('Missing package script tracka:creative-graphics:group-b-private-preview-qa:diagnostics.');
}

const executionIndex = foundationRunnerText.indexOf(
  'tracka:creative-graphics:group-b-private-preview-execution:diagnostics',
);
const qaIndex = foundationRunnerText.indexOf('tracka:creative-graphics:group-b-private-preview-qa:diagnostics');
if (qaIndex === -1) {
  failures.push('Foundation runner missing Group B private preview QA diagnostic.');
} else if (executionIndex === -1 || qaIndex < executionIndex) {
  failures.push('Group B private preview QA diagnostic must run after Handoff-3 private preview execution diagnostic.');
}

if (!workflowText.includes('codex/rp-tracka-gd-groupb-handoff-3-private-preview-execution')) {
  failures.push('Foundation Validation workflow missing Handoff-3 base branch trigger coverage.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  groupBPrivatePreviewQaResult: combinedText.includes('group_b_private_preview_qa_passed_with_warnings')
    ? 'group_b_private_preview_qa_passed_with_warnings'
    : 'missing',
  readiness: combinedText.includes('ready_with_warnings_for_group_b_controlled_private_sample_plan')
    ? 'ready_with_warnings_for_group_b_controlled_private_sample_plan'
    : 'missing',
  toolsReviewed: groupBTools.length,
  acceptedWithWarningsCount: groupBTools.length,
  fullInternalBetaApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A Group B creative graphics private preview QA review only',
  nextRecommendedPrompt: 'TRACKA-GD-GROUPB-HANDOFF-5 - Group B Controlled Private Sample Planning',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
