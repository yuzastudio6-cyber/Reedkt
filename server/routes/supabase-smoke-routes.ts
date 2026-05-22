import { Router } from 'express'
import { requireLiveSupabaseWriteAccess, requireLiveUserAuth } from '../middleware/auth'
import {
  runPersistedBasicRenderSmoke,
  runSupabaseTableReadinessSmoke,
  runSupabaseWriteReadSmoke,
} from '../services/supabase-e2e-smoke-service'
import { asyncRoute, getServiceContext, sendOk } from './route-helpers'

export function createSupabaseSmokeRoutes(): Router {
  const router = Router()

  router.get('/health/supabase/tables', asyncRoute(async (request, response) => {
    const result = await runSupabaseTableReadinessSmoke(getServiceContext(request))
    sendOk(response, result, result.warnings, result.ok ? 200 : 503)
  }))

  router.post('/v1/e2e/supabase/write-smoke', requireLiveUserAuth, requireLiveSupabaseWriteAccess, asyncRoute(async (request, response) => {
    const result = await runSupabaseWriteReadSmoke(getServiceContext(request))
    sendOk(response, result, result.warnings, result.ok ? 200 : 409)
  }))

  router.post('/v1/e2e/supabase/persisted-render-smoke', requireLiveUserAuth, requireLiveSupabaseWriteAccess, asyncRoute(async (request, response) => {
    const result = await runPersistedBasicRenderSmoke(getServiceContext(request))
    sendOk(response, result, result.warnings, result.ok ? 200 : 409)
  }))

  return router
}
