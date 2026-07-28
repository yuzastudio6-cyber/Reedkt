import { Router } from 'express'

import {
  assertCanonicalCloudDispatchHttpReceiverPort,
  type CanonicalCloudDispatchHttpReceiverPort,
} from '../services/canonical-cloud-dispatch-http-receiver-port'
import { asyncRoute, sendOk } from './route-helpers'

export const CANONICAL_CLOUD_DISPATCH_CONTROLLER_PATH =
  '/internal/v1/canonical-cloud-dispatch' as const
export const CANONICAL_CLOUD_DISPATCH_WORKER_ACCEPT_PATH =
  '/internal/v1/canonical-cloud-dispatch/worker/accept' as const
export const CANONICAL_CLOUD_DISPATCH_WORKER_ATTEMPT_START_PATH =
  '/internal/v1/canonical-cloud-dispatch/worker/attempt-start' as const
export const CANONICAL_CLOUD_DISPATCH_WORKER_COMPLETION_PATH =
  '/internal/v1/canonical-cloud-dispatch/worker/complete' as const
export const CANONICAL_CLOUD_DISPATCH_WORKER_FAILURE_PATH =
  '/internal/v1/canonical-cloud-dispatch/worker/fail' as const
export const CANONICAL_CLOUD_DISPATCH_WORKER_TIMEOUT_PATH =
  '/internal/v1/canonical-cloud-dispatch/controller/timeout' as const

export function createCanonicalCloudDispatchRoutes(
  value: CanonicalCloudDispatchHttpReceiverPort,
): Router {
  const port = assertCanonicalCloudDispatchHttpReceiverPort(value)
  const router = Router()

  router.post(
    CANONICAL_CLOUD_DISPATCH_CONTROLLER_PATH,
    asyncRoute(async (request, response) => {
      const acknowledgement = await port.receiveController({
        authorizationHeader: request.header('authorization'),
        body: request.body,
      })
      sendOk(response, acknowledgement)
    }),
  )

  router.post(
    CANONICAL_CLOUD_DISPATCH_WORKER_ACCEPT_PATH,
    asyncRoute(async (request, response) => {
      const acknowledgement = await port.receiveWorker({
        authorizationHeader: request.header('authorization'),
        body: request.body,
      })
      sendOk(response, acknowledgement)
    }),
  )

  router.post(
    CANONICAL_CLOUD_DISPATCH_WORKER_ATTEMPT_START_PATH,
    asyncRoute(async (request, response) => {
      const acknowledgement = await port.beginWorkerAttempt({
        authorizationHeader: request.header('authorization'),
        body: request.body,
      })
      sendOk(response, acknowledgement)
    }),
  )

  router.post(
    CANONICAL_CLOUD_DISPATCH_WORKER_COMPLETION_PATH,
    asyncRoute(async (request, response) => {
      const acknowledgement = await port.completeWorkerAttempt({
        authorizationHeader: request.header('authorization'),
        body: request.body,
      })
      sendOk(response, acknowledgement)
    }),
  )

  router.post(
    CANONICAL_CLOUD_DISPATCH_WORKER_FAILURE_PATH,
    asyncRoute(async (request, response) => {
      const acknowledgement = await port.failWorkerAttempt({
        authorizationHeader: request.header('authorization'),
        body: request.body,
      })
      sendOk(response, acknowledgement)
    }),
  )

  router.post(
    CANONICAL_CLOUD_DISPATCH_WORKER_TIMEOUT_PATH,
    asyncRoute(async (request, response) => {
      const acknowledgement = await port.timeoutWorkerAttempt({
        authorizationHeader: request.header('authorization'),
        body: request.body,
      })
      sendOk(response, acknowledgement)
    }),
  )

  return router
}
