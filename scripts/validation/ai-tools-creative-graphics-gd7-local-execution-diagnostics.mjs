import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const groupA = [
  'svg_js_vector_graphics',
  'satori_social_cards',
  'resvg_js_svg_rasterization',
  'd3_dataviz',
  'echarts_dataviz',
  'vega_lite_dataviz',
  'viz_graphviz_diagrams',
];

const groupB = [
  'anime_js_motion',
  'lottie_web_overlays',
  'remotion_graphics',
];

const groupC = [
  'pixijs_canvas_graphics',
  'three_js_visuals',
];

const requiredDocs = [
  'docs/ai-tools/creative-graphics-gd7-runtime-availability.md',
  'docs/ai-tools/creative-graphics-gd7-local-output-policy.md',
  'docs/ai-tools/creative-graphics-gd7-local-execution-evidence.md',
  'docs/ai-tools/creative-graphics-gd7-local-artifact-manifest-evidence.md',
  'docs/ai-tools/creative-graphics-gd7-qa-evidence.md',
  'docs/prompt-gd-7-validation-results.md',
  'docs/implementation-prompts/prompt-gd-7-ai-tools-creative-graphics-controlled-local-fixture-execution.md',
];

const requiredTrackers = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/ai-tools/creative-graphics-execution-approval-gate-packet.md',
  'docs/ai-tools/creative-graphics-execution-approval-matrix.md',
  'docs/ai-tools/creative-graphics-gd7-approval-decision-record.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
  'docs/ai-tools/creative-graphics-all-tools-readiness-matrix.md',
  'docs/ai-tools/creative-graphics-next-fixture-plan.md',
];

const runnerPath = 'scripts/fixtures/ai-tools/run-creative-graphics-gd7-fixtures.mjs';

const requiredTerms = [
  'GD-7',
  'generated_local_fixture_blocked',
  'none; controlled local creative graphics fixture execution only',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Prompt GD-8 - Creative Graphics Package Runtime Review for Group B',
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
  return /\b(no|not|blocked|must not|do not|without|none|out of scope|forbid|prohibit|never|future-only|placeholder|placeholders only|missing|absent|unrun|not run|does not|did not|remains blocked|not approved|approval missing|not execute|not enabled|not created|not claimed|not performed|skip|skipped|unavailable|blocked\/skipped)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /Group B.*executed:\s*`?(yes|true|executed|ran)`?/i,
    /Group C.*executed:\s*`?(yes|true|executed|ran)`?/i,
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
    /production capability enabled:\s*`?(?!none; AI Tools creative graphics resvg runtime review only|none; AI Tools creative graphics package runtime enablement only|none; controlled local creative graphics fixture execution only|none; AI Tools creative graphics execution approval gate packet only|none; AI Tools creative graphics controlled execution plan only|none; AI Tools creative graphics static fixture gate review only|none; AI Tools creative graphics generated\/local fixture candidate pack only|none; AI Tools creative graphics dry-run fixture pack only|none; AI Tools creative graphics manifest contract only|none; AI Tools creative graphics repo audit only)/i,
    /postgres(?:ql)?:\/\/[^@\s]+@/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /X-Goog-Signature|X-Amz-Signature|sig=|signature=/i,
    /https?:\/\/(?!github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/|github\.com\/yuzastudio6-cyber\/Reedkt\/actions\/)/i,
    /gs:\/\/|storage\.googleapis\.com/i,
    /\bsupabase\s+(start|status|link|db|migration|functions|projects)\b/,
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
const runnerText = readFile(runnerPath);
const packageText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const combinedText = `${docsText}\n${trackersText}`;

for (const file of [...requiredDocs, ...requiredTrackers]) {
  const text = readFile(file);
  if (!text.includes('GD-7') && !text.includes('generated_local_fixture_blocked')) {
    failures.push(`File does not reference GD-7/local execution status: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of requiredTerms) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required GD-7 term: ${term}`);
  }
}

for (const tool of groupA) {
  if (!docsText.includes(tool) || !trackersText.includes(tool)) {
    failures.push(`Missing Group A tool reference: ${tool}`);
  }
  if (!runnerText.includes(tool)) {
    failures.push(`Runner does not include approved Group A tool: ${tool}`);
  }
}

for (const tool of groupB) {
  if (!docsText.includes(tool) || !trackersText.includes(tool)) {
    failures.push(`Missing Group B blocked/skipped tool reference: ${tool}`);
  }
  if (runnerText.includes(tool)) {
    failures.push(`Runner must not include Group B tool: ${tool}`);
  }
}

for (const tool of groupC) {
  if (!docsText.includes(tool) || !trackersText.includes(tool)) {
    failures.push(`Missing Group C blocked tool reference: ${tool}`);
  }
  if (runnerText.includes(tool)) {
    failures.push(`Runner must not include Group C tool: ${tool}`);
  }
}

if (!packageText.includes('ai-tools:creative-graphics:gd7-local-execution:diagnostics')) {
  failures.push('Missing GD-7 diagnostic package script.');
}

if (!foundationRunnerText.includes('ai-tools:creative-graphics:gd7-local-execution:diagnostics')) {
  failures.push('Foundation validation runner does not include GD-7 diagnostic.');
}

for (const forbiddenRunnerPattern of [
  /child_process/,
  /\bfetch\s*\(/,
  /https?:\/\/(?!www\.w3\.org\/2000\/svg)/,
  /\bsupabase\s+(start|status|link|db|migration|functions|projects)\b/,
  /\bgcloud\b/i,
  /\bpsql\b/i,
  /\bdocker\s+(run|build|compose|pull|push|exec)\b/i,
]) {
  if (forbiddenRunnerPattern.test(runnerText)) {
    failures.push(`Runner contains forbidden pattern: ${forbiddenRunnerPattern}`);
  }
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  creativeGraphicsGd7Status: 'generated_local_fixture_blocked',
  groupAToolsChecked: groupA.length,
  groupBToolsBlocked: groupB.length,
  groupCToolsBlocked: groupC.length,
  localFixtureRunnerCreated: existsSync(path.join(repoRoot, runnerPath)),
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; controlled local creative graphics fixture execution only',
  nextRecommendedPrompt: 'Prompt GD-8 - Creative Graphics Package Runtime Review for Group B',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
