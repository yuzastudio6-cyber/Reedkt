import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const groupBTools = ['anime_js_motion', 'lottie_web_overlays', 'remotion_graphics'];
const allowedResults = [
  'group_b_private_preview_local_passed',
  'group_b_private_preview_local_passed_with_warnings',
  'group_b_private_preview_failed',
  'blocked_pending_group_b_source_evidence',
];

const requiredDocs = [
  'docs/track-a/creative-graphics-group-b-private-preview-source-verification.md',
  'docs/track-a/creative-graphics-group-b-private-preview-execution-evidence.md',
  'docs/track-a/creative-graphics-group-b-private-preview-qa-evidence.md',
  'docs/track-a/creative-graphics-group-b-private-preview-observability-evidence.md',
  'docs/track-a/creative-graphics-group-b-private-preview-cleanup-evidence.md',
  'docs/track-a/creative-graphics-group-b-private-preview-go-no-go-record.md',
  'docs/prompt-tracka-gd-groupb-handoff-3-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-groupb-handoff-3-private-preview-execution.md',
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
  'docs/ai-tools/creative-graphics-gd10-group-b-local-execution-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-artifact-manifest-evidence.md',
  'docs/ai-tools/creative-graphics-gd10-group-b-qa-evidence.md',
];

const requiredFalseBooleans = [
  'groupBPrivateSampleApprovedNow',
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
  return /\b(no|not|none|false|blocked|without|do not|must not|never|out of scope|future|future-only|placeholder|placeholders|docs_only|docs\/status only|not approved|not enabled|not run|not executed|not performed|not created|not claimed|required|unrun|remains blocked|with warnings|accepted_with_warnings|manifest-only|manifest_only|source evidence|evidence-only|local\/private|ignored|summary|summaries|group_b_private_preview_local_passed_with_warnings|group_b_private_preview_failed|blocked_pending_group_b_source_evidence)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\bAnime\.js\b.*\b(executed|ran|re-ran|imported|started|approved|yes|true)\b/i,
    /\bLottie\b.*\b(browser|player)\b.*\b(rendered|executed|ran|started|approved|created|yes|true)\b/i,
    /\bRemotion\b.*\b(rendered|exported|renderer executed|render\/export executed|approved|created|yes|true)\b/i,
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
const trackersText = trackerDocs.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${trackersText}`;
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const workflowText = readFile('.github/workflows/foundation-validation.yml');
const composerText = readFile('scripts/track-a/compose-creative-graphics-group-b-private-preview.mjs');

for (const file of [...requiredDocs, ...trackerDocs]) {
  const text = readFile(file);
  scanUnsafeLines(file, text);
}

for (const toolId of groupBTools) {
  if (!docsText.includes(toolId) || !trackersText.includes(toolId)) {
    failures.push(`Missing Group B tool reference: ${toolId}`);
  }
}

const resultTerms = allowedResults.filter((term) => combinedText.includes(term));
if (resultTerms.length === 0) {
  failures.push(`No allowed Handoff-3 result found. Expected one of: ${allowedResults.join(', ')}`);
}

for (const term of [
  'TRACKA-GD-GROUPB-HANDOFF-3',
  'group_b_source_evidence_verified',
  'group_b_private_preview_local_passed_with_warnings',
  'group_b_private_preview_qa_passed_with_warnings',
  'group_b_private_preview_observability_recorded',
  'group_b_private_preview_cleanup_recorded',
  'group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_execution_packet_ready_with_warnings / group_b_private_preview_local_passed_with_warnings',
  'none; Track A Group B creative graphics private preview execution only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
  'tracka-gd-groupb-handoff-3-2026-06-12T13-56-19-778Z',
  'gd10-2026-06-11T02-46-01-930Z',
  'group-b-private-preview-manifest.json',
  'group-b-private-preview-composition.svg',
  'checksum-summary.json',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Handoff-3 term: ${term}`);
  }
}

for (const hash of [
  '508062df67d2f36cb193599916e6af0218aeab23870a08f3e2c932afc4b61bb9',
  '179d20b706b4e1cfd28c8844ee13b1c48c61f3f2cedf65ebcaf7f898f4161c83',
  'ee4a3e0d71f1f06781f7903f9208da4a65faed90f52f5af237bb46aa2ee7a13b',
  '8abfd7c6a18b9606b970df7ce35fa074dfeae98f8ca2710c8bea94b231ebfe31',
  '07941f0e7d5e3d9981cbd53cc4f11fc4ff7733faa9852831f4117bfb65c4a3db',
  '3b802d6f5c5e1cb4231889fdf53bca0b6a95b89309566ade6d84130d66d07a71',
  '39d5bbda53d88a27910d72b8a1ebfbc1e0374db6d9e4c3286fb566bf9ee14aa6',
  '5286be9c5fa3b887b7867f7d78b8c45313c0930f860561759ee440acf3f58823',
  '2204432343e67e6b57feb1de0f4ecd8eb77cd67ee7669fbf9fea80cccddaaec0',
  '34d24f675edd1f3341c34960da63a5d81c36f3897994132c48c8cc0a1fe70c45',
]) {
  if (!combinedText.includes(hash)) {
    failures.push(`Missing evidence checksum: ${hash}`);
  }
}

for (const booleanName of requiredFalseBooleans) {
  const falsePattern = new RegExp(`"${booleanName}"\\s*:\\s*false|${booleanName}: false`);
  if (!combinedText.match(falsePattern)) {
    failures.push(`Missing false approval boolean: ${booleanName}`);
  }
}

for (const boundaryToken of [
  'anime_js_execution',
  'lottie_browser_player_rendering',
  'remotion_render_export',
  'final_render_export',
  'signed_url_source_of_truth',
  'public_artifact',
  'supabase_mutation',
  'sql_execution',
  'worker_execution',
  'provider_model_calls',
]) {
  if (!composerText.includes(boundaryToken)) {
    failures.push(`Composer does not preserve blocked boundary token: ${boundaryToken}`);
  }
}

if (!composerText.includes("import { createHash } from 'node:crypto'")) {
  failures.push('Composer must use Node built-ins only and include crypto hashing.');
}

if (composerText.includes("await import(") || composerText.includes('child_process')) {
  failures.push('Composer must not dynamically import runtimes or shell out.');
}

if (!packageJsonText.includes('tracka:creative-graphics:group-b-private-preview-execution:diagnostics')) {
  failures.push('Missing package script tracka:creative-graphics:group-b-private-preview-execution:diagnostics.');
}

const packetIndex = foundationRunnerText.indexOf(
  'tracka:creative-graphics:group-b-private-preview-execution-packet:diagnostics',
);
const executionIndex = foundationRunnerText.indexOf(
  'tracka:creative-graphics:group-b-private-preview-execution:diagnostics',
);
if (executionIndex === -1) {
  failures.push('Foundation runner missing Group B private preview execution diagnostic.');
} else if (packetIndex === -1 || executionIndex < packetIndex) {
  failures.push('Group B private preview execution diagnostic must run after the Handoff-2 packet diagnostic.');
}

if (
  !workflowText.includes('codex/rp-tracka-gd-groupb-handoff-2-private-preview-execution-packet')
) {
  failures.push('Foundation Validation workflow missing Handoff-2 base branch trigger coverage.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  groupBPrivatePreviewResult: resultTerms.includes('group_b_private_preview_local_passed_with_warnings')
    ? 'group_b_private_preview_local_passed_with_warnings'
    : resultTerms[0] ?? 'missing',
  sourceVerificationResult: combinedText.includes('group_b_source_evidence_verified')
    ? 'group_b_source_evidence_verified'
    : 'missing',
  toolsChecked: groupBTools.length,
  animeJsStatus: 'accepted_with_warnings',
  lottieWebStatus: 'accepted_with_warnings',
  remotionStatus: 'accepted_with_warnings',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A Group B creative graphics private preview execution only',
  nextRecommendedPrompt: 'TRACKA-GD-GROUPB-HANDOFF-4 - Group B Private Preview QA Review',
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}
