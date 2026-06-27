import {
  runBetaToolsLibassSyntheticBurninQaPreflight,
  type LibassSyntheticBurninCommandRunner,
} from './beta-tools-libass-synthetic-burnin-qa-preflight'
import {
  buildBetaToolsLibassSyntheticBurninQaEvidencePreflight,
  type BetaToolsLibassSyntheticBurninQaEvidenceEnv,
} from './beta-tools-libass-synthetic-burnin-qa-evidence-preflight'

export interface BetaToolsLibassSyntheticBurninQaEvidenceRunResult {
  ok: boolean
  status: number
  endpoint: string
  replayed?: boolean
  evidencePacketId?: string
  acceptedToolIds: string[]
  acceptedToolCount: number
  toolExecution: {
    productReadyLocalOssCount?: number
    externalBetaToolExecutionAllowed?: boolean
    productionToolExecutionAllowed?: boolean
    blockers?: number
    platformBlockers?: number
  }
  proof: {
    mode: 'host' | 'docker'
    tempRootRemoved: boolean
    fontDiscoveryOk: boolean
    burninCommandOk: boolean
    decodeProbeOk: boolean
    outputSizeBytes: number
    outputSha256?: string
    durationSeconds?: number
  }
  warnings: string[]
}

export type LibassSyntheticBurninQaEvidenceFetch = (
  url: string,
  init: {
    method: 'POST'
    headers: Record<string, string>
    body: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runBetaToolsLibassSyntheticBurninQaEvidenceFromEnv(
  env: BetaToolsLibassSyntheticBurninQaEvidenceEnv,
  fetchImpl: LibassSyntheticBurninQaEvidenceFetch = fetch as LibassSyntheticBurninQaEvidenceFetch,
  proofRunner?: LibassSyntheticBurninCommandRunner,
): Promise<BetaToolsLibassSyntheticBurninQaEvidenceRunResult> {
  const preflight = buildBetaToolsLibassSyntheticBurninQaEvidencePreflight(env)
  if (!preflight.readyToRunCli) {
    throw new Error(`Libass burn-in QA evidence inputs are incomplete: ${[
      ...preflight.missingConfiguration,
      ...preflight.confirmationGaps,
      ...preflight.secretLikeInputPaths,
    ].join('; ')}`)
  }

  const proofReport = runBetaToolsLibassSyntheticBurninQaPreflight(env, proofRunner)
  if (!proofReport.readyToRecordAcceptedEvidence || !proofReport.evidencePacket) {
    throw new Error('Libass synthetic burn-in QA did not produce accepted evidence to record.')
  }

  const endpoint = `${requiredEnv(env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_API_BASE_URL').replace(/\/+$/, '')}/v1/beta-readiness/evidence`
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${requiredEnv(env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_BEARER_TOKEN')}`,
      'content-type': 'application/json',
      'idempotency-key': requiredEnv(env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_IDEMPOTENCY_KEY'),
    },
    body: JSON.stringify(proofReport.evidencePacket),
  })
  const payload = await response.json()
  const result = summarizeLibassSyntheticBurninQaEvidenceResponse(endpoint, response.status, payload, proofReport)

  if (isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_RECORDED_EVIDENCE) && !result.acceptedToolIds.includes('libass')) {
    throw new Error('Recorded beta-readiness response did not include accepted libass evidence.')
  }

  return result
}

export function summarizeLibassSyntheticBurninQaEvidenceResponse(
  endpoint: string,
  status: number,
  payload: unknown,
  proofReport: ReturnType<typeof runBetaToolsLibassSyntheticBurninQaPreflight>,
): BetaToolsLibassSyntheticBurninQaEvidenceRunResult {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : {}
  const packet = isRecord(data.packet) ? data.packet : {}
  const evidence = isRecord(packet.evidence) ? packet.evidence : {}
  const acceptedToolEvidence = Array.isArray(evidence.acceptedToolEvidence) ? evidence.acceptedToolEvidence : []
  const acceptedToolIds = acceptedToolEvidence
    .map((record) => (isRecord(record) && typeof record.toolId === 'string' ? record.toolId : undefined))
    .filter((toolId): toolId is string => Boolean(toolId))
  const report = isRecord(data.report) ? data.report : {}
  const toolExecutionReadiness = isRecord(report.toolExecutionReadiness) ? report.toolExecutionReadiness : {}

  return {
    ok: Boolean(isRecord(payload) && payload.ok === true),
    status,
    endpoint,
    replayed: booleanValue(data.replayed),
    evidencePacketId: stringValue(packet.id),
    acceptedToolIds,
    acceptedToolCount: acceptedToolIds.length,
    toolExecution: {
      productReadyLocalOssCount: numberValue(toolExecutionReadiness.productReadyLocalOssCount),
      externalBetaToolExecutionAllowed: booleanValue(toolExecutionReadiness.externalBetaToolExecutionAllowed),
      productionToolExecutionAllowed: booleanValue(toolExecutionReadiness.productionToolExecutionAllowed),
      blockers: Array.isArray(toolExecutionReadiness.blockers) ? toolExecutionReadiness.blockers.length : undefined,
      platformBlockers: Array.isArray(toolExecutionReadiness.platformBlockers) ? toolExecutionReadiness.platformBlockers.length : undefined,
    },
    proof: {
      mode: proofReport.proof.mode,
      tempRootRemoved: proofReport.proof.tempRootRemoved,
      fontDiscoveryOk: proofReport.proof.fontDiscoveryOk,
      burninCommandOk: proofReport.proof.burninCommandOk,
      decodeProbeOk: proofReport.proof.decodeProbeOk,
      outputSizeBytes: proofReport.proof.outputVideo.sizeBytes,
      outputSha256: proofReport.proof.outputVideo.checksumSha256,
      durationSeconds: proofReport.proof.outputVideo.durationSeconds,
    },
    warnings: [
      ...stringArray(isRecord(payload) ? payload.warnings : undefined),
      'Libass evidence collector ran synthetic-only burn-in QA before recording the evidence packet.',
      'Recording accepted libass evidence does not enable external beta or paid production without platform evidence and launch approvals.',
    ],
  }
}

function requiredEnv(env: BetaToolsLibassSyntheticBurninQaEvidenceEnv, name: keyof BetaToolsLibassSyntheticBurninQaEvidenceEnv): string {
  const value = env[name]?.trim()
  if (!value) throw new Error(`${String(name)} is required.`)
  return value
}

function isTrue(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runBetaToolsLibassSyntheticBurninQaEvidenceFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Libass burn-in QA evidence CLI failed.')
    process.exitCode = 1
  }
}
