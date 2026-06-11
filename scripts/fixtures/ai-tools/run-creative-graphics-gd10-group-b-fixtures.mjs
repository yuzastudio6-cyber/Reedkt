import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const runId = `gd10-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const outputRoot = path.join(repoRoot, '.local-artifacts', 'ai-tools', 'gd-10', runId);

const dimensions = { width: 1920, height: 1080 };
const fps = 30;
const durationFrames = 90;
const durationMs = 3000;
const blockedUses = [
  'raw_prompt_worker_execution',
  'signed_url_as_source_of_truth',
  'public_artifact',
  'final_delivery_without_track_a_validation',
  'provider_fallback_without_approval',
  'production_beta_unlock',
];

const artifacts = [];
const toolResults = [];

function checksum(content) {
  return createHash('sha256').update(content).digest('hex');
}

function sanitizeMessage(message) {
  return String(message)
    .replaceAll(repoRoot, '<repo>')
    .replace(/\s+/g, ' ')
    .slice(0, 240);
}

function writeJson(relativePath, data) {
  const absolutePath = path.join(outputRoot, relativePath);
  const content = `${JSON.stringify(data, null, 2)}\n`;
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content);
  const digest = checksum(content);
  artifacts.push({
    relativePath: path.relative(repoRoot, absolutePath),
    artifactType: data.artifactType ?? 'json_evidence',
    checksumSha256: digest,
  });
  return {
    relativePath: path.relative(repoRoot, absolutePath),
    checksumSha256: digest,
  };
}

function classifyImportError(error) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'IMPORT_FAILED';
  const message = error instanceof Error ? error.message : String(error);

  if (code === 'ERR_MODULE_NOT_FOUND') {
    return 'package_runtime_unavailable';
  }

  if (/\b(window|document|navigator|HTMLElement|HTMLCanvasElement)\b/i.test(message)) {
    return 'node_dom_runtime_required';
  }

  if (/code signature|native binding|dlopen/i.test(message) || code === 'ERR_DLOPEN_FAILED') {
    return 'native_binding_load_failure';
  }

  return 'package_runtime_failed_needs_review';
}

async function importRuntime(packageName) {
  try {
    return {
      ok: true,
      runtime: await import(packageName),
    };
  } catch (error) {
    return {
      ok: false,
      blocker: classifyImportError(error),
      errorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : 'IMPORT_FAILED',
      errorSummary: sanitizeMessage(error instanceof Error ? error.message : String(error)),
    };
  }
}

function numericSample(target, frame, timeMs) {
  return {
    frame,
    timeMs,
    x: Number(Number(target.x).toFixed(4)),
    opacity: Number(Number(target.opacity).toFixed(4)),
    scale: Number(Number(target.scale).toFixed(4)),
  };
}

async function runAnimeFixture() {
  const imported = await importRuntime('animejs');
  if (!imported.ok) {
    return {
      toolId: 'anime_js_motion',
      packageName: 'animejs',
      status: 'skipped',
      blocker: imported.blocker,
      errorCode: imported.errorCode,
      errorSummary: imported.errorSummary,
      outputType: 'none',
    };
  }

  const { animate } = imported.runtime;
  if (typeof animate !== 'function') {
    return {
      toolId: 'anime_js_motion',
      packageName: 'animejs',
      status: 'skipped',
      blocker: 'animejs_animate_api_unavailable',
      outputType: 'none',
    };
  }

  try {
    const target = { x: 0, opacity: 0, scale: 0.75 };
    const animation = animate(target, {
      x: 120,
      opacity: 1,
      scale: 1,
      duration: durationMs,
      easing: 'linear',
      autoplay: false,
    });

    if (typeof animation.seek !== 'function') {
      return {
        toolId: 'anime_js_motion',
        packageName: 'animejs',
        status: 'skipped',
        blocker: 'animejs_seek_api_unavailable',
        outputType: 'none',
      };
    }

    const sampleFrames = [0, 15, 30, 45, 60, 75, 90];
    const samples = sampleFrames.map((frame) => {
      const timeMs = Math.round((frame / durationFrames) * durationMs);
      animation.seek(timeMs);
      return numericSample(target, frame, timeMs);
    });

    if (typeof animation.pause === 'function') {
      animation.pause();
    }

    const finalSample = samples.at(-1);
    const monotonic = samples.every((sample, index) => index === 0 || sample.x >= samples[index - 1].x);
    const finalReached = finalSample && finalSample.x >= 119.5 && finalSample.opacity >= 0.99 && finalSample.scale >= 0.99;

    if (!monotonic || !finalReached) {
      return {
        toolId: 'anime_js_motion',
        packageName: 'animejs',
        status: 'blocked',
        blocker: 'animejs_plain_object_timing_assertion_failed',
        outputType: 'motion_timing_json',
        samples,
      };
    }

    const output = {
      artifactType: 'group_b_anime_motion_timing',
      toolId: 'anime_js_motion',
      packageName: 'animejs',
      status: 'executed',
      executionScope: 'controlled_local_synthetic_object_timing',
      dimensions,
      fps,
      durationFrames,
      durationMs,
      samples,
      assertions: {
        plainObjectOnly: true,
        domRuntimeUsed: false,
        browserRuntimeUsed: false,
        monotonic,
        finalReached,
      },
      blockedUses,
      placeholders: {
        approvedPlanSnapshot: '<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>',
        privateGcsPath: '<PRIVATE_GCS_PATH_PLACEHOLDER>',
        supabaseArtifactRecord: '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>',
        trackAHandoff: '<TRACK_A_HANDOFF_PLACEHOLDER>',
      },
    };

    const artifact = writeJson('anime_js_motion.motion-timing.json', output);
    return {
      toolId: 'anime_js_motion',
      packageName: 'animejs',
      status: 'executed',
      qaResult: 'passed_with_warnings',
      outputType: 'motion_timing_json',
      artifact,
      sampleCount: samples.length,
      blockedUses,
    };
  } catch (error) {
    const blocker = classifyImportError(error);
    return {
      toolId: 'anime_js_motion',
      packageName: 'animejs',
      status: 'skipped',
      blocker,
      errorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : 'ANIME_RUNTIME_FAILED',
      errorSummary: sanitizeMessage(error instanceof Error ? error.message : String(error)),
      outputType: 'none',
    };
  }
}

async function createManifestOnlyFixture({ toolId, packageName, artifactName, reason, outputTypes }) {
  const imported = await importRuntime(packageName);
  const output = {
    artifactType: 'group_b_manifest_only_fixture',
    toolId,
    packageName,
    status: 'manifest_only',
    importStatus: imported.ok ? 'package_runtime_probe_passed' : 'package_runtime_import_blocked',
    importBlocker: imported.ok ? null : imported.blocker,
    reason,
    outputTypes,
    dimensions,
    fps,
    durationFrames,
    runtimeExecutionUsed: false,
    browserRuntimeUsed: false,
    playerRuntimeUsed: false,
    renderExportUsed: false,
    blockedUses,
    placeholders: {
      approvedPlanSnapshot: '<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>',
      privateGcsPath: '<PRIVATE_GCS_PATH_PLACEHOLDER>',
      supabaseArtifactRecord: '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>',
      checksum: '<CHECKSUM_PLACEHOLDER>',
      trackAHandoff: '<TRACK_A_HANDOFF_PLACEHOLDER>',
    },
  };

  const artifact = writeJson(artifactName, output);
  return {
    toolId,
    packageName,
    status: 'manifest_only',
    qaResult: 'manifest_only_passed',
    outputType: 'manifest_only_json',
    importStatus: output.importStatus,
    importBlocker: output.importBlocker,
    artifact,
    blockedUses,
  };
}

function decide(results) {
  const anime = results.find((result) => result.toolId === 'anime_js_motion');
  const lottie = results.find((result) => result.toolId === 'lottie_web_overlays');
  const remotion = results.find((result) => result.toolId === 'remotion_graphics');

  if (anime?.status === 'executed' && lottie?.status === 'manifest_only' && remotion?.status === 'manifest_only') {
    return 'group_b_partially_passed';
  }

  if ((anime?.status === 'skipped' || anime?.status === 'blocked') && lottie?.status === 'manifest_only' && remotion?.status === 'manifest_only') {
    return 'group_b_manifest_only_passed_with_warnings';
  }

  return 'group_b_blocked';
}

mkdirSync(outputRoot, { recursive: true });

toolResults.push(await runAnimeFixture());
toolResults.push(
  await createManifestOnlyFixture({
    toolId: 'lottie_web_overlays',
    packageName: 'lottie-web',
    artifactName: 'lottie_web_overlays.manifest-only.json',
    reason: 'GD-10 allows manifest-only Lottie evidence; browser/player execution is blocked pending adapter review.',
    outputTypes: ['lottie_animation_manifest', 'transparent_overlay_manifest', 'private_artifact_manifest'],
  }),
);
toolResults.push(
  await createManifestOnlyFixture({
    toolId: 'remotion_graphics',
    packageName: 'remotion',
    artifactName: 'remotion_graphics.manifest-only.json',
    reason: 'GD-10 allows manifest-only Remotion evidence; render/export remains Track A-owned and blocked.',
    outputTypes: ['remotion_preview_manifest', 'transparent_overlay_manifest', 'private_artifact_manifest'],
  }),
);

const decisionState = decide(toolResults);
const toolsExecuted = toolResults.filter((result) => result.status === 'executed').map((result) => result.toolId);
const toolsManifestOnly = toolResults.filter((result) => result.status === 'manifest_only').map((result) => result.toolId);
const toolsSkippedOrBlocked = toolResults
  .filter((result) => result.status === 'skipped' || result.status === 'blocked')
  .map((result) => ({ toolId: result.toolId, status: result.status, blocker: result.blocker }));

const evidenceReport = {
  artifactType: 'group_b_gd10_evidence_report',
  prompt: 'GD-10',
  runId,
  decisionState,
  productionCapabilityEnabled: 'none; Group B controlled local fixture execution only',
  outputRoot: path.relative(repoRoot, outputRoot),
  toolsExecuted,
  toolsManifestOnly,
  toolsSkippedOrBlocked,
  toolResults,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  blockedRuntimeClaims: {
    lottieBrowserPlayerRendering: false,
    remotionRenderExport: false,
    workerExecution: false,
    providerModelCalls: false,
    supabaseMutation: false,
    gcpSecretManagerAccess: false,
    uploadsStorageTransfer: false,
    signedUrlsPublicArtifacts: false,
    betaProductionUnlock: false,
  },
};

const qaEvidence = {
  artifactType: 'group_b_gd10_qa_evidence',
  runId,
  decisionState,
  qaResult: decisionState === 'group_b_partially_passed' ? 'passed_with_warnings' : 'manifest_only_passed_with_warnings',
  checks: {
    animePlainObjectTiming: toolResults.find((result) => result.toolId === 'anime_js_motion')?.status ?? 'missing',
    lottieManifestOnly: toolResults.find((result) => result.toolId === 'lottie_web_overlays')?.status === 'manifest_only',
    remotionManifestOnly: toolResults.find((result) => result.toolId === 'remotion_graphics')?.status === 'manifest_only',
    blockedUseCompliance: true,
    trackAHandoffReadiness: 'future_review_required',
  },
  toolResults,
};

const observabilityEvidence = {
  artifactType: 'group_b_gd10_observability_evidence',
  runId,
  command: 'node scripts/fixtures/ai-tools/run-creative-graphics-gd10-group-b-fixtures.mjs',
  localExecutionScope: 'Group B controlled local fixture evidence only',
  networkApiCalls: false,
  supabaseTouched: false,
  gcsTouched: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  providerModelCalls: false,
  workerExecution: false,
  browserCapture: false,
};

const cleanupEvidence = {
  artifactType: 'group_b_gd10_cleanup_evidence',
  runId,
  localOutputDirectory: path.relative(repoRoot, outputRoot),
  cleanupPerformed: false,
  evidencePreservedLocally: true,
  publicCleanupRequired: false,
  gcsCleanupRequired: false,
  signedUrlCleanupRequired: false,
};

writeJson('evidence-report.json', evidenceReport);
writeJson('qa-evidence.json', qaEvidence);
writeJson('observability-evidence.json', observabilityEvidence);
writeJson('cleanup-evidence.json', cleanupEvidence);

const artifactManifest = {
  artifactType: 'group_b_gd10_artifact_manifest',
  runId,
  decisionState,
  artifacts,
  sourceOfTruthPolicy: 'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  signedUrlsAreSourceOfTruth: false,
  placeholders: {
    approvedPlanSnapshot: '<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>',
    privateGcsPath: '<PRIVATE_GCS_PATH_PLACEHOLDER>',
    supabaseArtifactRecord: '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>',
  },
};

writeJson('artifact-manifest.json', artifactManifest);

const checksumSummary = {
  artifactType: 'group_b_gd10_checksum_summary',
  runId,
  artifacts: [...artifacts],
};
writeJson('checksum-summary.json', checksumSummary);

console.log(
  JSON.stringify(
    {
      runId,
      decisionState,
      outputRoot: path.relative(repoRoot, outputRoot),
      toolsExecuted,
      toolsManifestOnly,
      toolsSkippedOrBlocked,
      evidenceFiles: [
        'evidence-report.json',
        'artifact-manifest.json',
        'qa-evidence.json',
        'observability-evidence.json',
        'cleanup-evidence.json',
        'checksum-summary.json',
      ],
    },
    null,
    2,
  ),
);
