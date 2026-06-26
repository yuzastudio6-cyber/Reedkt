import { buildAiGraphicsBetaActivationGapReport } from '../tool-registry/ai-graphics-beta-activation-gap-report'

const report = buildAiGraphicsBetaActivationGapReport()

console.log(JSON.stringify({
  ...report,
  input: {
    reportOnly: true,
    duplicateSearchPerformed: true,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
  },
}, null, 2))
