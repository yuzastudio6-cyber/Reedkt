import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const requiredDocs = [
  'docs/ai-tools/creative-graphics-dry-run-fixture-pack.md',
  'docs/ai-tools/creative-graphics-dry-run-input-manifest-examples.md',
  'docs/ai-tools/creative-graphics-dry-run-output-manifest-examples.md',
  'docs/ai-tools/creative-graphics-dry-run-qa-checklist.md',
  'docs/ai-tools/creative-graphics-dry-run-track-a-handoff-examples.md',
  'docs/ai-tools/creative-graphics-dry-run-worker-envelope-examples.md',
  'docs/ai-tools/creative-graphics-dry-run-readiness-matrix.md',
  'docs/prompt-gd-2-validation-results.md',
  'docs/implementation-prompts/prompt-gd-2-ai-tools-creative-graphics-dry-run-fixture-pack.md',
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
];

const fixtureFiles = [
  ['remotion-graphics.dry-run.fixture.json', 'gd2_remotion_graphics_dry_run', 'remotion_graphics'],
  ['d3-dataviz.dry-run.fixture.json', 'gd2_d3_dataviz_dry_run', 'd3_dataviz'],
  ['three-js-visuals.dry-run.fixture.json', 'gd2_three_js_visuals_dry_run', 'three_js_visuals'],
  ['pixijs-canvas-graphics.dry-run.fixture.json', 'gd2_pixijs_canvas_graphics_dry_run', 'pixijs_canvas_graphics'],
  ['anime-js-motion.dry-run.fixture.json', 'gd2_anime_js_motion_dry_run', 'anime_js_motion'],
  ['lottie-web-overlays.dry-run.fixture.json', 'gd2_lottie_web_overlays_dry_run', 'lottie_web_overlays'],
  ['svg-js-vector-graphics.dry-run.fixture.json', 'gd2_svg_js_vector_graphics_dry_run', 'svg_js_vector_graphics'],
  ['echarts-dataviz.dry-run.fixture.json', 'gd2_echarts_dataviz_dry_run', 'echarts_dataviz'],
  ['vega-lite-dataviz.dry-run.fixture.json', 'gd2_vega_lite_dataviz_dry_run', 'vega_lite_dataviz'],
  ['viz-graphviz-diagrams.dry-run.fixture.json', 'gd2_viz_graphviz_diagrams_dry_run', 'viz_graphviz_diagrams'],
  ['satori-social-cards.dry-run.fixture.json', 'gd2_satori_social_cards_dry_run', 'satori_social_cards'],
  ['resvg-js-svg-rasterization.dry-run.fixture.json', 'gd2_resvg_js_svg_rasterization_dry_run', 'resvg_js_svg_rasterization'],
];

const requiredFixtureFields = [
  'fixtureId',
  'toolId',
  'ownerWorkstream',
  'runtimeUnlockStage',
  'dryRunPurpose',
  'syntheticInputTypes',
  'blockedInputTypes',
  'requiredContext',
  'expectedOutputArtifacts',
  'privateArtifactManifestPlaceholder',
  'gcsPrivatePathPlaceholder',
  'supabaseArtifactRecordPlaceholder',
  'checksumPlaceholder',
  'trackAHandoffRequired',
  'qaChecks',
  'blockedUses',
  'passCriteria',
  'failCriteria',
  'nextUnlockGate',
  'supabaseUpdateClassification',
];

const requiredContextFields = [
  'approvedPlanSnapshotPlaceholder',
  'timingContextPlaceholder',
  'aspectRatio',
  'dimensions',
  'fps',
  'durationFrames',
  'styleManifestPlaceholder',
];

const requiredBlockedUses = [
  'raw_prompt_worker_execution',
  'signed_url_as_source_of_truth',
  'public_artifact',
  'final_delivery_without_track_a_validation',
  'provider_fallback_without_approval',
  'production_beta_unlock',
];

const requiredStatusTerms = [
  'repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / dry_run_not_executed',
  'none; AI Tools creative graphics dry-run fixture pack only',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
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
  return /\b(no|not|blocked|must not|do not|without|none|out of scope|forbid|prohibit|never|hand-off|handoff-only|explicitly not owned)\b/i.test(line);
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /tool execution:\s*`?(enabled|yes|true|executed|ran)`?/i,
    /worker execution:\s*`?(enabled|yes|true|executed|ran)`?/i,
    /(provider|model) calls?:\s*`?(enabled|yes|true|executed|ran)`?/i,
    /render\/export:\s*`?(enabled|yes|true|executed|ran)`?/i,
    /media processing:\s*`?(enabled|yes|true|executed|ran)`?/i,
    /browser capture:\s*`?(enabled|yes|true|executed|ran)`?/i,
    /Docker\/Cloud Run.*:\s*`?(enabled|yes|true|executed|ran)`?/i,
    /Google Cloud.*:\s*`?(enabled|yes|true|used|fetched|called)`?/i,
    /Secret Manager.*:\s*`?(enabled|yes|true|used|fetched|called)`?/i,
    /Supabase environment touched:\s*`?(local|staging|remote|production|yes|true)`?/i,
    /SQL executed:\s*`?(local|staging|remote|production|yes|true)`?/i,
    /Migration deployed:\s*`?(yes|true|staging|production)`?/i,
    /runtime unlock status:\s*`?(dry_run_passed|generated_local_fixture_passed|staging_fixture_passed|controlled_private_sample_passed|internal_beta_candidate|external_beta_candidate|production_candidate)`?/i,
    /production capability enabled:\s*`?(?!none; controlled local creative graphics fixture execution only|none; AI Tools creative graphics execution approval gate packet only|none; AI Tools creative graphics controlled execution plan only|none; AI Tools creative graphics static fixture gate review only|none; AI Tools creative graphics generated\/local fixture candidate pack only|none; AI Tools creative graphics dry-run fixture pack only|none; AI Tools creative graphics manifest contract only|none; AI Tools creative graphics repo audit only)/i,
    /postgres(?:ql)?:\/\/[^@\s]+@/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /X-Goog-Signature|X-Amz-Signature|sig=|signature=/i,
    /gs:\/\/|storage\.googleapis\.com/i,
    /signed URL source-of-truth:\s*`?(allowed|enabled|yes|true)`?/i,
    /map\/geospatial ownership:\s*`?(claimed|yes|true)`?/i,
    /sound\/music ownership:\s*`?(claimed|yes|true)`?/i,
    /Track A final render\/export ownership:\s*`?(claimed|yes|true)`?/i,
    /production\/beta unlock:\s*`?(enabled|yes|true|unlocked)`?/i,
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

for (const term of requiredStatusTerms) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing status term: ${term}`);
  }
}

for (const file of [...requiredDocs, ...requiredTrackers]) {
  const text = readFile(file);
  const lowerText = text.toLowerCase();
  if (!text.includes('GD-2') && !lowerText.includes('dry-run')) {
    failures.push(`File does not reference GD-2 or dry-run fixture work: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const [file, expectedFixtureId, expectedToolId] of fixtureFiles) {
  const relativePath = path.join('docs/ai-tools/dry-run-fixtures', file);
  const text = readFile(relativePath);
  scanUnsafeLines(relativePath, text);

  let fixture;
  try {
    fixture = JSON.parse(text);
  } catch (error) {
    failures.push(`Fixture JSON parse failed for ${relativePath}: ${error.message}`);
    continue;
  }

  for (const field of requiredFixtureFields) {
    if (!(field in fixture)) {
      failures.push(`Fixture missing ${field}: ${relativePath}`);
    }
  }

  if (fixture.fixtureId !== expectedFixtureId) {
    failures.push(`Fixture fixtureId mismatch for ${relativePath}`);
  }
  if (fixture.toolId !== expectedToolId) {
    failures.push(`Fixture toolId mismatch for ${relativePath}`);
  }
  if (fixture.ownerWorkstream !== 'AI_TOOLS_CREATIVE_GRAPHICS') {
    failures.push(`Fixture ownerWorkstream mismatch for ${relativePath}`);
  }
  if (fixture.runtimeUnlockStage !== 'repo_audit_passed') {
    failures.push(`Fixture runtimeUnlockStage must be repo_audit_passed for ${relativePath}`);
  }

  for (const field of requiredContextFields) {
    if (!(field in (fixture.requiredContext ?? {}))) {
      failures.push(`Fixture requiredContext missing ${field}: ${relativePath}`);
    }
  }

  if (fixture.privateArtifactManifestPlaceholder !== '<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>') {
    failures.push(`Fixture private artifact placeholder mismatch: ${relativePath}`);
  }
  if (fixture.gcsPrivatePathPlaceholder !== '<PRIVATE_GCS_PATH_PLACEHOLDER>') {
    failures.push(`Fixture GCS private path placeholder mismatch: ${relativePath}`);
  }
  if (fixture.supabaseArtifactRecordPlaceholder !== '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>') {
    failures.push(`Fixture Supabase artifact record placeholder mismatch: ${relativePath}`);
  }
  if (fixture.checksumPlaceholder !== '<CHECKSUM_PLACEHOLDER>') {
    failures.push(`Fixture checksum placeholder mismatch: ${relativePath}`);
  }

  if (!Array.isArray(fixture.blockedUses)) {
    failures.push(`Fixture blockedUses must be an array: ${relativePath}`);
  } else {
    for (const blockedUse of requiredBlockedUses) {
      if (!fixture.blockedUses.includes(blockedUse)) {
        failures.push(`Fixture missing blocked use ${blockedUse}: ${relativePath}`);
      }
    }
  }

  if (fixture.supabaseUpdateClassification?.updateRequired !== 'docs/status only') {
    failures.push(`Fixture Supabase updateRequired mismatch: ${relativePath}`);
  }
  if (fixture.supabaseUpdateClassification?.updateStatus !== 'docs_only') {
    failures.push(`Fixture Supabase updateStatus mismatch: ${relativePath}`);
  }
  if (fixture.supabaseUpdateClassification?.environmentTouched !== 'none') {
    failures.push(`Fixture Supabase environment must be none: ${relativePath}`);
  }
  if (fixture.supabaseUpdateClassification?.sqlExecuted !== 'none') {
    failures.push(`Fixture SQL executed must be none: ${relativePath}`);
  }
  if (fixture.supabaseUpdateClassification?.migrationDeployed !== 'no') {
    failures.push(`Fixture migration deployed must be no: ${relativePath}`);
  }
}

const fixturesDir = path.join(repoRoot, 'docs/ai-tools/dry-run-fixtures');
if (!existsSync(fixturesDir)) {
  failures.push('Missing fixture directory: docs/ai-tools/dry-run-fixtures');
} else {
  const expectedFiles = new Set(fixtureFiles.map(([file]) => file));
  const unexpected = readdirSync(fixturesDir).filter((file) => file.endsWith('.json') && !file.startsWith('._') && !expectedFiles.has(file));
  for (const file of unexpected) {
    failures.push(`Unexpected fixture JSON file: ${file}`);
  }
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  creativeGraphicsDryRunFixtureStatus: 'repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / dry_run_not_executed',
  fixturesChecked: fixtureFiles.length,
  requiredDocsChecked: requiredDocs.length,
  requiredTrackersChecked: requiredTrackers.length,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; AI Tools creative graphics dry-run fixture pack only',
  nextRecommendedPrompt: 'Prompt GD-3 - Creative Graphics Generated/Local Fixture Candidate Pack',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
