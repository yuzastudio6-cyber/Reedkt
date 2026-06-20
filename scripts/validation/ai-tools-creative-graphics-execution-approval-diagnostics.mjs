import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const toolGroups = {
  approved_for_gd7_controlled_local_execution: [
    'svg_js_vector_graphics',
    'satori_social_cards',
    'resvg_js_svg_rasterization',
    'd3_dataviz',
    'echarts_dataviz',
    'vega_lite_dataviz',
    'viz_graphviz_diagrams',
  ],
  needs_package_review: [
    'anime_js_motion',
    'lottie_web_overlays',
    'remotion_graphics',
  ],
  blocked: [
    'pixijs_canvas_graphics',
    'three_js_visuals',
  ],
};

const tools = Object.values(toolGroups).flat();

const requiredDocs = [
  'docs/ai-tools/creative-graphics-execution-approval-gate-packet.md',
  'docs/ai-tools/creative-graphics-execution-approval-matrix.md',
  'docs/ai-tools/creative-graphics-gd7-allowed-scope.md',
  'docs/ai-tools/creative-graphics-gd7-blocked-scope.md',
  'docs/ai-tools/creative-graphics-gd7-qa-evidence-requirements.md',
  'docs/ai-tools/creative-graphics-gd7-approval-decision-record.md',
  'docs/prompt-gd-6-validation-results.md',
  'docs/implementation-prompts/prompt-gd-6-ai-tools-creative-graphics-execution-approval-gate.md',
];

const requiredTrackers = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/ai-tools/creative-graphics-future-prompt-sequence.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
  'docs/ai-tools/creative-graphics-all-tools-readiness-matrix.md',
  'docs/ai-tools/creative-graphics-next-fixture-plan.md',
  'docs/ai-tools/creative-graphics-generated-local-readiness-matrix.md',
  'docs/ai-tools/creative-graphics-next-execution-plan-readiness.md',
  'docs/ai-tools/creative-graphics-controlled-fixture-execution-plan.md',
  'docs/ai-tools/creative-graphics-execution-gate-decision-record.md',
];

const runtimeStatus =
  'repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / approved_for_gd7_controlled_local_fixture_execution / generated_local_fixture_not_executed';

const requiredStatusTerms = [
  'GD-6',
  'approved_for_gd7_controlled_local_fixture_execution',
  runtimeStatus,
  'none; AI Tools creative graphics execution approval gate packet only',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Prompt GD-7 - Creative Graphics Controlled Local Fixture Execution',
];

const requiredDecisionTerms = [
  '"decisionState": "approved_for_gd7_controlled_local_fixture_execution"',
  '"approvalScope": "local_generated_fixture_execution_only"',
  '"productionApproved": false',
  '"betaApproved": false',
  '"publicArtifactsApproved": false',
  '"signedUrlsApproved": false',
  '"workerExecutionApproved": false',
  '"providerCallsApproved": false',
  '"supabaseMutationApproved": false',
  '"gcsUploadApproved": false',
  '"trackAFinalExportApproved": false',
  '"rawPromptExecutionApproved": false',
  '"requiresSyntheticInputsOnly": true',
  '"requiresLocalOutputOnly": true',
  '"requiresNoDependencyMutation": true',
  '"nextAllowedPrompt": "Prompt GD-7 — Creative Graphics Controlled Local Fixture Execution"',
];

const failures = [];

function readFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}

function isSafetyNegated(line) {
  return /\b(no|not|blocked|must not|do not|without|none|out of scope|forbid|prohibit|never|future-only|placeholder|placeholders only|missing|absent|unrun|not run|does not|did not|remains blocked|not approved|approval missing|not execute|not enabled|not created|not claimed|not performed|skip|skipped|needs_package_review)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /tool execution:\s*`?(enabled|yes|true|executed|ran|unlocked)`?/i,
    /worker execution:\s*`?(enabled|yes|true|executed|ran|unlocked)`?/i,
    /(provider|model) (call|calls):\s*`?(enabled|yes|true|executed|ran)`?/i,
    /render\/export:\s*`?(enabled|yes|true|executed|ran|unlocked)`?/i,
    /media processing:\s*`?(enabled|yes|true|executed|ran)`?/i,
    /browser capture:\s*`?(enabled|yes|true|executed|ran)`?/i,
    /Docker\/Cloud Run.*:\s*`?(enabled|yes|true|executed|ran)`?/i,
    /Google Cloud.*:\s*`?(enabled|yes|true|used|fetched|called)`?/i,
    /Secret Manager.*:\s*`?(enabled|yes|true|used|fetched|called)`?/i,
    /Supabase environment touched:\s*`?(local|staging|remote|production|yes|true)`?/i,
    /SQL executed:\s*`?(local|staging|remote|production|yes|true)`?/i,
    /Migration deployed:\s*`?(yes|true|staging|production)`?/i,
    /productionApproved:\s*true/i,
    /betaApproved:\s*true/i,
    /publicArtifactsApproved:\s*true/i,
    /signedUrlsApproved:\s*true/i,
    /workerExecutionApproved:\s*true/i,
    /providerCallsApproved:\s*true/i,
    /supabaseMutationApproved:\s*true/i,
    /gcsUploadApproved:\s*true/i,
    /rawPromptExecutionApproved:\s*true/i,
    /public artifact(?:s)?:\s*`?(created|yes|true|present|allowed|enabled)`?/i,
    /signed URL source(?:-| )of(?:-| )truth:\s*`?(allowed|enabled|yes|true)`?/i,
    /runtime unlock:\s*`?(enabled|yes|true|unlocked)`?/i,
    /production capability enabled:\s*`?(?!none; AI Tools creative graphics resvg runtime review only|none; AI Tools creative graphics package runtime enablement only|none; Track A creative graphics handoff review only|none; controlled local creative graphics fixture execution only|none; AI Tools creative graphics execution approval gate packet only|none; AI Tools creative graphics controlled execution plan only|none; AI Tools creative graphics static fixture gate review only|none; AI Tools creative graphics generated\/local fixture candidate pack only|none; AI Tools creative graphics dry-run fixture pack only|none; AI Tools creative graphics manifest contract only|none; AI Tools creative graphics repo audit only)/i,
    /postgres(?:ql)?:\/\/[^@\s]+@/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /X-Goog-Signature|X-Amz-Signature|sig=|signature=/i,
    /https?:\/\/(?!github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/|github\.com\/yuzastudio6-cyber\/Reedkt\/actions\/)/i,
    /gs:\/\/|storage\.googleapis\.com/i,
    /\bsupabase\s+(start|status|link|db|migration|functions|projects)\b/i,
    /\bgcloud\b/i,
    /\bpsql\b/i,
    /\bdocker\b/i,
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

function matrixStatusForTool(matrixText, toolId) {
  const row = matrixText
    .split('\n')
    .find((line) => line.includes(`\`${toolId}\``) || line.includes(toolId));
  if (!row) {
    return null;
  }
  if (row.includes('approved_for_gd7_controlled_local_execution')) {
    return 'approved_for_gd7_controlled_local_execution';
  }
  if (row.includes('needs_package_review')) {
    return 'needs_package_review';
  }
  if (row.includes('blocked')) {
    return 'blocked';
  }
  return 'unknown';
}

const docsText = requiredDocs.map((file) => readFile(file)).join('\n');
const trackersText = requiredTrackers.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${trackersText}`;

for (const file of [...requiredDocs, ...requiredTrackers]) {
  const text = readFile(file);
  if (!text.includes('GD-6') && !text.includes('approved_for_gd7_controlled_local_fixture_execution')) {
    failures.push(`File does not reference GD-6/execution approval status: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of requiredStatusTerms) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required status term: ${term}`);
  }
}

for (const tool of tools) {
  if (!combinedText.includes(tool)) {
    failures.push(`Missing tool reference in GD-6 docs/trackers: ${tool}`);
  }
}

const matrixText = readFile('docs/ai-tools/creative-graphics-execution-approval-matrix.md');
const statusCounts = {
  approved_for_gd7_controlled_local_execution: 0,
  needs_package_review: 0,
  blocked: 0,
};

for (const [expectedStatus, expectedTools] of Object.entries(toolGroups)) {
  for (const tool of expectedTools) {
    const actualStatus = matrixStatusForTool(matrixText, tool);
    if (actualStatus !== expectedStatus) {
      failures.push(`Matrix status mismatch for ${tool}: expected ${expectedStatus}, got ${actualStatus ?? 'missing'}`);
    } else {
      statusCounts[expectedStatus] += 1;
    }
  }
}

for (const [status, expectedTools] of Object.entries(toolGroups)) {
  if (statusCounts[status] !== expectedTools.length) {
    failures.push(`Status count mismatch for ${status}: expected ${expectedTools.length}, got ${statusCounts[status]}`);
  }
}

const decisionText = readFile('docs/ai-tools/creative-graphics-gd7-approval-decision-record.md');
for (const decisionTerm of requiredDecisionTerms) {
  if (!decisionText.includes(decisionTerm)) {
    failures.push(`Missing GD-6 decision record term: ${decisionTerm}`);
  }
}

const workflowText = readFile('.github/workflows/foundation-validation.yml');
if (!workflowText.includes('codex/rp-gd-5-ai-tools-creative-graphics-controlled-fixture-execution-plan')) {
  failures.push('Foundation Validation workflow does not cover the GD-5 PR base branch.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  executionApprovalDecision: 'approved_for_gd7_controlled_local_fixture_execution',
  approvedForGd7Count: statusCounts.approved_for_gd7_controlled_local_execution,
  needsPackageReviewCount: statusCounts.needs_package_review,
  blockedCount: statusCounts.blocked,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; AI Tools creative graphics execution approval gate packet only',
  nextRecommendedPrompt: 'Prompt GD-7 - Creative Graphics Controlled Local Fixture Execution',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
