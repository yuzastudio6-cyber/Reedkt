import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort,
} from '../services/canonical-source-analysis-l4-visual-evidence-attempt-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository,
} from '../services/canonical-source-analysis-l4-visual-evidence-authority-repository'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-worker-bootstrap-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-worker-evidence-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-tool-artifact-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-toolchain-qualification-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceFixedProcessPort,
} from '../services/canonical-source-analysis-l4-visual-evidence-fixed-process-port'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceSixToolExecutor,
} from '../services/canonical-source-analysis-l4-visual-evidence-six-tool-executor'

const workerEnvironmentSchema = z.object({
  REEDITPRO_GPU_INVOCATION_ID: z.string().trim().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
    .refine((value) => !value.includes('..')),
  WORKER_GROUP: z.literal('l4_standard_primary'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.string().min(3).max(222)
    .regex(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/u),
  REEDITPRO_ENV: z.literal('production'),
}).passthrough()

let gpuExecutorEntered = false

try {
  const environment = workerEnvironmentSchema.parse(process.env)
  const storage = new Storage({ projectId: 'reeditpro' })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: environment.GCS_CONTROL_PLANE_STATE_BUCKET,
  })
  const authorityRepository =
    createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository({
      objectPort,
    })
  const toolchainQualificationOwner =
    createCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationOwner({
      objectPort,
    })
  const bootstrapOwner =
    createCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner({
      envelopeReadPort:
        createCanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort({
          objectPort,
        }),
      authorityRepository,
      toolchainQualificationReadPort: toolchainQualificationOwner,
    })
  const workerEvidenceOwner =
    createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner({
      objectPort,
    })
  const toolArtifactOwner =
    createCanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner({
      objectPort,
    })
  const executor =
    createCanonicalSourceAnalysisL4VisualEvidenceSixToolExecutor({
      executionPort:
        createCanonicalSourceAnalysisL4VisualEvidenceFixedProcessPort({
          storage,
        }),
      toolArtifactOwner,
      workerEvidenceOwner,
    })
  const result = await bootstrapOwner.bootstrap(
    environment.REEDITPRO_GPU_INVOCATION_ID,
  )
  if (result.status !== 'ready') {
    console.error(JSON.stringify({
      ok: false,
      status: result.status,
      requiredGate: result.blockerCode,
      gpuToolExecutionStarted: false,
      substantiveCpuMediaProcessingUsed: false,
      customerCreditMutated: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    }))
    process.exitCode = 2
  } else {
    gpuExecutorEntered = true
    const completed = await executor.executeAndPersist(result.bootstrap)
    console.log(JSON.stringify({
      ok: true,
      status: completed.status,
      invocationId: completed.invocationId,
      toolArtifactRefs: completed.toolArtifactRefs,
      workerEvidenceRef: completed.workerEvidenceRef,
      exactCreateOnlyArtifactAndWorkerEvidenceRereadVerified:
        completed.exactCreateOnlyArtifactAndWorkerEvidenceRereadVerified,
      gpuToolExecutionStarted: true,
      substantiveCpuMediaProcessingUsed: false,
      runtimeModelOrToolDownloadPerformed: false,
      terminalCloudRunExecutionClaimed:
        completed.terminalCloudRunExecutionClaimed,
      scaleBackToZeroClaimedByWorker:
        completed.scaleBackToZeroClaimedByWorker,
      accountEffectiveCostClaimedByWorker:
        completed.accountEffectiveCostClaimedByWorker,
      customerCreditMutated: completed.customerCreditMutated,
      publicDeliveryGranted: completed.publicDeliveryGranted,
      productionAuthorityGranted: completed.productionAuthorityGranted,
    }))
  }
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    status: 'rejected',
    errorCode: safeErrorCode(error),
    gpuToolExecutionState: gpuExecutorEntered
      ? 'unknown_requires_terminal_reconciliation'
      : 'not_started',
    gpuToolExecutionStartedVerified: false,
    substantiveCpuMediaProcessingUsed: false,
    runtimeModelOrToolDownloadPerformed: false,
    customerCreditMutated: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }))
  process.exitCode = 1
}

function safeErrorCode(error: unknown): string {
  if (error instanceof ApiError) return error.code
  if (error instanceof z.ZodError) return 'WORKER_ENVIRONMENT_INVALID'
  return gpuExecutorEntered
    ? 'L4_VISUAL_EVIDENCE_WORKER_EXECUTION_FAILED'
    : 'L4_VISUAL_EVIDENCE_WORKER_BOOTSTRAP_FAILED'
}
