import {
  STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
  STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE,
  STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
  STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
  type StagingRenderInfrastructureCanaryResult,
} from '../services/staging-render-infrastructure-canary-service'
import type {
  RealVideoUploadPreviewCanaryInvocationConfig,
  RenderCanaryInvocationConfig,
  RenderCanaryInvocationResult,
  TimelineCompositionCanaryInvocationConfig,
} from './render-canary-types'

export async function invokeStagingRenderInfrastructureCanary(input: {
  smokeRunId: string
  config: RenderCanaryInvocationConfig
}): Promise<RenderCanaryInvocationResult> {
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
        stagingOnly: true,
        mode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
        fixture: STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE,
        maxDurationSeconds: input.config.durationSeconds,
        maxFrames: Math.ceil(input.config.durationSeconds * input.config.fps),
        width: input.config.width,
        height: input.config.height,
        fps: input.config.fps,
        cleanup: true,
        allow: {
          writes: true,
          renderExecution: true,
          cloudRun: true,
          remotion: true,
        },
        safety: {
          providerCallsEnabled: false,
          stripeCallsEnabled: false,
          paymentFlowsEnabled: false,
          queueDrainEnabled: false,
          userMediaEnabled: false,
          productionEnabled: false,
          boundedTimeoutSeconds: input.config.timeoutSeconds,
        },
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
        paymentFlowsEnabled: false,
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

export async function invokeStagingRealVideoUploadPreviewCanary(input: {
  smokeRunId: string
  config: RealVideoUploadPreviewCanaryInvocationConfig
}): Promise<RenderCanaryInvocationResult> {
  const endpoint = resolveCanaryEndpoint(input.config.cloudRunUrl)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.config.timeoutSeconds * 1000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${input.config.idToken}`,
        'content-type': 'application/json',
        'x-reeditpro-canary': STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
      },
      body: JSON.stringify({
        canary: true,
        smokeRunId: input.smokeRunId,
        stagingOnly: true,
        mode: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
        maxWaitSeconds: input.config.timeoutSeconds,
        cleanup: true,
        source: {
          bucketName: input.config.source.bucketName,
          objectPath: input.config.source.objectPath,
          mimeType: 'video/mp4',
          sizeBytes: input.config.source.sizeBytes,
          checksumSha256: input.config.source.checksumSha256,
          durationSecondsMax: 5,
          smokeTagged: true,
        },
        preview: {
          bucketName: input.config.preview.bucketName,
          objectPath: input.config.preview.objectPath,
          mimeType: 'video/mp4',
        },
        render: {
          maxDurationSeconds: input.config.durationSeconds,
          maxFrames: Math.ceil(input.config.durationSeconds * input.config.fps),
          width: input.config.width,
          height: input.config.height,
          fps: input.config.fps,
        },
        allow: {
          writes: true,
          renderExecution: true,
          cloudRun: true,
          remotion: true,
          providers: false,
          stripe: false,
          paymentFlows: false,
          queueDrain: false,
          userMedia: false,
          production: false,
        },
        safety: {
          providerCallsEnabled: false,
          stripeCallsEnabled: false,
          paymentFlowsEnabled: false,
          queueDrainEnabled: false,
          userMediaEnabled: false,
          productionEnabled: false,
          boundedTimeoutSeconds: input.config.timeoutSeconds,
        },
      }),
      signal: controller.signal,
    })

    const responseJson = await response.json().catch(() => undefined) as StagingRenderInfrastructureCanaryResult | undefined
    if (!response.ok || !responseJson?.ok || !responseJson.outputArtifact) {
      throw new Error(responseJson?.error?.message ?? `Cloud Run real-video canary request failed with status ${response.status}.`)
    }

    const artifact = responseJson.outputArtifact
    if (!artifact.existsBeforeCleanup || artifact.cleanupDelegatedToCaller !== true) {
      throw new Error('Cloud Run real-video canary did not leave a caller-cleaned preview artifact for verification.')
    }
    if (artifact.sizeBytes <= 0) {
      throw new Error('Cloud Run real-video canary returned an empty artifact.')
    }

    const outputArtifactSummary = {
      ...artifact,
      smokeTraceable: artifact.objectPath.includes(input.smokeRunId),
      ...(responseJson.sourceArtifact ? { sourceArtifact: responseJson.sourceArtifact } : {}),
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
        tool: 'cloud_run_real_video_upload_preview_canary',
        mode: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
        cloudRunInvoked: true,
        remotionRenderMediaInvoked: true,
        remotionBundleInvoked: true,
        remotionSelectCompositionInvoked: true,
        sourceVideoDownloaded: responseJson.sourceArtifact?.downloaded === true,
        providerCallsEnabled: false,
        stripeCallsEnabled: false,
        paymentFlowsEnabled: false,
        queueDrainEnabled: false,
        audienceConfigured: Boolean(input.config.audience),
      },
      outputArtifactSummary,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function invokeStagingTimelineCompositionCanary(input: {
  smokeRunId: string
  config: TimelineCompositionCanaryInvocationConfig
}): Promise<RenderCanaryInvocationResult> {
  const endpoint = resolveCanaryEndpoint(input.config.cloudRunUrl)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.config.timeoutSeconds * 1000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${input.config.idToken}`,
        'content-type': 'application/json',
        'x-reeditpro-canary': STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
      },
      body: JSON.stringify({
        canary: true,
        smokeRunId: input.smokeRunId,
        stagingOnly: true,
        mode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
        maxWaitSeconds: input.config.timeoutSeconds,
        cleanup: true,
        source: {
          bucketName: input.config.source.bucketName,
          objectPath: input.config.source.objectPath,
          mimeType: 'video/mp4',
          sizeBytes: input.config.source.sizeBytes,
          checksumSha256: input.config.source.checksumSha256,
          durationSecondsMax: 5,
          smokeTagged: true,
        },
        preview: {
          bucketName: input.config.preview.bucketName,
          objectPath: input.config.preview.objectPath,
          mimeType: 'video/mp4',
        },
        analysis: input.config.analysis,
        timeline: input.config.timeline,
        render: {
          maxDurationSeconds: input.config.durationSeconds,
          maxFrames: Math.ceil(input.config.durationSeconds * input.config.fps),
          width: input.config.width,
          height: input.config.height,
          fps: input.config.fps,
        },
        allow: {
          writes: true,
          renderExecution: true,
          cloudRun: true,
          remotion: true,
          timelineComposition: true,
          providers: false,
          stripe: false,
          paymentFlows: false,
          queueDrain: false,
          userMedia: false,
          production: false,
        },
        safety: {
          providerCallsEnabled: false,
          stripeCallsEnabled: false,
          paymentFlowsEnabled: false,
          queueDrainEnabled: false,
          userMediaEnabled: false,
          productionEnabled: false,
          boundedTimeoutSeconds: input.config.timeoutSeconds,
        },
      }),
      signal: controller.signal,
    })

    const responseJson = await response.json().catch(() => undefined) as StagingRenderInfrastructureCanaryResult | undefined
    if (!response.ok || !responseJson?.ok || !responseJson.outputArtifact) {
      throw new Error(responseJson?.error?.message ?? `Cloud Run timeline canary request failed with status ${response.status}.`)
    }

    const artifact = responseJson.outputArtifact
    if (!artifact.existsBeforeCleanup || artifact.cleanupDelegatedToCaller !== true) {
      throw new Error('Cloud Run timeline canary did not leave a caller-cleaned preview artifact for verification.')
    }
    if (artifact.sizeBytes <= 0) {
      throw new Error('Cloud Run timeline canary returned an empty artifact.')
    }

    const outputArtifactSummary = {
      ...artifact,
      smokeTraceable: artifact.objectPath.includes(input.smokeRunId),
      ...(responseJson.sourceArtifact ? { sourceArtifact: responseJson.sourceArtifact } : {}),
      ...(responseJson.timeline ? { timeline: responseJson.timeline } : {}),
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
        tool: 'cloud_run_timeline_composition_canary',
        mode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
        cloudRunInvoked: true,
        remotionRenderMediaInvoked: true,
        remotionBundleInvoked: true,
        remotionSelectCompositionInvoked: true,
        sourceVideoDownloaded: responseJson.sourceArtifact?.downloaded === true,
        timelineCompositionRendered: responseJson.timeline?.segmentCount === 1,
        captionPlaceholderLayerRendered: responseJson.timeline?.captionPlaceholderLayer === true,
        safeZoneOverlayRendered: responseJson.timeline?.safeZoneOverlayLayer === true,
        providerCallsEnabled: false,
        stripeCallsEnabled: false,
        paymentFlowsEnabled: false,
        queueDrainEnabled: false,
        audienceConfigured: Boolean(input.config.audience),
      },
      outputArtifactSummary,
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
