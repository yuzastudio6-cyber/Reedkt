import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const requiredDocs = [
  'docs/ai-tools/creative-graphics-resvg-native-runtime-review.md',
  'docs/ai-tools/creative-graphics-resvg-fallback-boundary.md',
  'docs/ai-tools/creative-graphics-gd8a-resvg-probe-evidence.md',
  'docs/prompt-gd-8a-validation-results.md',
  'docs/implementation-prompts/prompt-gd-8a-ai-tools-creative-graphics-package-runtime-fixes.md',
];

const requiredTrackers = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/ai-tools/creative-graphics-package-runtime-enablement.md',
  'docs/ai-tools/creative-graphics-package-runtime-matrix.md',
  'docs/ai-tools/creative-graphics-package-license-security-notes.md',
  'docs/ai-tools/creative-graphics-gd8-runtime-probe-evidence.md',
  'docs/ai-tools/creative-graphics-gd7-local-execution-evidence.md',
  'docs/ai-tools/creative-graphics-future-prompt-sequence.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
  'docs/ai-tools/creative-graphics-all-tools-readiness-matrix.md',
  'docs/ai-tools/creative-graphics-next-fixture-plan.md',
];

const requiredTerms = [
  'GD-8A',
  '@resvg/resvg-js@2.6.2',
  'resvg_js_svg_rasterization',
  'darwin/arm64',
  'Node: `24.14.0`',
  'node_modules/@resvg/resvg-js-darwin-arm64',
  'ERR_DLOPEN_FAILED',
  'darwin_code_signature_native_binding_load_failure',
  'ci_linux_viability_unknown',
  'generated_local_fixture_not_executed',
  'none; AI Tools creative graphics resvg runtime review only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
];

const allowedClassifications = [
  'fixed',
  'local_darwin_native_blocker',
  'ci_linux_viability_unknown',
  'blocked_needs_runtime_review',
  'blocked_needs_package_alternative_review',
];

const nativePackages = [
  '@resvg/resvg-js-android-arm-eabi',
  '@resvg/resvg-js-android-arm64',
  '@resvg/resvg-js-darwin-arm64',
  '@resvg/resvg-js-darwin-x64',
  '@resvg/resvg-js-linux-arm-gnueabihf',
  '@resvg/resvg-js-linux-arm64-gnu',
  '@resvg/resvg-js-linux-arm64-musl',
  '@resvg/resvg-js-linux-x64-gnu',
  '@resvg/resvg-js-linux-x64-musl',
  '@resvg/resvg-js-win32-arm64-msvc',
  '@resvg/resvg-js-win32-ia32-msvc',
  '@resvg/resvg-js-win32-x64-msvc',
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
  return /\b(no|not|none|blocked|must not|do not|without|out of scope|forbid|prohibit|never|future-only|placeholder|placeholders only|missing|absent|unrun|not run|does not|did not|remains blocked|not approved|approval missing|not execute|not enabled|not created|not claimed|not performed|skip|skipped|unavailable|probe only|import-only|local-only|blocked\/skipped|needs_runtime_review|package_runtime_blocked|generated_local_fixture_not_executed|ci_linux_viability_unknown)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /rasterization (executed|ready|passed|validated|completed|enabled|approved)/i,
    /fixture generation:\s*`?(yes|true|executed|ran|created|enabled)`?/i,
    /generated artifacts?:\s*`?(yes|true|created|present|enabled)`?/i,
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
    /public artifact(?:s)?:\s*`?(created|yes|true|present|allowed|enabled)`?/i,
    /signed URL(?:s)?(?: source(?:-| )of(?:-| )truth)?:\s*`?(created|allowed|enabled|yes|true)`?/i,
    /runtime unlock:\s*`?(enabled|yes|true|unlocked)`?/i,
    /production capability enabled:\s*`?(?!none; AI Tools creative graphics resvg runtime review only|none; AI Tools creative graphics package runtime enablement only|none; Track A private preview composition plan only|none; Track A creative graphics handoff review only|none; controlled local creative graphics fixture execution only|none; AI Tools creative graphics execution approval gate packet only|none; AI Tools creative graphics controlled execution plan only|none; AI Tools creative graphics static fixture gate review only|none; AI Tools creative graphics generated\/local fixture candidate pack only|none; AI Tools creative graphics dry-run fixture pack only|none; AI Tools creative graphics manifest contract only|none; AI Tools creative graphics repo audit only)/i,
    /postgres(?:ql)?:\/\/[^@\s]+@/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /X-Goog-Signature|X-Amz-Signature|sig=|signature=/i,
    /https?:\/\/(?!github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/|github\.com\/yuzastudio6-cyber\/Reedkt\/actions\/)/i,
    /gs:\/\/|storage\.googleapis\.com/i,
    /\bsupabase\s+(start|status|link|db|migration|functions|projects)\b/i,
    /\bgcloud\b/i,
    /\bpsql\b/i,
    /\bdocker\s+(run|build|compose|pull|push|exec)\b/i,
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

function parseJson(relativePath) {
  const text = readFile(relativePath);
  try {
    return JSON.parse(text);
  } catch (error) {
    failures.push(`${relativePath} is not valid JSON: ${error.message}`);
    return {};
  }
}

const docsText = requiredDocs.map((file) => readFile(file)).join('\n');
const trackersText = requiredTrackers.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${trackersText}`;
const packageJson = parseJson('package.json');
const packageLock = parseJson('package-lock.json');
const broaderProbeText = readFile('scripts/fixtures/ai-tools/probe-creative-graphics-runtimes.mjs');
const focusedProbeText = readFile('scripts/fixtures/ai-tools/probe-resvg-native-runtime.mjs');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const workflowText = readFile('.github/workflows/foundation-validation.yml');

for (const file of [...requiredDocs, ...requiredTrackers]) {
  const text = readFile(file);
  if (!text.includes('GD-8A') && !text.includes('resvg')) {
    failures.push(`File does not reference GD-8A/resvg status: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of requiredTerms) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required GD-8A term: ${term}`);
  }
}

const classificationPresent = allowedClassifications.some((classification) => combinedText.includes(classification));
if (!classificationPresent) {
  failures.push(`Missing allowed GD-8A classification. Allowed: ${allowedClassifications.join(', ')}`);
}

for (const nativePackage of nativePackages) {
  const relativePackagePath = `node_modules/${nativePackage}`;
  if (!JSON.stringify(packageLock.packages ?? {}).includes(relativePackagePath)) {
    failures.push(`package-lock.json missing resvg optional native package metadata: ${nativePackage}`);
  }
}

const scripts = packageJson.scripts ?? {};
if (!scripts['ai-tools:creative-graphics:resvg-native:probe']) {
  failures.push('Missing focused resvg native probe package script.');
}
if (!scripts['ai-tools:creative-graphics:resvg-runtime:diagnostics']) {
  failures.push('Missing GD-8A resvg runtime diagnostic package script.');
}
if (!foundationRunnerText.includes('ai-tools:creative-graphics:resvg-runtime:diagnostics')) {
  failures.push('Foundation validation runner does not include GD-8A diagnostic.');
}
if (!workflowText.includes('codex/rp-gd-8-ai-tools-creative-graphics-package-runtime-enablement')) {
  failures.push('Foundation Validation workflow does not cover the GD-8 PR base branch.');
}
if (!workflowText.includes('probe-resvg-native-runtime.mjs')) {
  failures.push('Foundation Validation workflow does not run the GD-8A focused resvg import probe.');
}

for (const [label, scriptText] of [
  ['broader runtime probe', broaderProbeText],
  ['focused resvg probe', focusedProbeText],
]) {
  if (!scriptText.includes('@resvg/resvg-js')) {
    failures.push(`${label} does not reference @resvg/resvg-js.`);
  }
  if (!scriptText.includes('darwin_code_signature_native_binding_load_failure')) {
    failures.push(`${label} does not classify Darwin native code-signature failures.`);
  }
  if (/new\s+Resvg|render\s*\(|renderAsync\s*\(|svgToPng|toPng|asPng/i.test(scriptText)) {
    failures.push(`${label} appears to contain rasterization or constructor execution.`);
  }
  for (const forbiddenPattern of [
    /child_process/,
    /\bfetch\s*\(/,
    /https?:\/\//,
    /\bsupabase\s+(start|status|link|db|migration|functions|projects)\b/i,
    /\bgcloud\b/i,
    /\bpsql\b/i,
    /\bdocker\s+(run|build|compose|pull|push|exec)\b/i,
  ]) {
    if (forbiddenPattern.test(scriptText)) {
      failures.push(`${label} contains forbidden pattern: ${forbiddenPattern}`);
    }
  }
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  resvgRuntimeClassification: combinedText.includes('Status: `ci_linux_viability_unknown`')
    ? 'ci_linux_viability_unknown'
    : combinedText.includes('Status: `local_darwin_native_blocker`')
    ? 'local_darwin_native_blocker'
    : combinedText.includes('Status: `fixed`')
      ? 'fixed'
      : combinedText.includes('Status: `blocked_needs_package_alternative_review`')
        ? 'blocked_needs_package_alternative_review'
        : combinedText.includes('Status: `blocked_needs_runtime_review`')
          ? 'blocked_needs_runtime_review'
          : 'ci_linux_viability_unknown',
  packageName: '@resvg/resvg-js',
  packageVersion: '2.6.2',
  focusedProbeCreated: focusedProbeText.includes("await import('@resvg/resvg-js')"),
  broaderProbeSanitized: broaderProbeText.includes('resvgNativeDiagnostics') && broaderProbeText.includes('sanitizeMessage'),
  rasterizationExecuted: 'none',
  generatedLocalFixtureStatus: 'generated_local_fixture_not_executed',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; AI Tools creative graphics resvg runtime review only',
  nextRecommendedPrompt:
    'Prompt GD-7-Retry - Creative Graphics Controlled Local Fixture Execution; use Prompt GD-8B - resvg Alternative Runtime Review only if Darwin-local execution is required',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
