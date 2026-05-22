import {
  STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE,
  STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
  type StagingRenderInfrastructureCanaryResult,
} from './staging-render-infrastructure-canary-service'
import type { JSONObject } from '../../src/types'

export interface RenderInfrastructureCanaryInvocationConfig {
  cloudRunUrl: string
  audience: string
  idToken: string
  durationSeconds: number
  width: number
  height: number
  fps: number
  timeoutSeconds: number
}

export interface RenderInfrastructureCanaryInvocationResult {
  outputBucketName: string
  outputObjectPath: string
  durationSeconds: number
  width: number
  height: number
  fps: number
  frameCount: number
  sizeBytes: number
  checksumSha256: string
  commandSummary: JSONObject
  outputArtifactSummary: JSONObject
}

export async function invokeStagingRenderInfrastructureCanary(input: {
  smokeRunId: string
  config: RenderInfrastructureCanaryInvocationConfig
}): Promise<RenderInfrastructureCanaryInvocationResult> {
  const endpoint = resolveCanaryEndpoint(input.config.cloudRunUrl)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.config.timeoutSeconds * 1000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${input.config.idToken}`,
        'content-type': 'application/json',
        'x-reeditpro-canary': STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
      },
      body: JSON.stringify({
        canary: true,
        smokeRunId: input.smokeRunId,
        mode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
        fixture: STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE,
        maxDurationSeconds: input.config.durationSeconds,
        maxFrames: Math.ceil(input.config.durationSeconds * input.config.fps),
        width: input.config.width,
        height: input.config.height,
        fps: input.config.fps,
        cleanup: true,
      }),
      signal: controller.signal,
    })

    const responseJson = await response.json().catch(() => undefined) as StagingRenderInfrastructureCanaryResult | undefined
    if (!response.ok || !responseJson?.ok || !responseJson.outputArtifact) {
      throw new Error(responseJson?.error?.message ?? `Cloud Run canary request failed with status ${response.status}.`)
    }

    const artifact = responseJson.outputArtifact
    if (!artifact.existsBeforeCleanup || !artifact.deleted || artifact.existsAfterCleanup) {
      throw new Error('Cloud Run canary did not verify artifact creation and cleanup.')
    }
    if (artifact.sizeBytes <= 0) {
      throw new Error('Cloud Run canary returned an empty artifact.')
    }

    return {
      outputBucketName: artifact.bucketName,
      outputObjectPath: artifact.objectPath,
      durationSeconds: artifact.durationSeconds,
      width: artifact.width,
      height: artifact.height,
      fps: artifact.fps,
      frameCount: artifact.frameCount,
      sizeBytes: artifact.sizeBytes,
      checksumSha256: artifact.checksumSha256,
      commandSummary: {
        tool: 'cloud_run_remotion_canary',
        mode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
        cloudRunInvoked: true,
        remotionRenderMediaInvoked: true,
        remotionBundleInvoked: true,
        remotionSelectCompositionInvoked: true,
        providerCallsEnabled: false,
        stripeCallsEnabled: false,
        queueDrainEnabled: false,
        audienceConfigured: Boolean(input.config.audience),
      },
      outputArtifactSummary: {
        ...artifact,
        smokeTraceable: artifact.objectPath.includes(input.smokeRunId),
      },
    }
  } finally {
    clearTimeout(timeout)
  }
}

function resolveCanaryEndpoint(rawUrl: string): string {
  const url = new URL(rawUrl)
  if (url.pathname === '/' || url.pathname === '') {
    url.pathname = '/canary/render'
  }
  return url.toString()
}
