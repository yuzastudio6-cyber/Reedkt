import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const acceptedFixtures = [
  'satori_social_cards',
  'd3_dataviz',
  'echarts_dataviz',
  'vega_lite_dataviz',
  'viz_graphviz_diagrams',
];

const excludedFixtures = [
  'svg_js_vector_graphics',
  'resvg_js_svg_rasterization',
  'anime_js_motion',
  'lottie_web_overlays',
  'remotion_graphics',
  'pixijs_canvas_graphics',
  'three_js_visuals',
];

const expectedArtifacts = new Map([
  [
    'satori_social_cards',
    {
      relativePath:
        '.local-artifacts/ai-tools/gd-7-retry/gd7-retry-2026-06-09T15-28-41-955Z/satori_social_cards.svg',
      sha256: 'a141b7d996c475d97c8dd65ff5f79b875b755159e0bc437b06a1e93fc4afd5f6',
    },
  ],
  [
    'd3_dataviz',
    {
      relativePath:
        '.local-artifacts/ai-tools/gd-7-retry/gd7-retry-2026-06-09T15-28-41-955Z/d3_dataviz.svg',
      sha256: '5e3013b1a32164b1e0d211a94432efb49ccf8c769838e20ea5ebb3e4e8c63ace',
    },
  ],
  [
    'echarts_dataviz',
    {
      relativePath:
        '.local-artifacts/ai-tools/gd-7-retry/gd7-retry-2026-06-09T15-28-41-955Z/echarts_dataviz.svg',
      sha256: 'ee9781e8d1cd2c269b1ca67df505e691b9214cbfdefe43804e9bfbb56a6485a4',
    },
  ],
  [
    'vega_lite_dataviz',
    {
      relativePath:
        '.local-artifacts/ai-tools/gd-7-retry/gd7-retry-2026-06-09T15-28-41-955Z/vega_lite_dataviz.svg',
      sha256: 'c9c35623828fc21b882a10bb67dc368819c205550044e7728c453cb3108d5672',
    },
  ],
  [
    'viz_graphviz_diagrams',
    {
      relativePath:
        '.local-artifacts/ai-tools/gd-7-retry/gd7-retry-2026-06-09T15-28-41-955Z/viz_graphviz_diagrams.svg',
      sha256: 'bc57f8104346cf724893efa195e6c235b477233b688434967621e6357600ac45',
    },
  ],
]);

const requiredDocs = [
  'docs/track-a/creative-graphics-private-preview-source-availability.md',
  'docs/track-a/creative-graphics-private-preview-execution-evidence.md',
  'docs/track-a/creative-graphics-private-preview-qa-evidence.md',
  'docs/track-a/creative-graphics-private-preview-cleanup-evidence.md',
  'docs/prompt-tracka-gd-handoff-3-validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gd-handoff-3-controlled-private-preview-execution.md',
];

const priorEvidenceDocs = [
  'docs/track-a/creative-graphics-private-preview-source-lockfile.md',
  'docs/ai-tools/creative-graphics-gd7-retry-local-execution-evidence.md',
  'docs/ai-tools/creative-graphics-gd7-retry-local-artifact-manifest-evidence.md',
  'docs/ai-tools/creative-graphics-gd7-retry-qa-evidence.md',
];

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/creative-graphics-private-preview-go-no-go-record.md',
  'docs/track-a/creative-graphics-private-preview-execution-manifest.md',
  'docs/track-a/creative-graphics-private-preview-readiness.md',
  'docs/track-a/creative-graphics-next-handoff-prompt.md',
  'docs/ai-tools/creative-graphics-readiness-scorecard.md',
  'docs/ai-tools/creative-graphics-next-fixture-plan.md',
  'docs/ai-tools/creative-graphics-future-prompt-sequence.md',
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
  return /\b(no|not|none|blocked|missing|absent|must not|do not|without|out of scope|future|future-only|placeholder|not approved|not executed|unexecuted|skipped|excluded|remains blocked|did not|does not|not run|not created|not claimed|not performed|warning|warnings|needs|required|gated|gate|docs\/status only|docs_only|false|blocked_pending_source_artifacts|evidence_only_source_missing)\b/i.test(
    line,
  );
}

function scanUnsafeLines(relativePath, text) {
  const unsafePatterns = [
    /\bprivate preview\b.*\b(generated|created|executed|rendered|exported|approved now|performed|ran|passed)\b/i,
    /\bpreview (media|output|generation)\b.*\b(executed|enabled|created|ran|approved|generated|passed)\b/i,
    /\brender\/export\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
    /\bfinal render\b.*\b(executed|enabled|created|ran|passed|ready|approved)\b/i,
    /\bupload(?:ed|s)?\b.*\b(executed|enabled|created|performed|yes|true)\b/i,
    /\bstorage transfer\b.*\b(executed|enabled|created|performed|yes|true)\b/i,
    /\bpublic artifacts?\b.*\b(created|enabled|approved|yes|true)\b/i,
    /\bsigned URL(?:s)?\b.*\b(created|enabled|approved|source of truth|yes|true)\b/i,
    /\bAI tool execution\b.*\b(enabled|yes|true|executed|ran)\b/i,
    /\btool execution\b.*\b(enabled|yes|true|executed|ran)\b/i,
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
    /\bproduction\/beta unlock\b.*\b(enabled|yes|true|approved|unlocked)\b/i,
    /\bdependency mutation\b.*\b(enabled|yes|true|performed)\b/i,
    /\braw prompt execution\b.*\b(enabled|yes|true|performed)\b/i,
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
const evidenceText = priorEvidenceDocs.map((file) => readFile(file)).join('\n');
const trackersText = trackerDocs.map((file) => readFile(file)).join('\n');
const combinedText = `${docsText}\n${evidenceText}\n${trackersText}`;
const packageJsonText = readFile('package.json');
const foundationRunnerText = readFile('scripts/validation/run-foundation-validation.mjs');
const workflowText = readFile('.github/workflows/foundation-validation.yml');

for (const file of [...requiredDocs, ...trackerDocs]) {
  const text = readFile(file);
  if (!text.includes('TRACKA-GD-HANDOFF-3') && !text.includes('blocked_pending_source_artifacts')) {
    failures.push(`File does not reference TRACKA-GD-HANDOFF-3 or blocked source status: ${file}`);
  }
  scanUnsafeLines(file, text);
}

for (const term of [
  'blocked_pending_source_artifacts',
  'evidence_only_source_missing',
  'not_checked_source_missing',
  'none; Track A controlled private preview execution only',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
  'TRACKA-GD-HANDOFF-3A - Source Artifact Preservation Fix',
]) {
  if (!combinedText.includes(term)) {
    failures.push(`Missing required Handoff-3 term: ${term}`);
  }
}

for (const fixture of acceptedFixtures) {
  const artifact = expectedArtifacts.get(fixture);
  if (!docsText.includes(fixture) || !trackersText.includes(fixture)) {
    failures.push(`Missing accepted fixture reference: ${fixture}`);
  }
  if (!combinedText.includes(artifact.relativePath) || !combinedText.includes(artifact.sha256)) {
    failures.push(`Missing source path/checksum evidence for fixture: ${fixture}`);
  }
}

for (const fixture of excludedFixtures) {
  if (!combinedText.includes(fixture)) {
    failures.push(`Missing excluded fixture/tool reference: ${fixture}`);
  }
}

const missingArtifacts = [...expectedArtifacts.entries()]
  .filter(([, artifact]) => !existsSync(path.join(repoRoot, artifact.relativePath)))
  .map(([fixture, artifact]) => ({ fixture, relativePath: artifact.relativePath }));

const allAcceptedArtifactsPresent = missingArtifacts.length === 0;
const passClaimed = combinedText.includes('private_preview_local_passed');
const blockedClaimed = combinedText.includes('blocked_pending_source_artifacts');

if (allAcceptedArtifactsPresent) {
  const composerPath = 'scripts/track-a/compose-creative-graphics-private-preview.mjs';
  if (!existsSync(path.join(repoRoot, composerPath))) {
    failures.push(`All source artifacts are present, but composer script is missing: ${composerPath}`);
  }
  if (!passClaimed && !blockedClaimed) {
    failures.push('All source artifacts are present, but no allowed Handoff-3 result is recorded.');
  }
} else {
  if (!blockedClaimed) {
    failures.push('Missing blocked_pending_source_artifacts result for missing source artifacts.');
  }
  if (existsSync(path.join(repoRoot, 'scripts/track-a/compose-creative-graphics-private-preview.mjs'))) {
    failures.push('Preview composer script exists despite missing accepted source artifacts.');
  }
  if (passClaimed) {
    failures.push('private_preview_local_passed is claimed while source artifacts are missing.');
  }
}

if (packageJsonText.includes('tracka:creative-graphics:private-preview-execution:diagnostics') === false) {
  failures.push('Missing package script for Track A private preview execution diagnostics.');
}

if (foundationRunnerText.includes('tracka:creative-graphics:private-preview-execution:diagnostics') === false) {
  failures.push('Foundation validation runner does not include Track A private preview execution diagnostics.');
}

if (workflowText.includes('codex/rp-tracka-gd-handoff-2-controlled-private-preview-execution-packet') === false) {
  failures.push('Foundation workflow does not cover the TRACKA-GD-HANDOFF-2 PR base branch.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  privatePreviewExecutionStatus: allAcceptedArtifactsPresent
    ? 'private_preview_local_passed_or_ready_for_local_pass'
    : 'blocked_pending_source_artifacts',
  acceptedFixturesChecked: acceptedFixtures.length,
  missingAcceptedSourceArtifacts: missingArtifacts.length,
  excludedFixturesChecked: excludedFixtures.length,
  composerCreated: existsSync(path.join(repoRoot, 'scripts/track-a/compose-creative-graphics-private-preview.mjs')),
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; Track A controlled private preview execution only',
  nextRecommendedPrompt: 'TRACKA-GD-HANDOFF-3A - Source Artifact Preservation Fix',
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
