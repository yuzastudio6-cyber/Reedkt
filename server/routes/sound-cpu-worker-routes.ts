import type { Request, Response } from 'express'
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { validateBody } from '../validation/common-schemas'
import {
  createSoundCpuWorkerJobRouteSchema,
  getSoundCpuWorkerJobStatusRouteSchema,
  SOUND_CPU_WORKER_ROUTE_DISABLED_FLAGS,
  type CreateSoundCpuWorkerJobRouteInput,
} from '../validation/sound-cpu-worker-route-schemas'
import { asyncRoute, getRouteParam } from './route-helpers'

export const SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const
export const SOUND_CPU_WORKER_ROUTE_DISABLED_REASON = 'route_execution_not_enabled' as const

export type SoundCpuWorkerRouteOperation =
  | 'createSoundCpuWorkerJobRoute'
  | 'getSoundCpuWorkerJobStatusRoute'

export type SoundCpuWorkerRouteDisabledResponse = Readonly<{
  accepted: false
  operation: SoundCpuWorkerRouteOperation
  reason: typeof SOUND_CPU_WORKER_ROUTE_DISABLED_REASON
  jobId: string
  workerName?: CreateSoundCpuWorkerJobRouteInput['workerName']
  imageName?: CreateSoundCpuWorkerJobRouteInput['imageName']
  jobType?: CreateSoundCpuWorkerJobRouteInput['jobType']
  staticOnlyRuntimeFlags: typeof SOUND_CPU_WORKER_ROUTE_DISABLED_FLAGS
  ownerGateRequired: 'WORKER_RUNTIME_JOBS'
  routeRegisteredInApp: true
  workerDispatchStarted: false
  mediaProcessingStarted: false
  supabaseMutationStarted: false
  sqlExecutionStarted: false
  artifactCreated: false
}>

export function createSoundCpuRouteDisabledResponse(
  operation: SoundCpuWorkerRouteOperation,
  input: Pick<CreateSoundCpuWorkerJobRouteInput, 'jobId'> &
    Partial<Pick<CreateSoundCpuWorkerJobRouteInput, 'workerName' | 'imageName' | 'jobType'>>,
): SoundCpuWorkerRouteDisabledResponse {
  return {
    accepted: false,
    operation,
    reason: SOUND_CPU_WORKER_ROUTE_DISABLED_REASON,
    jobId: input.jobId,
    workerName: input.workerName,
    imageName: input.imageName,
    jobType: input.jobType,
    staticOnlyRuntimeFlags: SOUND_CPU_WORKER_ROUTE_DISABLED_FLAGS,
    ownerGateRequired: 'WORKER_RUNTIME_JOBS',
    routeRegisteredInApp: true,
    workerDispatchStarted: false,
    mediaProcessingStarted: false,
    supabaseMutationStarted: false,
    sqlExecutionStarted: false,
    artifactCreated: false,
  }
}

export async function createSoundCpuWorkerJobRoute(request: Request, response: Response): Promise<void> {
  const body = validateBody(createSoundCpuWorkerJobRouteSchema, request.body)
  sendSoundCpuRouteDisabled(
    response,
    createSoundCpuRouteDisabledResponse('createSoundCpuWorkerJobRoute', body),
  )
}

export async function getSoundCpuWorkerJobStatusRoute(request: Request, response: Response): Promise<void> {
  const params = getSoundCpuWorkerJobStatusRouteSchema.parse({ jobId: getRouteParam(request, 'jobId') })
  sendSoundCpuRouteDisabled(
    response,
    createSoundCpuRouteDisabledResponse('getSoundCpuWorkerJobStatusRoute', params),
  )
}

export function createSoundCpuWorkerRoutes(): Router {
  const router = Router()

  router.post('/v1/sound-cpu/jobs', requireAuth, requireIdempotency, asyncRoute(createSoundCpuWorkerJobRoute))
  router.get('/v1/sound-cpu/jobs/:jobId', requireAuth, asyncRoute(getSoundCpuWorkerJobStatusRoute))

  return router
}

function sendSoundCpuRouteDisabled(response: Response, route: SoundCpuWorkerRouteDisabledResponse): void {
  response.status(409).json({
    ok: false,
    error: {
      code: 'ROUTE_EXECUTION_NOT_ENABLED',
      message: 'SOUND CPU worker routes are source-created but remain disabled pending owner gates.',
      reason: route.reason,
    },
    data: { soundCpuWorkerRoute: route },
    warnings: [
      'route_execution_not_enabled',
      'worker_dispatch_execution_not_enabled',
      'supabase_mutation_not_enabled',
      'media_processing_not_enabled',
      'artifact_creation_not_enabled',
    ],
  })
}
