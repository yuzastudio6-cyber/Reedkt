import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const tools = [
  'remotion_graphics',
  'd3_dataviz',
  'three_js_visuals',
  'pixijs_canvas_graphics',
  'anime_js_motion',
  'lottie_web_overlays',
  'svg_js_vector_graphics',
  'echarts_dataviz',
  'vega_lite_dataviz',
  'viz_graphviz_diagrams',
  'satori_social_cards',
  'resvg_js_svg_rasterization',
];

const requiredDocs = [
  'docs/ai-tools/creative-graphics-controlled-fixture-execution-plan.md',
  'docs/ai-tools/creative-graphics-per-tool-execution-readiness-plan.md',
  'docs/ai-tools/creative-graphics-fixture-execution-groups.md',
  'docs/ai-tools/creative-graphics-future-execution-command-templates.md',
  'docs/ai-tools/creative-graphics-execution-qa-evidence-plan.md',
  'docs/ai-tools/creative-graphics-execution-track-a-handoff-plan.md',
  'docs/ai-tools/creative-graphics-execution-worker-gate-plan.md',
  'docs/ai-tools/creative-graphics-execution-failure-rollback-cleanup-plan.md',
  'docs/ai-tools/creative-graphics-execution-gate-decision-record.md',
  'docs/prompt-gd-5-validation-results.md',
  'docs/implementation-prompts/prompt-gd-5-ai-tools-creative-graphics-controlled-fixture-execution-plan.md',
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
];

const expectedRuntimeStatus =
  'repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / execution_not_approved / generated_local_fixture_not_executed';

const requiredStatusTerms = [
  expectedRuntimeStatus,
  'execution_plan_ready',
  'execution_not_approved',
  'none; AI Tools creative graphics controlled execution plan only',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Prompt GD-6 - Creative Graphics Execution Approval Gate Packet',
];

const commandWarning = 'DO NOT RUN UNTIL GD EXECUTION APPROVAL EXISTS.';

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
  return /\b(no|not|blocked|must not|do not|without|none|out of scope|forbid|prohibit|never|future-only|placeholder|placeholders only|missing|absent|unrun|not run|does not|did not|remains blocked|not approved|approval missing|not execute|not enabled|not created|not claimed|not performed)\b/i.test(
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
    /executionApprovalState:\s*`?(approved|true|yes|execution_approved|approved_for_execution)`?/i,
    /productionApproved:\s*true/i,
    /betaApproved:\s*true/i,
    /publicArtifactsApproved:\s*true/i,
    /signedUrlsApproved:\s*true/i,
    /rawPromptExecutionApproved:\s*true/i,
    /public artifact(?:s)?:\s*`?(created|yes|true|present|allowed|enabled)`?/i,
    /signed URL source(?:-| )of(?:-| )truth:\s*`?(allowed|enabled|yes|true)`?/i,
    /runtime unlock:\s*`?(enabled|yes|true|unlocked)`?/i,
    /production capability enabled:\s*`?(?!none; AI Tools creative graphics controlled execution plan only|none; AI Tools creative graphics static fixture gate review only|none; AI Tools creative graphics generated\/local fixture candidate pack only|none; AI Tools creative graphics dry-run fixture pack only|none; AI Tools creative graphics manifest contract only|none; AI Tools creative graphics repo audit only)/i,
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

const docsText = requiredDocs.map((file) => readFile(file)).join('\n');
const trackersText = requiredTrackers.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${trackersText}`;

for (const file of [...requiredDocs, ...requiredTrackers]) {
  const text = readFile(file);
  if (!text.includes('GD-5') && !text.includes('execution_plan_ready')) {
    failures.push(`File does not reference GD-5/execution_plan_ready: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of requiredStatusTerms) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required status term: ${term}`);
  }
}

for (const tool of tools) {
  if (!docsText.includes(tool)) {
    failures.push(`Missing tool reference in GD-5 docs: ${tool}`);
  }
  if (!trackersText.includes(tool) && !trackersText.includes('all 12')) {
    failures.push(`Missing tool reference or all-tools marker in trackers: ${tool}`);
  }
}

const groupsText = readFile('docs/ai-tools/creative-graphics-fixture-execution-groups.md');
for (const group of ['Group A', 'Group B', 'Group C']) {
  if (!groupsText.includes(group)) {
    failures.push(`Missing execution group: ${group}`);
  }
}

const commandTemplateText = readFile('docs/ai-tools/creative-graphics-future-execution-command-templates.md');
const codeBlocks = [...commandTemplateText.matchAll(/```[\s\S]*?```/g)].map((match) => match[0]);
if (codeBlocks.length === 0) {
  failures.push('No command template code blocks found.');
}
for (const [index, block] of codeBlocks.entries()) {
  if (!block.includes(commandWarning)) {
    failures.push(`Command template block ${index + 1} is missing required warning text.`);
  }
  for (const placeholder of [
    '<TOOL_ID>',
    '<FIXTURE_ID>',
    '<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>',
    '<PRIVATE_ARTIFACT_SCOPE_PLACEHOLDER>',
    '<LOCAL_OUTPUT_DIR_PLACEHOLDER>',
  ]) {
    if (!block.includes(placeholder)) {
      failures.push(`Command template block ${index + 1} is missing placeholder ${placeholder}.`);
    }
  }
}

const decisionText = readFile('docs/ai-tools/creative-graphics-execution-gate-decision-record.md');
for (const requiredDecisionTerm of [
  '"executionApprovalState": "not_approved"',
  '"nextAllowedState": "execution_plan_ready"',
  '"productionApproved": false',
  '"betaApproved": false',
  '"publicArtifactsApproved": false',
  '"signedUrlsApproved": false',
  '"rawPromptExecutionApproved": false',
]) {
  if (!decisionText.includes(requiredDecisionTerm)) {
    failures.push(`Missing gate decision term: ${requiredDecisionTerm}`);
  }
}

const workflowText = readFile('.github/workflows/foundation-validation.yml');
if (!workflowText.includes('codex/rp-gd-4-ai-tools-creative-graphics-static-fixture-gate-review')) {
  failures.push('Foundation Validation workflow does not cover the GD-4 PR base branch.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  creativeGraphicsExecutionPlanStatus: 'execution_plan_ready',
  executionApprovalState: 'not_approved',
  toolsChecked: tools.length,
  commandTemplateBlocksChecked: codeBlocks.length,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; AI Tools creative graphics controlled execution plan only',
  nextRecommendedPrompt: 'Prompt GD-6 - Creative Graphics Execution Approval Gate Packet',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
