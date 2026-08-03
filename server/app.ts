import cors from 'cors'
import express, { type Express } from 'express'
import type { RuntimeEnv } from './config/env'
import { createSupabaseAdminClient } from './supabase/admin-client'
import { createSupabasePublicClient } from './supabase/public-client'
import { requestIdMiddleware } from './middleware/request-id'
import { errorHandlerMiddleware } from './middleware/error-handler'
import { isExplicitLocalInternalTestRuntime } from './middleware/canonical-worker-runtime'
import { REEDITPRO_USER_AUTHORIZATION_HEADER } from './middleware/browser-api-auth-transport'
import { createControlledLocalStorytellingProductionAuthorityReader } from './motion-studio/storytelling-production'
import { createApprovalRoutes } from './routes/approval-routes'
import { createCanonicalCloudDispatchRoutes } from
  './routes/canonical-cloud-dispatch-routes'
import { createChatRoutes } from './routes/chat-routes'
import { createCreditDataRoutes } from './routes/credit-data-routes'
import { createCreditEstimateRoutes } from './routes/credit-estimate-routes'
import { createCreditRoutes } from './routes/credit-routes'
import { createEditExecutionRoutes } from './routes/edit-execution-routes'
import { createEditBriefAuthorityRoutes } from './routes/edit-brief-authority-routes'
import { createEditPlanningAuthorityRoutes } from './routes/edit-planning-authority-routes'
import { createEditPreferenceRoutes } from './routes/edit-preference-routes'
import { createEditReferenceRoutes } from './routes/edit-reference-routes'
import { createEditReferenceTargetVideoUnderstandingRoutes } from './routes/edit-reference-target-video-understanding-routes'
import { createExactEditPreferenceRoutes } from './routes/exact-edit-preference-routes'
import { createHealthRoutes } from './routes/health-routes'
import { createInternalEditStateRoutes } from './routes/internal-edit-state-routes'
import { createJobRoutes } from './routes/job-routes'
import { createMotionStudioRoutes } from './routes/motion-studio-routes'
import { createMotionStudioWorkerRoutes } from './routes/motion-studio-worker-routes'
import { createProjectEditBriefLocalRoutes } from './routes/project-edit-brief-local-routes'
import { createProjectEditPlanRoutes } from './routes/project-edit-plan-routes'
import { createProjectEditSessionRoutes } from './routes/project-edit-session-routes'
import { createProjectRoutes } from './routes/project-routes'
import { createPreferenceIntelligenceRoutes } from './routes/preference-intelligence-routes'
import { createProviderGatewayRoutes } from './routes/provider-gateway-routes'
import { createRenderRoutes } from './routes/render-routes'
import { createToolCostRoutes } from './routes/tool-cost-routes'
import { createUploadRoutes } from './routes/upload-routes'
import { createVisualIntelligenceRoutes } from
  './routes/visual-intelligence-routes'
import { createVisualIntelligenceOrchestraRoutes } from
  './routes/visual-intelligence-orchestra-routes'
import { createWorkerRoutes } from './routes/worker-routes'
import type { EditReferenceStudyChatRuntimePort } from './services/edit-reference-study-chat-runtime-port'
import type { CanonicalMotionStudioStorytellingProductionAuthorityReaderPort } from './services/canonical-motion-studio-storytelling-production-authority-service'
import type { EditReferenceExactEditApplyRuntimePort } from './services/edit-reference-exact-edit-apply-runtime-port'
import type { EditReferenceApplicationPreparationRuntimePort } from './services/edit-reference-application-preparation-runtime-port'
import type { CanonicalCloudDispatchHttpReceiverPort } from
  './services/canonical-cloud-dispatch-http-receiver-port'
import {
  createKimiK3SourceLedChatAssistantPort,
} from './services/kimi-k3-source-led-chat-assistant'
import {
  createGpt56TerraSourceLedChatAssistantPort,
} from './services/gpt-5-6-terra-source-led-chat-assistant'
import {
  createKimiTerraSourceLedChatAssistantPort,
} from './services/source-led-chat-assistant'
import type { StorageAdapter } from './storage/storage-types'
import type { RuntimeClients, RuntimeRequest, RuntimeState } from './types'

export interface ReeditProApiAppOptions {
  storageAdapter?: StorageAdapter
  clients?: RuntimeClients
  planningPreferenceApplicationAuthorityPort?: RuntimeState['planningPreferenceApplicationAuthorityPort']
  planningExactEditPreferenceAuthorityPort?: RuntimeState['planningExactEditPreferenceAuthorityPort']
  canonicalDurableUploadTargetStatePort?: RuntimeState['canonicalDurableUploadTargetStatePort']
  canonicalUploadTargetCredentialEscrow?: RuntimeState['canonicalUploadTargetCredentialEscrow']
  canonicalDurableUploadTargetRequestAuthorityFactory?:
    RuntimeState['canonicalDurableUploadTargetRequestAuthorityFactory']
  canonicalPrivateProjectRequestAuthorityFactory?:
    RuntimeState['canonicalPrivateProjectRequestAuthorityFactory']
  editReferenceStudyChatRuntimePort?: EditReferenceStudyChatRuntimePort
  canonicalMotionStudioStorytellingProductionAuthorityReaderPort?:
    CanonicalMotionStudioStorytellingProductionAuthorityReaderPort
  canonicalMotionStudioAudioCandidateReviewReaderPort?:
    RuntimeState['canonicalMotionStudioAudioCandidateReviewReaderPort']
  canonicalMotionStudioAudioSelectionTransitionPort?:
    RuntimeState['canonicalMotionStudioAudioSelectionTransitionPort']
  canonicalVisualCalibrationReferenceFrameReaderPort?:
    RuntimeState['canonicalVisualCalibrationReferenceFrameReaderPort']
  canonicalProviderAttemptRuntimeRecordSourcePort?:
    RuntimeState['canonicalProviderAttemptRuntimeRecordSourcePort']
  visualIntelligenceLifecyclePort?:
    RuntimeState['visualIntelligenceLifecyclePort']
  visualIntelligenceReportRepository?:
    RuntimeState['visualIntelligenceReportRepository']
  visualIntelligenceInspectionCoordinatorPort?:
    RuntimeState['visualIntelligenceInspectionCoordinatorPort']
  visualIntelligencePlanningOperationRequestOwnerPort?:
    RuntimeState['visualIntelligencePlanningOperationRequestOwnerPort']
  visualIntelligenceOrchestraJobRuntimePort?:
    RuntimeState['visualIntelligenceOrchestraJobRuntimePort']
  motionStudioCommandRepositoryRuntimePort?:
    RuntimeState['motionStudioCommandRepositoryRuntimePort']
  editReferenceExactEditApplyRuntimePort?: EditReferenceExactEditApplyRuntimePort
  editReferenceApplicationPreparationRuntimePort?: EditReferenceApplicationPreparationRuntimePort
  editReferenceLongFormStudyRuntimePort?: RuntimeState['editReferenceLongFormStudyRuntimePort']
  editReferenceLongFormStudyRuntimePortFactory?: RuntimeState['editReferenceLongFormStudyRuntimePortFactory']
  editReferenceDomainRepositoryRuntimePort?: RuntimeState['editReferenceDomainRepositoryRuntimePort']
  editReferenceSignedInPrivateMediaRuntimePort?: RuntimeState['editReferenceSignedInPrivateMediaRuntimePort']
  editReferenceExactEditBriefRuntimePortFactory?: RuntimeState['editReferenceExactEditBriefRuntimePortFactory']
  editReferenceTargetUnderstandingPackageRuntimePortFactory?:
    RuntimeState['editReferenceTargetUnderstandingPackageRuntimePortFactory']
  editBriefPrivateWorkspaceRuntimePort?:
    RuntimeState['editBriefPrivateWorkspaceRuntimePort']
  kimiK3SourceLedChatAssistantPort?:
    RuntimeState['kimiK3SourceLedChatAssistantPort']
  canonicalCloudDispatchHttpReceiverPort?:
    CanonicalCloudDispatchHttpReceiverPort
}

export function createReeditProApiApp(env: RuntimeEnv, options: ReeditProApiAppOptions = {}): Express {
  const clients = options.clients ?? {
    admin: createSupabaseAdminClient(env),
    public: createSupabasePublicClient(env),
  }
  const storytellingProductionReader =
    options.canonicalMotionStudioStorytellingProductionAuthorityReaderPort ??
    (isExplicitLocalInternalTestRuntime(env) && clients.admin
      ? createControlledLocalStorytellingProductionAuthorityReader(clients.admin)
      : undefined)
  const configuredSourceLedChatAssistantPort =
    options.kimiK3SourceLedChatAssistantPort ??
    (env.kimiRuntimeMode !== 'disabled'
      ? createKimiTerraSourceLedChatAssistantPort({
          kimi: createKimiK3SourceLedChatAssistantPort({ env }),
          ...(env.openAiRuntimeMode !== 'disabled'
            ? {
                terra:
                  createGpt56TerraSourceLedChatAssistantPort({ env }),
              }
            : {}),
        })
      : undefined)
  const runtime: RuntimeState = {
    env,
    ...(options.storageAdapter ? { storageAdapter: options.storageAdapter } : {}),
    ...(options.planningPreferenceApplicationAuthorityPort
      ? { planningPreferenceApplicationAuthorityPort: options.planningPreferenceApplicationAuthorityPort }
      : {}),
    ...(options.planningExactEditPreferenceAuthorityPort
      ? { planningExactEditPreferenceAuthorityPort: options.planningExactEditPreferenceAuthorityPort }
      : {}),
    ...(options.canonicalDurableUploadTargetStatePort
      ? { canonicalDurableUploadTargetStatePort: options.canonicalDurableUploadTargetStatePort }
      : {}),
    ...(options.canonicalUploadTargetCredentialEscrow
      ? { canonicalUploadTargetCredentialEscrow: options.canonicalUploadTargetCredentialEscrow }
      : {}),
    ...(options.canonicalDurableUploadTargetRequestAuthorityFactory
      ? {
          canonicalDurableUploadTargetRequestAuthorityFactory:
            options.canonicalDurableUploadTargetRequestAuthorityFactory,
        }
      : {}),
    ...(options.canonicalPrivateProjectRequestAuthorityFactory
      ? {
          canonicalPrivateProjectRequestAuthorityFactory:
            options.canonicalPrivateProjectRequestAuthorityFactory,
        }
      : {}),
    ...(options.editReferenceStudyChatRuntimePort
      ? { editReferenceStudyChatRuntimePort: options.editReferenceStudyChatRuntimePort }
      : {}),
    ...(storytellingProductionReader
      ? {
          canonicalMotionStudioStorytellingProductionAuthorityReaderPort:
            storytellingProductionReader,
        }
      : {}),
    ...(options.canonicalMotionStudioAudioCandidateReviewReaderPort
      ? {
          canonicalMotionStudioAudioCandidateReviewReaderPort:
            options.canonicalMotionStudioAudioCandidateReviewReaderPort,
        }
      : {}),
    ...(options.canonicalMotionStudioAudioSelectionTransitionPort
      ? {
          canonicalMotionStudioAudioSelectionTransitionPort:
            options.canonicalMotionStudioAudioSelectionTransitionPort,
        }
      : {}),
    ...(options.canonicalVisualCalibrationReferenceFrameReaderPort
      ? {
          canonicalVisualCalibrationReferenceFrameReaderPort:
            options.canonicalVisualCalibrationReferenceFrameReaderPort,
        }
      : {}),
    ...(options.canonicalProviderAttemptRuntimeRecordSourcePort
      ? {
          canonicalProviderAttemptRuntimeRecordSourcePort:
            options.canonicalProviderAttemptRuntimeRecordSourcePort,
        }
      : {}),
    ...(options.visualIntelligenceLifecyclePort
      ? {
          visualIntelligenceLifecyclePort:
            options.visualIntelligenceLifecyclePort,
        }
      : {}),
    ...(options.visualIntelligenceReportRepository
      ? {
          visualIntelligenceReportRepository:
            options.visualIntelligenceReportRepository,
        }
      : {}),
    ...(options.visualIntelligenceInspectionCoordinatorPort
      ? {
          visualIntelligenceInspectionCoordinatorPort:
            options.visualIntelligenceInspectionCoordinatorPort,
        }
      : {}),
    ...(options.visualIntelligencePlanningOperationRequestOwnerPort
      ? {
          visualIntelligencePlanningOperationRequestOwnerPort:
            options.visualIntelligencePlanningOperationRequestOwnerPort,
        }
      : {}),
    ...(options.visualIntelligenceOrchestraJobRuntimePort
      ? {
          visualIntelligenceOrchestraJobRuntimePort:
            options.visualIntelligenceOrchestraJobRuntimePort,
        }
      : {}),
    ...(options.motionStudioCommandRepositoryRuntimePort
      ? {
          motionStudioCommandRepositoryRuntimePort:
            options.motionStudioCommandRepositoryRuntimePort,
        }
      : {}),
    ...(options.editReferenceExactEditApplyRuntimePort
      ? { editReferenceExactEditApplyRuntimePort: options.editReferenceExactEditApplyRuntimePort }
      : {}),
    ...(options.editReferenceApplicationPreparationRuntimePort
      ? { editReferenceApplicationPreparationRuntimePort: options.editReferenceApplicationPreparationRuntimePort }
      : {}),
    ...(options.editReferenceLongFormStudyRuntimePort
      ? { editReferenceLongFormStudyRuntimePort: options.editReferenceLongFormStudyRuntimePort }
      : {}),
    ...(options.editReferenceLongFormStudyRuntimePortFactory
      ? {
          editReferenceLongFormStudyRuntimePortFactory:
            options.editReferenceLongFormStudyRuntimePortFactory,
        }
      : {}),
    ...(options.editReferenceDomainRepositoryRuntimePort
      ? { editReferenceDomainRepositoryRuntimePort: options.editReferenceDomainRepositoryRuntimePort }
      : {}),
    ...(options.editReferenceSignedInPrivateMediaRuntimePort
      ? {
          editReferenceSignedInPrivateMediaRuntimePort:
            options.editReferenceSignedInPrivateMediaRuntimePort,
        }
      : {}),
    ...(options.editReferenceExactEditBriefRuntimePortFactory
      ? {
          editReferenceExactEditBriefRuntimePortFactory:
            options.editReferenceExactEditBriefRuntimePortFactory,
        }
      : {}),
    ...(options.editReferenceTargetUnderstandingPackageRuntimePortFactory
      ? {
          editReferenceTargetUnderstandingPackageRuntimePortFactory:
            options.editReferenceTargetUnderstandingPackageRuntimePortFactory,
        }
      : {}),
    ...(options.editBriefPrivateWorkspaceRuntimePort
      ? {
          editBriefPrivateWorkspaceRuntimePort:
            options.editBriefPrivateWorkspaceRuntimePort,
        }
      : {}),
    ...(configuredSourceLedChatAssistantPort
      ? {
          kimiK3SourceLedChatAssistantPort:
            configuredSourceLedChatAssistantPort,
        }
      : {}),
    clients,
  }

  const app = express()
  app.disable('x-powered-by')
  app.use(cors({
    origin: createCorsOriginPolicy(env),
    credentials: false,
    allowedHeaders: [
      'accept',
      'authorization',
      'content-range',
      'content-type',
      'idempotency-key',
      'range',
      'x-request-id',
      'x-reeditpro-chunk-sha256',
      REEDITPRO_USER_AUTHORIZATION_HEADER,
    ],
    exposedHeaders: [
      'accept-ranges',
      'cache-control',
      'content-disposition',
      'content-length',
      'content-range',
      'content-type',
      'x-reeditpro-artifact-sha256',
      'x-reeditpro-private-download-delivery-id',
      'x-reeditpro-quality-decision-sha256',
      'x-reeditpro-quality-review-packet-sha256',
      'x-reeditpro-review-assembly-id',
      'x-reeditpro-review-decision-manifest-sha256',
      'x-reeditpro-review-manifest-sha256',
    ],
  }))
  app.use((_request, response, next) => {
    response.setHeader('x-content-type-options', 'nosniff')
    response.setHeader('x-frame-options', 'DENY')
    response.setHeader('referrer-policy', 'no-referrer')
    response.setHeader('permissions-policy', 'camera=(), geolocation=(), microphone=()')
    response.setHeader('cross-origin-resource-policy', 'same-site')
    response.setHeader('cache-control', 'no-store')
    if (env.nodeEnv === 'production') {
      response.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains')
    }
    next()
  })
  app.use(express.json({ limit: env.jsonBodyLimit }))
  app.use((request, _response, next) => {
    ;(request as RuntimeRequest).runtime = runtime
    next()
  })
  app.use(requestIdMiddleware)

  app.use(createHealthRoutes())
  if (options.canonicalCloudDispatchHttpReceiverPort) {
    app.use(createCanonicalCloudDispatchRoutes(
      options.canonicalCloudDispatchHttpReceiverPort,
    ))
  }
  app.use(createProjectRoutes())
  if (isExplicitLocalInternalTestRuntime(env)) {
    app.use(createProjectEditSessionRoutes())
    app.use(createProjectEditBriefLocalRoutes())
    app.use(createProjectEditPlanRoutes())
  }
  app.use(createEditPreferenceRoutes())
  app.use(createExactEditPreferenceRoutes())
  app.use(createEditReferenceRoutes())
  app.use(createEditReferenceTargetVideoUnderstandingRoutes())
  app.use(createPreferenceIntelligenceRoutes())
  app.use(createEditBriefAuthorityRoutes())
  app.use(createInternalEditStateRoutes())
  app.use(createChatRoutes())
  app.use(createUploadRoutes())
  app.use(createEditPlanningAuthorityRoutes())
  app.use(createApprovalRoutes())
  app.use(createCreditRoutes())
  app.use(createCreditDataRoutes())
  app.use(createCreditEstimateRoutes())
  app.use(createToolCostRoutes())
  app.use(createEditExecutionRoutes({
    includeInternalTestRoutes: isExplicitLocalInternalTestRuntime(env),
  }))
  app.use(createMotionStudioRoutes())
  app.use(createMotionStudioWorkerRoutes())
  app.use(createJobRoutes())
  app.use(createWorkerRoutes())
  app.use(createRenderRoutes())
  app.use(createVisualIntelligenceOrchestraRoutes())
  app.use(createVisualIntelligenceRoutes())
  app.use(createProviderGatewayRoutes())

  app.use(errorHandlerMiddleware)
  return app
}

function createCorsOriginPolicy(env: RuntimeEnv) {
  const configuredOrigins = new Set(env.allowedCorsOrigins)
  const localOriginsAllowed = env.nodeEnv !== 'production' && (env.mode === 'local' || env.mode === 'mock')

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin || configuredOrigins.has(origin)) {
      callback(null, true)
      return
    }

    if (localOriginsAllowed) {
      try {
        const hostname = new URL(origin).hostname
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
          callback(null, true)
          return
        }
      } catch {
        // Invalid origins fail closed below.
      }
    }

    callback(null, false)
  }
}
