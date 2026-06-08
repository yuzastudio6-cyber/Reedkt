import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const requiredDocs = [
  'docs/ai-tools/creative-graphics-capability-manifest-contract.md',
  'docs/ai-tools/creative-graphics-output-artifact-registry.md',
  'docs/ai-tools/creative-graphics-private-artifact-contract.md',
  'docs/ai-tools/creative-graphics-dry-run-fixture-contract.md',
  'docs/ai-tools/creative-graphics-track-a-handoff-contract.md',
  'docs/ai-tools/creative-graphics-worker-toolcall-boundary.md',
  'docs/ai-tools/creative-graphics-qa-readiness-contract.md',
  'docs/ai-tools/creative-graphics-all-tools-readiness-matrix.md',
  'docs/ai-tools/creative-graphics-next-fixture-plan.md',
  'docs/prompt-gd-1-validation-results.md',
  'docs/implementation-prompts/prompt-gd-1-ai-tools-creative-graphics-manifest-contract.md',
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
  'docs/ai-tools/creative-graphics-existing-implementation-gaps.md',
];

const manifestFiles = [
  'remotion-graphics.manifest.json',
  'd3-dataviz.manifest.json',
  'three-js-visuals.manifest.json',
  'pixijs-canvas-graphics.manifest.json',
  'anime-js-motion.manifest.json',
  'lottie-web-overlays.manifest.json',
  'svg-js-vector-graphics.manifest.json',
  'echarts-dataviz.manifest.json',
  'vega-lite-dataviz.manifest.json',
  'viz-graphviz-diagrams.manifest.json',
  'satori-social-cards.manifest.json',
  'resvg-js-svg-rasterization.manifest.json',
];

const requiredManifestFields = [
  'track',
  'toolId',
  'displayName',
  'ownerWorkstream',
  'ownedCapabilities',
  'allowedInputTypes',
  'blockedInputTypes',
  'outputArtifactTypes',
  'renderReady',
  'supportsTransparencyAlpha',
  'canBeConsumedByTrackAFinalRender',
  'readyForTrackAComposition',
  'privateArtifactPolicy',
  'sourceOfTruthPolicy',
  'blockedUses',
  'packageRuntimeRequirements',
  'workerRuntimeRequirements',
  'providerRequirements',
  'supabaseArtifactRequirements',
  'gcsPrivatePathRequirements',
  'qaRequirements',
  'dryRunFixtureRequired',
  'generatedLocalFixtureRequired',
  'stagingFixtureRequired',
  'runtimeUnlockStage',
  'readinessStatus',
  'supabaseUpdateClassification',
  'nextPrompt',
];

const requiredBlockedUses = [
  'public_artifact',
  'final_delivery_without_track_a_validation',
  'raw_prompt_worker_execution',
  'signed_url_as_source_of_truth',
  'provider_fallback_without_approval',
  'production_beta_unlock',
];

const requiredStatusTerms = [
  'repo_audit_passed / manifest_draft / dry_run_not_started',
  'none; AI Tools creative graphics manifest contract only',
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
  return /\b(no|not|blocked|must not|do not|without|none|out of scope|forbid|prohibit|never)\b/i.test(line);
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /tool execution:\s*`?(enabled|yes|true|executed)`?/i,
    /worker execution:\s*`?(enabled|yes|true|executed)`?/i,
    /(provider|model) calls?:\s*`?(enabled|yes|true|executed)`?/i,
    /render\/export:\s*`?(enabled|yes|true|executed)`?/i,
    /media processing:\s*`?(enabled|yes|true|executed)`?/i,
    /browser capture:\s*`?(enabled|yes|true|executed)`?/i,
    /Docker\/Cloud Run.*:\s*`?(enabled|yes|true|executed)`?/i,
    /Google Cloud.*:\s*`?(enabled|yes|true|used|fetched)`?/i,
    /Secret Manager.*:\s*`?(enabled|yes|true|used|fetched)`?/i,
    /Supabase environment touched:\s*`?(local|staging|remote|production|yes|true)`?/i,
    /SQL executed:\s*`?(local|staging|remote|production|yes|true)`?/i,
    /Migration deployed:\s*`?(yes|true|staging|production)`?/i,
    /runtime unlock status:\s*`?(dry_run_passed|generated_local_fixture_passed|staging_fixture_passed|controlled_private_sample_passed|internal_beta_candidate|external_beta_candidate|production_candidate)`?/i,
    /production capability enabled:\s*`?(?!none; AI Tools creative graphics manifest contract only|none; AI Tools creative graphics repo audit only)/i,
    /postgres(?:ql)?:\/\/[^@\s]+@/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /signed URL source-of-truth:\s*`?(allowed|enabled|yes|true)`?/i,
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
  if (!text.includes('GD-1') && !text.includes('manifest')) {
    failures.push(`File does not reference GD-1 or manifest work: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const file of manifestFiles) {
  const relativePath = path.join('docs/ai-tools/manifests', file);
  const text = readFile(relativePath);
  scanUnsafeLines(relativePath, text);

  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch (error) {
    failures.push(`Manifest JSON parse failed for ${relativePath}: ${error.message}`);
    continue;
  }

  for (const field of requiredManifestFields) {
    if (!(field in manifest)) {
      failures.push(`Manifest missing ${field}: ${relativePath}`);
    }
  }

  if (manifest.track !== 'ai_tools') {
    failures.push(`Manifest track must be ai_tools: ${relativePath}`);
  }
  if (manifest.ownerWorkstream !== 'AI_TOOLS_CREATIVE_GRAPHICS') {
    failures.push(`Manifest ownerWorkstream mismatch: ${relativePath}`);
  }
  if (manifest.runtimeUnlockStage !== 'repo_audit_passed') {
    failures.push(`Manifest runtimeUnlockStage must be repo_audit_passed: ${relativePath}`);
  }
  if (manifest.readinessStatus !== 'manifest_draft') {
    failures.push(`Manifest readinessStatus must be manifest_draft: ${relativePath}`);
  }
  if (manifest.readyForTrackAComposition !== false) {
    failures.push(`Manifest must not be ready for Track A composition yet: ${relativePath}`);
  }
  if (!Array.isArray(manifest.blockedUses)) {
    failures.push(`Manifest blockedUses must be an array: ${relativePath}`);
  } else {
    for (const blockedUse of requiredBlockedUses) {
      if (!manifest.blockedUses.includes(blockedUse)) {
        failures.push(`Manifest missing blocked use ${blockedUse}: ${relativePath}`);
      }
    }
  }
  if (manifest.supabaseUpdateClassification?.updateRequired !== 'docs/status only') {
    failures.push(`Manifest Supabase updateRequired mismatch: ${relativePath}`);
  }
  if (manifest.supabaseUpdateClassification?.environmentTouched !== 'none') {
    failures.push(`Manifest Supabase environment must be none: ${relativePath}`);
  }
}

const manifestsDir = path.join(repoRoot, 'docs/ai-tools/manifests');
if (existsSync(manifestsDir)) {
  const unexpected = readdirSync(manifestsDir).filter((file) => file.endsWith('.json') && !file.startsWith('._') && !manifestFiles.includes(file));
  for (const file of unexpected) {
    failures.push(`Unexpected manifest file: ${file}`);
  }
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  creativeGraphicsManifestStatus: 'repo_audit_passed / manifest_draft / dry_run_not_started',
  manifestsChecked: manifestFiles.length,
  requiredDocsChecked: requiredDocs.length,
  requiredTrackersChecked: requiredTrackers.length,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; AI Tools creative graphics manifest contract only',
  nextRecommendedPrompt: 'Prompt GD-2 - Creative Graphics All-Tools Dry-Run Fixture Pack',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
