import { privateSearxngArtifactPrefix, privateSearxngSafetyFlags, privateSearxngServiceConfig } from './private-searxng-service-policy'
import type { PrivateSearxngPlan } from './private-searxng-service-types'

export function buildPrivateSearxngServicePlan(input: { runId: string }): PrivateSearxngPlan {
  return {
    planId: 'phase49f-private-searxng-service-plan',
    runId: input.runId,
    serviceName: privateSearxngServiceConfig.serviceName,
    serviceMode: privateSearxngServiceConfig.serviceMode,
    provider: 'searxng',
    controlledQuery: privateSearxngServiceConfig.controlledQuery,
    maxResults: 5,
    rawPromptExecution: false,
    approvedPlanSnapshot: true,
    image: {
      targetImage: privateSearxngServiceConfig.targetImage,
      officialBaseImage: privateSearxngServiceConfig.officialSearxngImage,
      officialIndexDigest: privateSearxngServiceConfig.officialSearxngIndexDigest,
      officialAmd64Digest: privateSearxngServiceConfig.officialSearxngAmd64Digest,
    },
    runtime: {
      cpuOnly: true,
      cpu: '1',
      memory: '1Gi',
      minInstances: '0',
      maxInstances: '1',
      containerPort: '8080',
      unauthenticatedAccessAllowed: false,
    },
    outputPrefixes: {
      generatedAssets: `gs://${privateSearxngServiceConfig.generatedAssetsBucket}/${privateSearxngArtifactPrefix(input.runId)}/`,
      qaArtifacts: `gs://${privateSearxngServiceConfig.qaBucket}/${privateSearxngArtifactPrefix(input.runId)}/`,
    },
    safety: privateSearxngSafetyFlags,
  }
}
