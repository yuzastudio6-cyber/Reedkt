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

const workerEnvironmentSchema = z.object({
  REEDITPRO_GPU_INVOCATION_ID: z.string().trim().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
    .refine((value) => !value.includes('..')),
  WORKER_GROUP: z.literal('l4_standard_primary'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.string().min(3).max(222)
    .regex(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/u),
  REEDITPRO_ENV: z.literal('production'),
}).passthrough()

try {
  const environment = workerEnvironmentSchema.parse(process.env)
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage: new Storage({ projectId: 'reeditpro' }),
    bucketName: environment.GCS_CONTROL_PLANE_STATE_BUCKET,
  })
  const authorityRepository =
    createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository({
      objectPort,
    })
  const bootstrapOwner =
    createCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner({
      envelopeReadPort:
        createCanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort({
          objectPort,
        }),
      authorityRepository,
    })
  const workerEvidenceOwner =
    createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner({
      objectPort,
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
    // This entrypoint intentionally stops after the exact durable bootstrap.
    // A later release must inject the separately qualified six-tool GPU
    // executor and terminal evidence owner. Starting the API server, guessing
    // a source path, or treating bootstrap as completed work is forbidden.
    console.error(JSON.stringify({
      ok: false,
      status: 'blocked',
      requiredGate:
        'source_visual_evidence_six_tool_gpu_executor_not_qualified',
      invocationRef: {
        id: result.bootstrap.invocationId,
        bootstrapDigestSha256: result.bootstrap.bootstrapDigestSha256,
      },
      workerEvidenceOwnerVersion: workerEvidenceOwner.schemaVersion,
      gpuToolExecutionStarted: false,
      substantiveCpuMediaProcessingUsed: false,
      runtimeModelOrToolDownloadPerformed: false,
      customerCreditMutated: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    }))
    process.exitCode = 2
  }
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    status: 'rejected',
    errorCode: safeErrorCode(error),
    gpuToolExecutionStarted: false,
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
  return 'L4_VISUAL_EVIDENCE_WORKER_BOOTSTRAP_FAILED'
}
