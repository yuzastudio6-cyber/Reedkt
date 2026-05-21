import type { RemotionRenderWorkerRequest } from '../../cloud/remotion-render-contracts'
import type { ReeditProRuntimeRegion } from '../../cloud/live-gcp-resource-map'
import { buildRemotionRenderManifest, preflightRemotionRenderRequest } from './remotion-manifest-builder'
import type {
  RemotionWorkerEvent,
  RemotionWorkerMockResult,
  RemotionWorkerSkeletonOptions,
} from './remotion-worker-types'

function nowIso(): string {
  return new Date().toISOString()
}

function event(
  eventType: RemotionWorkerEvent['eventType'],
  message: string,
  visibleToUser = false,
  metadata: RemotionWorkerEvent['metadata'] = {},
): RemotionWorkerEvent {
  return {
    eventType,
    message,
    createdAt: nowIso(),
    visibleToUser,
    metadata,
  }
}

export function runRemotionWorkerSkeleton(
  request: RemotionRenderWorkerRequest,
  options: RemotionWorkerSkeletonOptions = {},
): RemotionWorkerMockResult {
  const mode = options.mode ?? 'mock_only'
  const runtimeRegion: ReeditProRuntimeRegion = options.runtimeRegion ?? 'us-east1'
  const events: RemotionWorkerEvent[] = [
    event('render_worker_started', 'Mock Remotion worker started.', false, {
      renderJobId: request.renderJobId,
      runtimeRegion,
      mode,
    }),
  ]

  if (mode !== 'mock_only') {
    const preflight = preflightRemotionRenderRequest(request)
    const blocked = {
      ...preflight,
      ok: false,
      status: 'blocked_real_render_disabled' as const,
      errors: [
        ...preflight.errors,
        'Real Remotion rendering is blocked in RP-RENDER-01.',
      ],
    }

    return {
      ok: false,
      mode,
      preflight: blocked,
      events: [
        ...events,
        event('render_worker_blocked', 'Real Remotion rendering is blocked in RP-RENDER-01.', true),
      ],
      summary: 'Real render blocked. This milestone is mock-only.',
    }
  }

  const preflight = preflightRemotionRenderRequest(request)
  events.push(event('render_preflight_checked', 'Remotion render preflight checked.', false, {
    ok: preflight.ok,
    status: preflight.status,
  }))

  if (!preflight.ok) {
    return {
      ok: false,
      mode,
      preflight,
      events: [
        ...events,
        event('render_worker_blocked', 'Mock Remotion render blocked by preflight.', true, {
          errors: preflight.errors,
        }),
      ],
      summary: 'Mock render blocked by preflight. No rendering was attempted.',
    }
  }

  const manifest = buildRemotionRenderManifest(request, runtimeRegion)
  events.push(
    event('render_manifest_created', 'Mock Remotion render manifest created.', false, {
      manifestId: manifest.id,
      layerCount: manifest.layers.length,
      assetDependencyCount: manifest.assetDependencies.length,
    }),
    event('render_mock_completed', 'Mock Remotion worker completed without rendering media.', true, {
      outputBucket: manifest.outputLocation.bucketName,
      outputPath: manifest.outputLocation.objectPath,
      noRenderedFileExists: true,
    }),
  )

  return {
    ok: true,
    mode,
    preflight,
    manifest,
    outputLocation: manifest.outputLocation,
    events,
    summary: 'Mock Remotion worker created a render manifest. No media was rendered.',
  }
}

export const REMOTION_WORKER_SKELETON_RUNTIME_RULES = [
  'No Remotion package import is allowed in RP-RENDER-01.',
  'No file download or upload is performed.',
  'No rendered media exists after runRemotionWorkerSkeleton.',
  'RP-RENDER-02 Cloud Run Job container skeleton must remain mock-only.',
  'Future real rendering must happen only after approved snapshot, reserved credits, timing validation, and QA/fallback gates pass.',
] as const
