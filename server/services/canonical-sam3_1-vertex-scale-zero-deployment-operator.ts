import {
  assertCanonicalSam31VertexScaleZeroDeploymentProfile,
  type CanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  assertCanonicalSam31VertexScaleZeroControlPlaneObservation,
  assertCanonicalSam31VertexScaleZeroControlPlaneSubmission,
  createCanonicalSam31VertexScaleZeroUnknownSubmission,
  type CanonicalSam31VertexScaleZeroControlPlaneObservation,
  type CanonicalSam31VertexScaleZeroControlPlaneSubmission,
} from './canonical-sam3_1-vertex-scale-zero-control-plane'
import type {
  CanonicalSam31VertexScaleZeroControlPlaneRepository,
  CanonicalSam31VertexScaleZeroControlPlaneRef,
} from './canonical-sam3_1-vertex-scale-zero-control-plane-repository'
import {
  createCanonicalSam31VertexScaleZeroFoundationRequests,
  createCanonicalSam31VertexScaleZeroModelDeployRequest,
  type CanonicalSam31VertexScaleZeroDeploymentRequest,
} from './canonical-sam3_1-vertex-scale-zero-deployment-request-compiler'

export const CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_DEPLOYMENT_OPERATOR_VERSION =
  'canonical-sam3_1-vertex-scale-zero-deployment-operator-v1' as const

type Stage = 'model_upload' | 'endpoint_create' | 'model_deploy'
type Ref = CanonicalSam31VertexScaleZeroControlPlaneRef

export interface CanonicalSam31VertexScaleZeroStageResult {
  readonly stage: Stage
  readonly disposition:
    | 'completed'
    | 'pending'
    | 'terminal_failure'
    | 'outcome_unknown_requires_reconciliation'
  readonly requestRef: Ref
  readonly consumptionRef: Ref
  readonly submissionRef: Ref
  readonly observationRef: Ref | null
  readonly observation:
    CanonicalSam31VertexScaleZeroControlPlaneObservation | null
  readonly providerPostIssuedThisRun: boolean
  readonly automaticRetryAllowed: false
}

export interface CanonicalSam31VertexScaleZeroDeploymentOperatorResult {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_DEPLOYMENT_OPERATOR_VERSION
  readonly disposition:
    | 'deployed'
    | 'pending'
    | 'terminal_failure'
    | 'outcome_unknown_requires_reconciliation'
  readonly deploymentProfileRef: Ref
  readonly stages: readonly CanonicalSam31VertexScaleZeroStageResult[]
  readonly exactSequentialStageOrder: true
  readonly durableConsumptionBeforeEveryProviderPost: true
  readonly automaticRetryAllowed: false
  readonly customerRequestOrGpuInferenceStarted: false
  readonly walletOrCreditMutationAuthorityGranted: false
  readonly publicDeliveryAuthorityGranted: false
  readonly productionAuthorityGranted: false
}

interface ControlPlane {
  submitOne(request: CanonicalSam31VertexScaleZeroDeploymentRequest): Promise<
    CanonicalSam31VertexScaleZeroControlPlaneSubmission
  >
  observeOne(input: {
    readonly submission: CanonicalSam31VertexScaleZeroControlPlaneSubmission
  }): Promise<CanonicalSam31VertexScaleZeroControlPlaneObservation>
  reconcileUnknown(input: {
    readonly request: CanonicalSam31VertexScaleZeroDeploymentRequest
    readonly unknownSubmission:
      CanonicalSam31VertexScaleZeroControlPlaneSubmission
  }): Promise<CanonicalSam31VertexScaleZeroControlPlaneObservation | null>
}

export function createCanonicalSam31VertexScaleZeroDeploymentOperator(input: {
  readonly controlPlane: ControlPlane
  readonly repository: CanonicalSam31VertexScaleZeroControlPlaneRepository
  readonly sleep?: (milliseconds: number) => Promise<void>
  readonly pollIntervalMilliseconds?: number
  readonly maximumWaitMilliseconds?: number
}) {
  assertPort(input.controlPlane, input.repository)
  const sleep = input.sleep ?? ((milliseconds: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, milliseconds)))
  const pollInterval = input.pollIntervalMilliseconds ?? 10_000
  const maximumWait = input.maximumWaitMilliseconds ?? 45 * 60_000
  if (
    !Number.isInteger(pollInterval)
    || pollInterval < 250
    || pollInterval > 60_000
    || !Number.isInteger(maximumWait)
    || maximumWait < pollInterval
    || maximumWait > 90 * 60_000
  ) throw new Error('Vertex deployment operator polling policy changed.')

  return Object.freeze({
    async deployOne(
      value: CanonicalSam31VertexScaleZeroDeploymentProfile,
    ): Promise<CanonicalSam31VertexScaleZeroDeploymentOperatorResult> {
      const profile = assertCanonicalSam31VertexScaleZeroDeploymentProfile(
        value,
      )
      const deploymentProfileRef = await input.repository
        .persistDeploymentProfile(profile)
      const rereadProfile = await input.repository.rereadDeploymentProfile(
        deploymentProfileRef,
      )
      if (
        !rereadProfile
        || rereadProfile.profileHash !== profile.profileHash
      ) throw new Error('Vertex deployment profile exact reread changed.')

      const [uploadRequest, endpointRequest] =
        createCanonicalSam31VertexScaleZeroFoundationRequests(profile)
      const stages: CanonicalSam31VertexScaleZeroStageResult[] = []
      const upload = await executeStage({
        request: uploadRequest,
        profile,
        deploymentProfileRef,
      })
      stages.push(upload)
      if (upload.disposition !== 'completed') {
        return result(upload.disposition, deploymentProfileRef, stages)
      }
      const modelResourceName = upload.observation?.modelResourceName
      if (!modelResourceName) {
        throw new Error('Completed Vertex upload did not return its model.')
      }

      const endpoint = await executeStage({
        request: endpointRequest,
        profile,
        deploymentProfileRef,
      })
      stages.push(endpoint)
      if (endpoint.disposition !== 'completed') {
        return result(endpoint.disposition, deploymentProfileRef, stages)
      }

      const deploy = await executeStage({
        request: createCanonicalSam31VertexScaleZeroModelDeployRequest({
          profile,
          modelResourceName,
        }),
        profile,
        deploymentProfileRef,
      })
      stages.push(deploy)
      return result(
        deploy.disposition === 'completed' ? 'deployed' : deploy.disposition,
        deploymentProfileRef,
        stages,
      )
    },
  })

  async function executeStage(context: {
    readonly request: CanonicalSam31VertexScaleZeroDeploymentRequest
    readonly profile: CanonicalSam31VertexScaleZeroDeploymentProfile
    readonly deploymentProfileRef: Ref
  }): Promise<CanonicalSam31VertexScaleZeroStageResult> {
    const requestRef = await input.repository.persistRequest(context.request)
    let submission = await input.repository.rereadSubmissionForRequest(
      requestRef,
    )
    let providerPostIssuedThisRun = false

    const consumption = await input.repository.consumeRequestCreateOnly({
      deploymentProfileRef: context.deploymentProfileRef,
      requestRef,
      consumedAt: context.profile.recordedAt,
    })
    const consumptionRef = consumption.consumptionRef

    if (!submission) {
      if (consumption.created) {
        providerPostIssuedThisRun = true
        submission = assertCanonicalSam31VertexScaleZeroControlPlaneSubmission(
          await input.controlPlane.submitOne(context.request),
        )
      } else {
        submission = createCanonicalSam31VertexScaleZeroUnknownSubmission({
          request: context.request,
          consumedAt: consumption.consumption.consumedAt,
        })
      }
    }
    const submissionRef = await input.repository.persistSubmission({
      requestRef,
      submission,
    })
    const rereadSubmission = await input.repository.rereadSubmission(
      submissionRef,
    )
    if (
      !rereadSubmission
      || rereadSubmission.submissionHash !== submission.submissionHash
    ) throw new Error('Vertex submission exact reread changed.')

    if (submission.disposition ===
      'outcome_unknown_requires_reconciliation') {
      const observation = await input.controlPlane.reconcileUnknown({
        request: context.request,
        unknownSubmission: submission,
      })
      if (!observation) return stageResult({
        stage: context.request.stage,
        disposition: 'outcome_unknown_requires_reconciliation',
        requestRef,
        consumptionRef,
        submissionRef,
        observationRef: null,
        observation: null,
        providerPostIssuedThisRun,
      })
      return persistStageObservation({
        requestRef,
        consumptionRef,
        submissionRef,
        observation,
        providerPostIssuedThisRun,
      })
    }

    const started = Date.now()
    while (true) {
      let observation: CanonicalSam31VertexScaleZeroControlPlaneObservation
      try {
        observation =
          assertCanonicalSam31VertexScaleZeroControlPlaneObservation(
            await input.controlPlane.observeOne({ submission }),
          )
      } catch (error) {
        if (!isTransientObservationReadError(error)) throw error
        if (Date.now() - started >= maximumWait) return stageResult({
          stage: context.request.stage,
          disposition: 'pending',
          requestRef,
          consumptionRef,
          submissionRef,
          observationRef: null,
          observation: null,
          providerPostIssuedThisRun,
        })
        await sleep(pollInterval)
        continue
      }
      const persisted = await persistStageObservation({
        requestRef,
        consumptionRef,
        submissionRef,
        observation,
        providerPostIssuedThisRun,
      })
      if (observation.disposition !== 'pending') return persisted
      if (Date.now() - started >= maximumWait) return persisted
      await sleep(pollInterval)
    }
  }

  async function persistStageObservation(context: {
    readonly requestRef: Ref
    readonly consumptionRef: Ref
    readonly submissionRef: Ref
    readonly observation: CanonicalSam31VertexScaleZeroControlPlaneObservation
    readonly providerPostIssuedThisRun: boolean
  }): Promise<CanonicalSam31VertexScaleZeroStageResult> {
    const observationRef = await input.repository.persistObservation({
      submissionRef: context.submissionRef,
      observation: context.observation,
    })
    const reread = await input.repository.rereadObservation(observationRef)
    if (!reread || reread.observationHash !== context.observation.observationHash) {
      throw new Error('Vertex observation exact reread changed.')
    }
    return stageResult({
      stage: context.observation.stage,
      disposition: context.observation.disposition,
      requestRef: context.requestRef,
      consumptionRef: context.consumptionRef,
      submissionRef: context.submissionRef,
      observationRef,
      observation: context.observation,
      providerPostIssuedThisRun: context.providerPostIssuedThisRun,
    })
  }
}

function isTransientObservationReadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const directCode = 'code' in error ? Number(error.code) : undefined
  const responseCode = 'response' in error
    && error.response && typeof error.response === 'object'
    && 'status' in error.response
    ? Number(error.response.status)
    : undefined
  const code = Number.isInteger(responseCode) ? responseCode : directCode
  return code === 404 || code === 408 || code === 429
    || (typeof code === 'number' && code >= 500 && code <= 599)
}

function stageResult(input: Omit<
  CanonicalSam31VertexScaleZeroStageResult,
  'automaticRetryAllowed'
>): CanonicalSam31VertexScaleZeroStageResult {
  return Object.freeze({ ...input, automaticRetryAllowed: false })
}

function result(
  disposition: CanonicalSam31VertexScaleZeroDeploymentOperatorResult[
    'disposition'
  ] | Exclude<CanonicalSam31VertexScaleZeroStageResult['disposition'],
    'completed'>,
  deploymentProfileRef: Ref,
  stages: readonly CanonicalSam31VertexScaleZeroStageResult[],
): CanonicalSam31VertexScaleZeroDeploymentOperatorResult {
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_DEPLOYMENT_OPERATOR_VERSION,
    disposition,
    deploymentProfileRef,
    stages: Object.freeze([...stages]),
    exactSequentialStageOrder: true,
    durableConsumptionBeforeEveryProviderPost: true,
    automaticRetryAllowed: false,
    customerRequestOrGpuInferenceStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

function assertPort(
  controlPlane: ControlPlane,
  repository: CanonicalSam31VertexScaleZeroControlPlaneRepository,
): void {
  if (
    typeof controlPlane?.submitOne !== 'function'
    || typeof controlPlane?.observeOne !== 'function'
    || typeof controlPlane?.reconcileUnknown !== 'function'
    || typeof repository?.persistDeploymentProfile !== 'function'
    || typeof repository?.rereadDeploymentProfile !== 'function'
    || typeof repository?.persistRequest !== 'function'
    || typeof repository?.consumeRequestCreateOnly !== 'function'
    || typeof repository?.rereadSubmissionForRequest !== 'function'
    || typeof repository?.persistSubmission !== 'function'
    || typeof repository?.persistObservation !== 'function'
  ) throw new Error('Vertex deployment operator ports are incomplete.')
}
