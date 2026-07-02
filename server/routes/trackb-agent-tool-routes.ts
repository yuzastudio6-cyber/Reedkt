import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createBetaReadinessEvidenceService } from '../beta-readiness/beta-readiness-evidence-service'
import { buildBetaReadinessBackendOperatorStatus } from '../beta-readiness/beta-readiness-operator-status'
import { buildTrackBAgentRuntimeReadinessReport } from '../beta-readiness/trackb-agent-runtime-readiness'
import { executeTrackBAgentTool } from '../agents/trackb-agent-tool-execution'
import { validateBody } from '../validation/common-schemas'
import { trackbAgentToolExecutionSchema } from '../validation/trackb-agent-tool-schemas'
import { asyncRoute, getIdempotencyKey, getServiceContext, sendOk } from './route-helpers'

export function createTrackBAgentToolRoutes(): Router {
  const router = Router()

  router.post('/v1/agent-tools/trackb/execute', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(trackbAgentToolExecutionSchema, request.body)
    const context = getServiceContext(request)
    const readinessReport = body.mode === 'deployed_live_execution'
      ? await buildStoredEvidenceReadinessReport(context, body.workspaceId)
      : undefined
    const result = await executeTrackBAgentTool({
      ...body,
      apiIdempotencyKey: getIdempotencyKey(request),
    }, { readinessReport })
    sendOk(response, { trackBAgentToolExecution: result }, result.warnings, result.status === 'blocked' ? 409 : 202)
  }))

  return router
}

async function buildStoredEvidenceReadinessReport(
  context: ReturnType<typeof getServiceContext>,
  workspaceId: string,
) {
  const evidence = await createBetaReadinessEvidenceService(context).getReport(workspaceId)
  const status = buildBetaReadinessBackendOperatorStatus(evidence.report, {
    workspaceId,
    evidencePacketCount: evidence.evidencePacketCount,
  })

  return buildTrackBAgentRuntimeReadinessReport({
    deployedEvidenceSource: 'stored_operator_status_readback',
    deployedEvidenceWorkspaceId: workspaceId,
    deployedEvidencePacketCount: evidence.evidencePacketCount,
    deployedEvidenceRecordedToolCount: status.currentGate.productReadyLocalOssCount,
  })
}
