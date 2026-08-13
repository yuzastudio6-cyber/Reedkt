import { createReeditProApiApp } from './app'
import { assertRuntimeCanStart, loadRuntimeEnv } from './config/env'
import {
  createVisualIntelligenceProductionRuntime,
} from './visual-intelligence/visual-intelligence-production-runtime'
import {
  createCanonicalTrackAllSam31ProductionRuntime,
} from './services/canonical-track-all-sam3_1-production-runtime'

const env = loadRuntimeEnv()
assertRuntimeCanStart(env)
const visualIntelligenceRuntime =
  await createVisualIntelligenceProductionRuntime(env)
const trackAllSam31Runtime =
  createCanonicalTrackAllSam31ProductionRuntime(env)

const app = createReeditProApiApp(env, {
  ...(visualIntelligenceRuntime
    ? {
      visualIntelligenceReportRepository:
        visualIntelligenceRuntime.reportRepository,
      visualIntelligenceOrchestraJobRuntimePort:
        visualIntelligenceRuntime.orchestraJobRuntimePort,
      editReferenceVisualIntelligenceBindingStore:
        visualIntelligenceRuntime.editReferenceBindingStore,
      editReferenceVisualIntelligenceReadPort:
        visualIntelligenceRuntime.editReferenceReadPort,
      canonicalSourceCleanupAuthorityReadPort:
        visualIntelligenceRuntime.sourceCleanupAuthorityRepository,
      canonicalSourceVisualIntelligenceOrchestraReadPort:
        visualIntelligenceRuntime.sourceVideoUnderstandingReadPort,
    }
    : {}),
  ...(trackAllSam31Runtime
    ? {
        trackAllSam31AuthenticatedGpuStartRuntimePort:
          trackAllSam31Runtime
            .trackAllSam31AuthenticatedGpuStartRuntimePort,
        trackAllSam31QueuedGpuStartRuntimePort:
          trackAllSam31Runtime.trackAllSam31QueuedGpuStartRuntimePort,
        professionalGpuCloudTaskScheduler:
          trackAllSam31Runtime.professionalGpuCloudTaskScheduler,
        professionalGpuCloudTaskConsumer:
          trackAllSam31Runtime.professionalGpuCloudTaskConsumer,
        trackAllSam31L4TaskQaAuthenticatedStartRuntimePort:
          trackAllSam31Runtime
            .trackAllSam31L4TaskQaAuthenticatedStartRuntimePort,
        trackAllSam31CaptionEvidenceFinalizationRuntimePort:
          trackAllSam31Runtime
            .trackAllSam31CaptionEvidenceFinalizationRuntimePort,
        trackAllSam31TaskQaEvidenceFinalizationRuntimePort:
          trackAllSam31Runtime
            .trackAllSam31TaskQaEvidenceFinalizationRuntimePort,
      }
    : {}),
})
const server = app.listen(env.apiPort, () => {
  console.log(JSON.stringify({
    event: 'api_server_listening',
    port: env.apiPort,
    runtimeMode: env.mode,
    visualIntelligenceRuntimeMode: env.visualIntelligenceRuntimeMode,
    visualIntelligenceSemanticEngine: visualIntelligenceRuntime
      ?.semanticEngine ?? null,
    trackAllSam31RuntimeMode: trackAllSam31Runtime?.runtimeMode ?? null,
  }))
})

let shutdownStarted = false
const shutdown = (signal: NodeJS.Signals) => {
  if (shutdownStarted) return
  shutdownStarted = true

  console.log(JSON.stringify({ event: 'api_server_shutdown_started', signal }))
  const forcedExit = setTimeout(() => {
    console.error(JSON.stringify({ event: 'api_server_shutdown_timeout', signal }))
    process.exit(1)
  }, 10_000)
  forcedExit.unref()

  server.close((error) => {
    clearTimeout(forcedExit)
    if (error) {
      console.error(JSON.stringify({ event: 'api_server_shutdown_failed', signal }))
      process.exitCode = 1
      return
    }

    console.log(JSON.stringify({ event: 'api_server_shutdown_complete', signal }))
  })
}

process.once('SIGTERM', () => shutdown('SIGTERM'))
process.once('SIGINT', () => shutdown('SIGINT'))
