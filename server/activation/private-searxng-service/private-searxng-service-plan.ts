import {
  privateSearxngArtifactPrefix,
  privateSearxngSafetyFlags,
  privateSearxngServiceConfig,
} from './private-searxng-service-policy'
import type { PrivateSearxngServicePlan } from './private-searxng-service-types'

export function buildPrivateSearxngServicePlan(input: { runId: string }): PrivateSearxngServicePlan {
  return {
    planId: 'phase49f-private-searxng-service-plan',
    runId: input.runId,
    serviceName: privateSearxngServiceConfig.serviceName,
    serviceMode: privateSearxngServiceConfig.serviceMode,
    provider: 'searxng',
    controlledQuery: privateSearxngServiceConfig.controlledQuery,
    maxResults: privateSearxngServiceConfig.maxResults,
    rawPromptExecution: false,
    approvedPlanSnapshot: true,
    image: {
      repository: privateSearxngServiceConfig.imageRepository,
      tag: privateSearxngServiceConfig.imageTag,
      targetImage: privateSearxngServiceConfig.targetImage,
      officialBaseImage: privateSearxngServiceConfig.officialSearxngImage,
      officialIndexDigest: privateSearxngServiceConfig.officialSearxngIndexDigest,
      officialAmd64Digest: privateSearxngServiceConfig.officialSearxngAmd64Digest,
    },
    runtime: {
      cpuOnly: true,
      cpu: privateSearxngServiceConfig.cpu,
      memory: privateSearxngServiceConfig.memory,
      minInstances: privateSearxngServiceConfig.minInstances,
      maxInstances: privateSearxngServiceConfig.maxInstances,
      containerPort: privateSearxngServiceConfig.containerPort,
      unauthenticatedAccessAllowed: false,
    },
    outputPrefixes: {
      generatedAssets: `gs://${privateSearxngServiceConfig.generatedAssetsBucket}/${privateSearxngArtifactPrefix(input.runId)}/`,
      qaArtifacts: `gs://${privateSearxngServiceConfig.qaBucket}/${privateSearxngArtifactPrefix(input.runId)}/`,
    },
    safety: privateSearxngSafetyFlags,
  }
}
