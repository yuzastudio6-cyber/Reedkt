import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const tools = [
  ['remotion-graphics', 'remotion_graphics'],
  ['d3-dataviz', 'd3_dataviz'],
  ['three-js-visuals', 'three_js_visuals'],
  ['pixijs-canvas-graphics', 'pixijs_canvas_graphics'],
  ['anime-js-motion', 'anime_js_motion'],
  ['lottie-web-overlays', 'lottie_web_overlays'],
  ['svg-js-vector-graphics', 'svg_js_vector_graphics'],
  ['echarts-dataviz', 'echarts_dataviz'],
  ['vega-lite-dataviz', 'vega_lite_dataviz'],
  ['viz-graphviz-diagrams', 'viz_graphviz_diagrams'],
  ['satori-social-cards', 'satori_social_cards'],
  ['resvg-js-svg-rasterization', 'resvg_js_svg_rasterization'],
];

const requiredDocs = [
  'docs/ai-tools/creative-graphics-static-fixture-gate-review.md',
  'docs/ai-tools/creative-graphics-per-tool-static-validation-matrix.md',
  'docs/ai-tools/creative-graphics-fixture-consistency-review.md',
  'docs/ai-tools/creative-graphics-track-a-handoff-readiness-review.md',
  'docs/ai-tools/creative-graphics-worker-envelope-readiness-review.md',
  'docs/ai-tools/creative-graphics-qa-evidence-readiness-review.md',
  'docs/ai-tools/creative-graphics-static-gate-blocker-inventory.md',
  'docs/ai-tools/creative-graphics-next-execution-plan-readiness.md',
  'docs/prompt-gd-4-validation-results.md',
  'docs/implementation-prompts/prompt-gd-4-ai-tools-creative-graphics-static-fixture-gate-review.md',
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
  'docs/ai-tools/creative-graphics-dry-run-readiness-matrix.md',
  'docs/ai-tools/creative-graphics-generated-local-readiness-matrix.md',
];

const gateResults = ['static_gate_passed', 'static_gate_passed_with_warnings', 'static_gate_blocked'];

const requiredBlockedUses = [
  'raw_prompt_worker_execution',
  'signed_url_as_source_of_truth',
  'public_artifact',
  'final_delivery_without_track_a_validation',
  'provider_fallback_without_approval',
  'production_beta_unlock',
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

function parseJson(relativePath) {
  const text = readFile(relativePath);
  try {
    return JSON.parse(text);
  } catch (error) {
    failures.push(`JSON parse failed for ${relativePath}: ${error.message}`);
    return {};
  }
}

function isSafetyNegated(line) {
  return /\b(no|not|blocked|must not|do not|without|none|out of scope|forbid|prohibit|never|handoff-only|explicitly not owned|placeholder|placeholders only|future-only|missing|absent|unrun|not run|does not|did not|remains blocked)\b/i.test(line);
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
    /production capability enabled:\s*`?(?!none; AI Tools creative graphics resvg runtime review only|none; AI Tools creative graphics package runtime enablement only|none; controlled local creative graphics fixture execution only|none; AI Tools creative graphics execution approval gate packet only|none; AI Tools creative graphics controlled execution plan only|none; AI Tools creative graphics static fixture gate review only|none; AI Tools creative graphics generated\/local fixture candidate pack only|none; AI Tools creative graphics dry-run fixture pack only|none; AI Tools creative graphics manifest contract only|none; AI Tools creative graphics repo audit only)/i,
    /actual generated artifacts?:\s*`?(created|yes|true|present)`?/i,
    /generated\/local fixture execution:\s*`?(enabled|yes|true|executed|ran|passed)`?/i,
    /public artifact(?:s)?:\s*`?(created|yes|true|present|allowed|enabled)`?/i,
    /signed URL source(?:-| )of(?:-| )truth:\s*`?(allowed|enabled|yes|true)`?/i,
    /Track A final render\/export ownership:\s*`?(claimed|yes|true)`?/i,
    /map\/geospatial ownership:\s*`?(claimed|yes|true)`?/i,
    /sound\/music ownership:\s*`?(claimed|yes|true)`?/i,
    /runtime unlock:\s*`?(enabled|yes|true|unlocked)`?/i,
    /internal beta.*:\s*`?(enabled|yes|true|unlocked)`?/i,
    /external beta.*:\s*`?(enabled|yes|true|unlocked)`?/i,
    /production candidate:\s*`?(enabled|yes|true|unlocked)`?/i,
    /postgres(?:ql)?:\/\/[^@\s]+@/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /X-Goog-Signature|X-Amz-Signature|sig=|signature=/i,
    /https?:\/\/(?!github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/|github\.com\/yuzastudio6-cyber\/Reedkt\/actions\/)/i,
    /(?:^|\s)(?:\/Users|\/Volumes|\/tmp|\.\/|\/var|\/private)\//i,
    /gs:\/\/|storage\.googleapis\.com/i,
    /\bsupabase\s+(start|status|link|db|migration|functions|projects)\b/i,
    /\bgcloud\b/i,
    /\bpsql\b/i,
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
  if (!text.includes('GD-4') && !text.includes('static_gate_passed_with_warnings')) {
    failures.push(`File does not reference GD-4/static gate status: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const requiredTerm of [
  'static_gate_passed_with_warnings',
  'repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / generated_local_fixture_not_executed',
  'none; AI Tools creative graphics static fixture gate review only',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
]) {
  if (!combinedText.includes(requiredTerm)) {
    failures.push(`Missing required status term: ${requiredTerm}`);
  }
}

const gateResultMatches = [...combinedText.matchAll(/\bstatic_gate_(?:passed_with_warnings|passed|blocked)\b/g)].map((match) => match[0]);
if (!gateResultMatches.some((result) => gateResults.includes(result))) {
  failures.push('No valid static gate result found.');
}

for (const [, toolId] of tools) {
  if (!combinedText.includes(toolId)) {
    failures.push(`Missing tool reference in GD-4 docs/trackers: ${toolId}`);
  }
  const expectedRowPattern = new RegExp(`\\\`?${toolId}\\\`?.*pass_with_warning`, 's');
  const matrixText = readFile('docs/ai-tools/creative-graphics-per-tool-static-validation-matrix.md');
  if (!expectedRowPattern.test(matrixText)) {
    failures.push(`Missing pass_with_warning matrix row for ${toolId}`);
  }
}

for (const [slug, expectedToolId] of tools) {
  const manifestPath = `docs/ai-tools/manifests/${slug}.manifest.json`;
  const fixturePath = `docs/ai-tools/dry-run-fixtures/${slug}.dry-run.fixture.json`;
  const candidatePath = `docs/ai-tools/generated-local-fixture-candidates/${slug}.generated-local.candidate.json`;

  const manifest = parseJson(manifestPath);
  const fixture = parseJson(fixturePath);
  const candidate = parseJson(candidatePath);

  if (manifest.toolId !== expectedToolId) {
    failures.push(`Manifest toolId mismatch for ${slug}`);
  }
  if (fixture.toolId !== expectedToolId) {
    failures.push(`Dry-run fixture toolId mismatch for ${slug}`);
  }
  if (candidate.toolId !== expectedToolId) {
    failures.push(`Generated/local candidate toolId mismatch for ${slug}`);
  }
  if (candidate.sourceDryRunFixtureId !== fixture.fixtureId) {
    failures.push(`Candidate source fixture mismatch for ${slug}`);
  }
  if (manifest.ownerWorkstream !== 'AI_TOOLS_CREATIVE_GRAPHICS' || fixture.ownerWorkstream !== 'AI_TOOLS_CREATIVE_GRAPHICS' || candidate.ownerWorkstream !== 'AI_TOOLS_CREATIVE_GRAPHICS') {
    failures.push(`Owner workstream mismatch for ${slug}`);
  }
  for (const blockedUse of requiredBlockedUses) {
    if (!manifest.blockedUses?.includes(blockedUse) || !fixture.blockedUses?.includes(blockedUse) || !candidate.blockedUses?.includes(blockedUse)) {
      failures.push(`Missing blocked use ${blockedUse} for ${slug}`);
    }
  }
  if (fixture.gcsPrivatePathPlaceholder !== '<PRIVATE_GCS_PATH_PLACEHOLDER>' || candidate.expectedPrivateGcsPathPlaceholder !== '<PRIVATE_GCS_PATH_PLACEHOLDER>') {
    failures.push(`Private GCS placeholder mismatch for ${slug}`);
  }
  if (fixture.supabaseArtifactRecordPlaceholder !== '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>' || candidate.expectedSupabaseArtifactRecordPlaceholder !== '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>') {
    failures.push(`Supabase artifact placeholder mismatch for ${slug}`);
  }
  if (fixture.checksumPlaceholder !== '<CHECKSUM_PLACEHOLDER>' || candidate.expectedChecksumPlaceholder !== '<CHECKSUM_PLACEHOLDER>') {
    failures.push(`Checksum placeholder mismatch for ${slug}`);
  }
  for (const record of [manifest, fixture, candidate]) {
    if (record.supabaseUpdateClassification?.updateRequired !== 'docs/status only') {
      failures.push(`Supabase updateRequired mismatch for ${slug}`);
    }
    if (record.supabaseUpdateClassification?.updateStatus !== 'docs_only') {
      failures.push(`Supabase updateStatus mismatch for ${slug}`);
    }
    if (record.supabaseUpdateClassification?.environmentTouched !== 'none') {
      failures.push(`Supabase environment mismatch for ${slug}`);
    }
    if (record.supabaseUpdateClassification?.sqlExecuted !== 'none') {
      failures.push(`SQL execution mismatch for ${slug}`);
    }
    if (record.supabaseUpdateClassification?.migrationDeployed !== 'no') {
      failures.push(`Migration deployed mismatch for ${slug}`);
    }
  }
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  creativeGraphicsStaticGateStatus: 'static_gate_passed_with_warnings',
  toolsChecked: tools.length,
  requiredDocsChecked: requiredDocs.length,
  requiredTrackersChecked: requiredTrackers.length,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; AI Tools creative graphics static fixture gate review only',
  nextRecommendedPrompt: 'Prompt GD-5 - Controlled Generated Fixture Execution Plan',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
