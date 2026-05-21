import {
  createRemotionWorkerPayloadFromJson,
  runRemotionWorkerEntrypoint,
  stringifyRemotionWorkerEntrypointResult,
  type RemotionWorkerEntrypointEnv,
  type RemotionWorkerEntrypointResult,
} from './remotion-worker-entrypoint'

interface RuntimeProcessLike {
  env?: Record<string, string | undefined>
  exitCode?: number
}

interface RuntimeConsoleLike {
  log: (message?: unknown) => void
}

interface RuntimeGlobalLike {
  process?: RuntimeProcessLike
  console?: RuntimeConsoleLike
}

type RemotionWorkerCliEnv = RemotionWorkerEntrypointEnv & {
  RENDER_WORKER_PAYLOAD?: string
}

type PayloadParseResult =
  | {
      ok: true
      payload: Record<string, unknown>
    }
  | {
      ok: false
      result: RemotionWorkerEntrypointResult
    }

const MOCK_PREVIEW_RENDER_PAYLOAD: Record<string, unknown> = {
  renderJobId: 'render_job_mock_preview_001',
  jobId: 'job_mock_render_001',
  workspaceId: 'workspace_mock_001',
  projectId: 'project_mock_001',
  approvedPlanSnapshotId: 'snapshot_mock_001',
  editPlanId: 'edit_plan_mock_001',
  creditReservationId: 'credit_reservation_mock_001',
  renderType: 'preview',
  renderQualityLevel: 'draft',
  outputFormat: 'mp4',
  width: 1080,
  height: 1920,
  frameRate: 30,
  durationSeconds: 12,
  timelineSpec: {
    masterTimingPlanId: 'master_timing_mock_001',
    frameLayoutPlanId: 'frame_layout_mock_001',
    durationFrames: 360,
    layers: [
      {
        layerId: 'layer_mock_source_video_001',
        layerType: 'source_video',
        startFrame: 0,
        endFrame: 360,
        zIndex: 0,
      },
    ],
  },
  sourceAssetLocations: [],
  generatedAssetLocations: [],
  outputBucketPurpose: 'previews',
  outputObjectPath: 'workspaces/workspace_mock_001/projects/project_mock_001/previews/render_preview_mock_001.mp4',
  idempotencyKey: 'render-preview-project_mock_001-snapshot_mock_001-v1',
  metadata: {
    mockOnly: true,
    timingValidationStatus: 'passed',
    qaFallbackStatus: 'passed',
  },
}

function getRuntimeGlobal(): RuntimeGlobalLike {
  return globalThis as RuntimeGlobalLike
}

function readRuntimeEnv(): RemotionWorkerCliEnv {
  const env = getRuntimeGlobal().process?.env ?? {}

  return {
    PROJECT_ID: env.PROJECT_ID,
    RUNTIME_REGION: env.RUNTIME_REGION === 'europe-west1' ? 'europe-west1' : 'us-east1',
    SERVER_RUNTIME_MODE: env.SERVER_RUNTIME_MODE === 'real' || env.SERVER_RUNTIME_MODE === 'disabled'
      ? env.SERVER_RUNTIME_MODE
      : env.SERVER_RUNTIME_MODE === 'mock'
        ? 'mock'
        : undefined,
    SUPABASE_URL_SECRET_NAME: env.SUPABASE_URL_SECRET_NAME,
    SUPABASE_SERVICE_ROLE_SECRET_NAME: env.SUPABASE_SERVICE_ROLE_SECRET_NAME,
    GCS_PREVIEWS_BUCKET: env.GCS_PREVIEWS_BUCKET,
    GCS_EXPORTS_BUCKET: env.GCS_EXPORTS_BUCKET,
    GCS_WORKER_TEMP_BUCKET: env.GCS_WORKER_TEMP_BUCKET,
    RENDER_WORKER_PAYLOAD: env.RENDER_WORKER_PAYLOAD,
  }
}

function createCliBlockedResult(errors: string[], warnings: string[] = []): RemotionWorkerEntrypointResult {
  return {
    ok: false,
    status: 'blocked',
    errors,
    warnings,
    sanitizedJson: {
      ok: false,
      status: 'blocked',
      errors,
      warnings,
      metadata: {
        mockOnly: true,
        noRealRender: true,
        noRemotionImport: true,
        noGcsAccess: true,
        noSecretRead: true,
        noProviderCall: true,
      },
    },
  }
}

function parsePayload(env: RemotionWorkerCliEnv): PayloadParseResult {
  if (!env.RENDER_WORKER_PAYLOAD) {
    return {
      ok: true,
      payload: MOCK_PREVIEW_RENDER_PAYLOAD,
    }
  }

  try {
    return {
      ok: true,
      payload: createRemotionWorkerPayloadFromJson(env.RENDER_WORKER_PAYLOAD),
    }
  } catch {
    return {
      ok: false,
      result: createCliBlockedResult(['RENDER_WORKER_PAYLOAD must be valid JSON for a render worker payload.']),
    }
  }
}

function shouldBlockRuntimeMode(env: RemotionWorkerCliEnv): boolean {
  return Boolean(env.SERVER_RUNTIME_MODE && env.SERVER_RUNTIME_MODE !== 'mock')
}

function writeSanitizedJson(result: RemotionWorkerEntrypointResult): void {
  const runtimeConsole = getRuntimeGlobal().console
  const output = stringifyRemotionWorkerEntrypointResult(result)
  if (runtimeConsole) {
    runtimeConsole.log(output)
  }
}

function setExitCode(result: RemotionWorkerEntrypointResult): void {
  const runtimeProcess = getRuntimeGlobal().process
  if (runtimeProcess) {
    runtimeProcess.exitCode = result.ok ? 0 : 1
  }
}

export function runRemotionWorkerCli(env: RemotionWorkerCliEnv = readRuntimeEnv()): RemotionWorkerEntrypointResult {
  if (shouldBlockRuntimeMode(env)) {
    return createCliBlockedResult(
      ['SERVER_RUNTIME_MODE must be mock for RP-RENDER-03A.'],
      ['Real Remotion transport is intentionally not implemented in this mock worker.'],
    )
  }

  const payloadResult = parsePayload(env)
  if (!payloadResult.ok) {
    return payloadResult.result
  }

  return runRemotionWorkerEntrypoint({
    env: {
      PROJECT_ID: env.PROJECT_ID ?? 'reeditpro',
      RUNTIME_REGION: env.RUNTIME_REGION ?? 'us-east1',
      SERVER_RUNTIME_MODE: env.SERVER_RUNTIME_MODE ?? 'mock',
      SUPABASE_URL_SECRET_NAME: env.SUPABASE_URL_SECRET_NAME,
      SUPABASE_SERVICE_ROLE_SECRET_NAME: env.SUPABASE_SERVICE_ROLE_SECRET_NAME,
      GCS_PREVIEWS_BUCKET: env.GCS_PREVIEWS_BUCKET,
      GCS_EXPORTS_BUCKET: env.GCS_EXPORTS_BUCKET,
      GCS_WORKER_TEMP_BUCKET: env.GCS_WORKER_TEMP_BUCKET,
    },
    payload: payloadResult.payload,
  })
}

export function executeRemotionWorkerCli(): RemotionWorkerEntrypointResult {
  const result = runRemotionWorkerCli()
  writeSanitizedJson(result)
  setExitCode(result)
  return result
}

executeRemotionWorkerCli()
