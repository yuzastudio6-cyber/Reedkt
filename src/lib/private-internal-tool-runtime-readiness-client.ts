import {
  callReeditProApi,
} from '../backend/api/frontend-api-client'

export interface PrivateInternalToolRuntimeReadinessTool {
  toolId: string
  displayName: string
  operationId: string
  runtimeFamily: string
  status: 'ready_for_private_internal_execution'
}

export interface PrivateInternalToolRuntimeReadiness {
  schemaVersion: 'private-internal-tool-runtime-readiness-browser-v1'
  evidenceRevision: string
  observedAt: string
  status: 'ready_for_private_internal_execution'
  canonicalToolCount: number
  readyToolCount: number
  runnerClassCount: number
  runtimeAuthorityCount: number
  allCanonicalToolsReady: true
  privateInternalExecutionReady: true
  productReady: false
  externalBetaReady: false
  productionReady: false
  tools: PrivateInternalToolRuntimeReadinessTool[]
  releaseBlockers: string[]
}

interface PrivateInternalToolRuntimeReadinessResponse {
  privateInternalToolRuntimeReadiness:
    PrivateInternalToolRuntimeReadiness
}

export async function readPrivateInternalToolRuntimeReadiness():
Promise<PrivateInternalToolRuntimeReadiness> {
  const response = await callReeditProApi<
    undefined,
    PrivateInternalToolRuntimeReadinessResponse
  >('editExecution.privateInternalToolRuntimeReadiness.read')
  const readiness = response.data?.privateInternalToolRuntimeReadiness

  if (!response.ok || !readiness) {
    throw new Error(
      response.error?.message
      ?? 'The authenticated private internal runtime status could not be read.',
    )
  }
  if (
    readiness.status !== 'ready_for_private_internal_execution'
    || readiness.canonicalToolCount !== readiness.readyToolCount
    || readiness.tools.length !== readiness.canonicalToolCount
    || !readiness.tools.every(
      (tool) => tool.status === 'ready_for_private_internal_execution',
    )
    || !readiness.allCanonicalToolsReady
    || !readiness.privateInternalExecutionReady
    || readiness.productReady
    || readiness.externalBetaReady
    || readiness.productionReady
  ) {
    throw new Error(
      'The backend returned an inconsistent private internal runtime status.',
    )
  }

  return readiness
}
