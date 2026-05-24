import { loadRuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import { runToolReadinessChecks } from '../workers/tool-readiness-runner'
import type { ToolReadinessCheckResult } from '../workers/tool-readiness-types'
import {
  EDITING_TOOL_ERROR_CODES,
  EditingToolReadinessError,
} from './editing-tool-errors'
import {
  EDITING_TOOL_REGISTRY,
  getCurrentMilestoneRequiredToolIds,
  listEditingToolContracts,
} from './editing-tool-registry'
import {
  EDITING_TOOL_IDS,
  isEditingToolId,
  type EditingToolContract,
  type EditingToolId,
} from './editing-tool-contracts'
import { listEditingWorkerToolMappings } from './editing-worker-tool-map'

export interface EditingToolReadinessInput {
  strict?: boolean
  toolId?: EditingToolId
  requiredToolIds?: EditingToolId[]
  sourceEnv?: NodeJS.ProcessEnv
}

export interface EditingToolReadinessCheck {
  toolId: EditingToolId
  displayName: string
  required: boolean
  status: ToolReadinessCheckResult['status']
  version?: string
  binaryPath?: string
  capabilities: string[]
  summary: string
  errorCode?: string
  currentReadiness: EditingToolContract['currentReadiness']
  productionApprovalStatus: EditingToolContract['productionApprovalStatus']
}

export interface EditingToolReadinessSummary {
  ok: boolean
  strict: boolean
  runtimeMode: string
  requiredToolIds: EditingToolId[]
  missingRequiredToolIds: EditingToolId[]
  checks: EditingToolReadinessCheck[]
  warnings: string[]
  generatedAt: string
}

export async function runEditingToolReadiness(
  input: EditingToolReadinessInput = {},
): Promise<EditingToolReadinessSummary> {
  const env = loadRuntimeEnv({
    ...process.env,
    ...input.sourceEnv,
    API_ALLOW_MOCK_WITHOUT_SUPABASE: input.sourceEnv?.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'true',
    E2E_RUNTIME_MODE: input.sourceEnv?.E2E_RUNTIME_MODE ?? process.env.E2E_RUNTIME_MODE ?? 'local',
    WORKER_RUNTIME_MODE: input.sourceEnv?.WORKER_RUNTIME_MODE ?? process.env.WORKER_RUNTIME_MODE ?? 'local',
  })
  const context: ServiceContext = {
    env,
    clients: { admin: null, public: null },
    requestId: 'editing-tool-readiness',
    auth: { userId: 'tool-readiness-cli', isMockUser: true },
  }
  const requiredToolIds = input.requiredToolIds ?? getCurrentMilestoneRequiredToolIds()
  const readiness = await runToolReadinessChecks(context, {
    toolName: input.toolId,
    recordResults: false,
    requiredTools: requiredToolIds,
  })
  const checks = readiness.checks.map((check) => {
    const contract = EDITING_TOOL_REGISTRY[check.toolName]
    return {
      toolId: check.toolName,
      displayName: contract.displayName,
      required: check.required,
      status: check.status,
      version: check.version,
      binaryPath: check.binaryPath,
      capabilities: check.capabilities,
      summary: check.summary,
      errorCode: check.errorCode,
      currentReadiness: contract.currentReadiness,
      productionApprovalStatus: contract.productionApprovalStatus,
    }
  })
  const missingRequiredToolIds = readiness.missingRequiredTools.filter(isEditingToolId)
  const strict = Boolean(input.strict)

  return {
    ok: strict ? missingRequiredToolIds.length === 0 : true,
    strict,
    runtimeMode: readiness.runtimeMode,
    requiredToolIds,
    missingRequiredToolIds,
    checks,
    warnings: readiness.warnings,
    generatedAt: new Date().toISOString(),
  }
}

export function throwIfStrictReadinessFailed(summary: EditingToolReadinessSummary): void {
  if (summary.strict && summary.missingRequiredToolIds.length > 0) {
    throw new EditingToolReadinessError(
      EDITING_TOOL_ERROR_CODES.TOOL_STRICT_READINESS_FAILED,
      `Strict tool readiness failed for: ${summary.missingRequiredToolIds.join(', ')}.`,
      summary.missingRequiredToolIds,
    )
  }
}

export function createEditingToolRegistrySummary(readiness?: EditingToolReadinessSummary): Record<string, unknown> {
  const checksByTool = new Map(readiness?.checks.map((check) => [check.toolId, check]))
  return {
    generatedAt: new Date().toISOString(),
    currentMilestoneRequiredToolIds: getCurrentMilestoneRequiredToolIds(),
    tools: listEditingToolContracts().map((contract) => ({
      ...contract,
      readiness: checksByTool.get(contract.toolId) ?? {
        toolId: contract.toolId,
        status: 'not_checked',
        summary: 'Readiness check was not run for this registry summary.',
      },
    })),
    workerToolMap: listEditingWorkerToolMappings(),
    safety: {
      checksAreSafeOnly: true,
      noMediaProcessing: true,
      noProviderCalls: true,
      noStripe: true,
      noSecrets: true,
      noQueueDrain: true,
    },
  }
}

export function parseEditingToolIds(values: string[]): EditingToolId[] {
  return values.filter(isEditingToolId)
}

export function allEditingToolIds(): EditingToolId[] {
  return [...EDITING_TOOL_IDS]
}
