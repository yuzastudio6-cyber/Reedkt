import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const requiredDocs = [
  'docs/ai-tools/creative-graphics-generated-local-fixture-candidate-pack.md',
  'docs/ai-tools/creative-graphics-local-artifact-manifest-candidates.md',
  'docs/ai-tools/creative-graphics-generated-local-qa-evidence-templates.md',
  'docs/ai-tools/creative-graphics-generated-local-track-a-handoff-candidates.md',
  'docs/ai-tools/creative-graphics-generated-local-worker-envelope-candidates.md',
  'docs/ai-tools/creative-graphics-generated-local-readiness-matrix.md',
  'docs/prompt-gd-3-validation-results.md',
  'docs/implementation-prompts/prompt-gd-3-ai-tools-creative-graphics-generated-local-fixture-candidate-pack.md',
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
];

const candidateFiles = [
  ['remotion-graphics.generated-local.candidate.json', 'gd3_remotion_graphics_generated_local_candidate', 'gd2_remotion_graphics_dry_run', 'remotion_graphics'],
  ['d3-dataviz.generated-local.candidate.json', 'gd3_d3_dataviz_generated_local_candidate', 'gd2_d3_dataviz_dry_run', 'd3_dataviz'],
  ['three-js-visuals.generated-local.candidate.json', 'gd3_three_js_visuals_generated_local_candidate', 'gd2_three_js_visuals_dry_run', 'three_js_visuals'],
  ['pixijs-canvas-graphics.generated-local.candidate.json', 'gd3_pixijs_canvas_graphics_generated_local_candidate', 'gd2_pixijs_canvas_graphics_dry_run', 'pixijs_canvas_graphics'],
  ['anime-js-motion.generated-local.candidate.json', 'gd3_anime_js_motion_generated_local_candidate', 'gd2_anime_js_motion_dry_run', 'anime_js_motion'],
  ['lottie-web-overlays.generated-local.candidate.json', 'gd3_lottie_web_overlays_generated_local_candidate', 'gd2_lottie_web_overlays_dry_run', 'lottie_web_overlays'],
  ['svg-js-vector-graphics.generated-local.candidate.json', 'gd3_svg_js_vector_graphics_generated_local_candidate', 'gd2_svg_js_vector_graphics_dry_run', 'svg_js_vector_graphics'],
  ['echarts-dataviz.generated-local.candidate.json', 'gd3_echarts_dataviz_generated_local_candidate', 'gd2_echarts_dataviz_dry_run', 'echarts_dataviz'],
  ['vega-lite-dataviz.generated-local.candidate.json', 'gd3_vega_lite_dataviz_generated_local_candidate', 'gd2_vega_lite_dataviz_dry_run', 'vega_lite_dataviz'],
  ['viz-graphviz-diagrams.generated-local.candidate.json', 'gd3_viz_graphviz_diagrams_generated_local_candidate', 'gd2_viz_graphviz_diagrams_dry_run', 'viz_graphviz_diagrams'],
  ['satori-social-cards.generated-local.candidate.json', 'gd3_satori_social_cards_generated_local_candidate', 'gd2_satori_social_cards_dry_run', 'satori_social_cards'],
  ['resvg-js-svg-rasterization.generated-local.candidate.json', 'gd3_resvg_js_svg_rasterization_generated_local_candidate', 'gd2_resvg_js_svg_rasterization_dry_run', 'resvg_js_svg_rasterization'],
];

const requiredCandidateFields = [
  'candidateId',
  'sourceDryRunFixtureId',
  'toolId',
  'ownerWorkstream',
  'currentUnlockStage',
  'targetUnlockStage',
  'syntheticInputManifestRef',
  'expectedGeneratedArtifactTypes',
  'expectedLocalArtifactPathPlaceholder',
  'expectedPrivateGcsPathPlaceholder',
  'expectedSupabaseArtifactRecordPlaceholder',
  'expectedChecksumPlaceholder',
  'expectedTrackAHandoffRef',
  'qaEvidenceTemplateRef',
  'approvedPlanSnapshotPlaceholder',
  'blockedUses',
  'requiredFutureExecutionGate',
  'passCriteria',
  'failCriteria',
  'supabaseUpdateClassification',
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
  'repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / generated_local_fixture_not_executed',
  'none; AI Tools creative graphics generated/local fixture candidate pack only',
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
  return /\b(no|not|blocked|must not|do not|without|none|out of scope|forbid|prohibit|never|hand-off|handoff-only|explicitly not owned|placeholder|placeholders only)\b/i.test(line);
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
    /runtime unlock status:\s*`?(generated_local_fixture_passed|staging_fixture_passed|controlled_private_sample_passed|internal_beta_candidate|external_beta_candidate|production_candidate)`?/i,
    /production capability enabled:\s*`?(?!none; AI Tools creative graphics package runtime enablement only|none; controlled local creative graphics fixture execution only|none; AI Tools creative graphics execution approval gate packet only|none; AI Tools creative graphics controlled execution plan only|none; AI Tools creative graphics static fixture gate review only|none; AI Tools creative graphics generated\/local fixture candidate pack only|none; AI Tools creative graphics dry-run fixture pack only|none; AI Tools creative graphics manifest contract only|none; AI Tools creative graphics repo audit only)/i,
    /postgres(?:ql)?:\/\/[^@\s]+@/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /X-Goog-Signature|X-Amz-Signature|sig=|signature=/i,
    /https?:\/\/(?!github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/)/i,
    /(?:^|\s)(?:\/Users|\/Volumes|\/tmp|\.\/|\/var|\/private)\//i,
    /gs:\/\/|storage\.googleapis\.com/i,
    /signed URL source-of-truth:\s*`?(allowed|enabled|yes|true)`?/i,
    /map\/geospatial ownership:\s*`?(claimed|yes|true)`?/i,
    /sound\/music ownership:\s*`?(claimed|yes|true)`?/i,
    /Track A final render\/export ownership:\s*`?(claimed|yes|true)`?/i,
    /actual generated artifacts?:\s*`?(created|yes|true|present)`?/i,
    /storage transfer:\s*`?(enabled|yes|true|executed|ran)`?/i,
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
  if (!text.includes('GD-3') && !lowerText.includes('generated/local')) {
    failures.push(`File does not reference GD-3 or generated/local candidate work: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const [file, expectedCandidateId, expectedDryRunFixtureId, expectedToolId] of candidateFiles) {
  const relativePath = path.join('docs/ai-tools/generated-local-fixture-candidates', file);
  const text = readFile(relativePath);
  scanUnsafeLines(relativePath, text);

  let candidate;
  try {
    candidate = JSON.parse(text);
  } catch (error) {
    failures.push(`Candidate JSON parse failed for ${relativePath}: ${error.message}`);
    continue;
  }

  for (const field of requiredCandidateFields) {
    if (!(field in candidate)) {
      failures.push(`Candidate missing ${field}: ${relativePath}`);
    }
  }

  if (candidate.candidateId !== expectedCandidateId) {
    failures.push(`Candidate candidateId mismatch for ${relativePath}`);
  }
  if (candidate.sourceDryRunFixtureId !== expectedDryRunFixtureId) {
    failures.push(`Candidate sourceDryRunFixtureId mismatch for ${relativePath}`);
  }
  if (candidate.toolId !== expectedToolId) {
    failures.push(`Candidate toolId mismatch for ${relativePath}`);
  }
  if (candidate.ownerWorkstream !== 'AI_TOOLS_CREATIVE_GRAPHICS') {
    failures.push(`Candidate ownerWorkstream mismatch for ${relativePath}`);
  }
  if (candidate.currentUnlockStage !== 'dry_run_fixture_spec_created') {
    failures.push(`Candidate currentUnlockStage mismatch for ${relativePath}`);
  }
  if (candidate.targetUnlockStage !== 'generated_local_fixture_candidate_prepared') {
    failures.push(`Candidate targetUnlockStage mismatch for ${relativePath}`);
  }
  if (candidate.expectedLocalArtifactPathPlaceholder !== '<LOCAL_ARTIFACT_PATH_PLACEHOLDER>') {
    failures.push(`Candidate local artifact placeholder mismatch: ${relativePath}`);
  }
  if (candidate.expectedPrivateGcsPathPlaceholder !== '<PRIVATE_GCS_PATH_PLACEHOLDER>') {
    failures.push(`Candidate private GCS placeholder mismatch: ${relativePath}`);
  }
  if (candidate.expectedSupabaseArtifactRecordPlaceholder !== '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>') {
    failures.push(`Candidate Supabase artifact record placeholder mismatch: ${relativePath}`);
  }
  if (candidate.expectedChecksumPlaceholder !== '<CHECKSUM_PLACEHOLDER>') {
    failures.push(`Candidate checksum placeholder mismatch: ${relativePath}`);
  }
  if (candidate.expectedTrackAHandoffRef !== '<TRACK_A_HANDOFF_PLACEHOLDER>') {
    failures.push(`Candidate Track A handoff placeholder mismatch: ${relativePath}`);
  }
  if (candidate.qaEvidenceTemplateRef !== '<QA_EVIDENCE_PLACEHOLDER>') {
    failures.push(`Candidate QA evidence placeholder mismatch: ${relativePath}`);
  }
  if (candidate.approvedPlanSnapshotPlaceholder !== '<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>') {
    failures.push(`Candidate approved snapshot placeholder mismatch: ${relativePath}`);
  }

  if (!Array.isArray(candidate.blockedUses)) {
    failures.push(`Candidate blockedUses must be an array: ${relativePath}`);
  } else {
    for (const blockedUse of requiredBlockedUses) {
      if (!candidate.blockedUses.includes(blockedUse)) {
        failures.push(`Candidate missing blocked use ${blockedUse}: ${relativePath}`);
      }
    }
  }

  if (candidate.supabaseUpdateClassification?.updateRequired !== 'docs/status only') {
    failures.push(`Candidate Supabase updateRequired mismatch: ${relativePath}`);
  }
  if (candidate.supabaseUpdateClassification?.updateStatus !== 'docs_only') {
    failures.push(`Candidate Supabase updateStatus mismatch: ${relativePath}`);
  }
  if (candidate.supabaseUpdateClassification?.environmentTouched !== 'none') {
    failures.push(`Candidate Supabase environment must be none: ${relativePath}`);
  }
  if (candidate.supabaseUpdateClassification?.sqlExecuted !== 'none') {
    failures.push(`Candidate SQL executed must be none: ${relativePath}`);
  }
  if (candidate.supabaseUpdateClassification?.migrationDeployed !== 'no') {
    failures.push(`Candidate migration deployed must be no: ${relativePath}`);
  }
}

const candidatesDir = path.join(repoRoot, 'docs/ai-tools/generated-local-fixture-candidates');
if (!existsSync(candidatesDir)) {
  failures.push('Missing candidate directory: docs/ai-tools/generated-local-fixture-candidates');
} else {
  const expectedFiles = new Set(candidateFiles.map(([file]) => file));
  const unexpected = readdirSync(candidatesDir).filter((file) => file.endsWith('.json') && !file.startsWith('._') && !expectedFiles.has(file));
  for (const file of unexpected) {
    failures.push(`Unexpected candidate JSON file: ${file}`);
  }
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  creativeGraphicsGeneratedLocalCandidateStatus: 'repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / generated_local_fixture_not_executed',
  candidatesChecked: candidateFiles.length,
  requiredDocsChecked: requiredDocs.length,
  requiredTrackersChecked: requiredTrackers.length,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; AI Tools creative graphics generated/local fixture candidate pack only',
  nextRecommendedPrompt: 'Prompt GD-4 - Creative Graphics Static Validation and Fixture Gate Review',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
