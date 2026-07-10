import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createQwenVisualUnderstandingProvider } from '../services/qwen-visual-understanding-provider'

const root = await mkdtemp(path.join(tmpdir(), 'reeditpro-visual-provider-smoke-'))
const framePath = path.join(root, 'representative-001.jpg')

try {
  await writeFile(framePath, Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=', 'base64'))

  let postedBody: Record<string, unknown> | undefined
  const provider = createQwenVisualUnderstandingProvider({
    env: {
      REEDITPRO_QWEN_VISUAL_RUNTIME_MODE: 'internal_enabled',
      QWEN_VISUAL_RUNTIME_URL: 'https://visual-runtime.invalid/analyze',
      QWEN_VISUAL_RUNTIME_AUDIENCE: 'https://visual-runtime.invalid',
    },
    authenticatedPost: async ({ body }) => {
      postedBody = body
      return {
        status: 200,
        data: {
          schemaVersion: 'reeditpro-visual-understanding-v1',
          summary: 'A centered speaker with clear upper-right negative space and a lower-center product label.',
          visibleSubjects: ['centered speaker'],
          visibleObjects: ['laptop'],
          screenTextRegions: ['lower-center product label'],
          compositionRisks: ['avoid lower-center caption collision'],
          brollOpportunities: ['workflow explainer beside the speaker'],
          captionObservations: ['bold white two-line captions near the lower safe zone'],
          styleObservations: ['restrained cyan accent labels'],
          frameEvidence: [{
            frameId: 'frame-smoke-1',
            timeSeconds: 1.5,
            summary: 'Centered speaker and laptop.',
            visibleSubjects: ['speaker'],
            visibleObjects: ['laptop'],
            textLikeRegions: ['lower-center label'],
            safeZones: ['upper-right'],
            uncertainty: [],
          }],
          model: {
            modelId: 'Qwen/Qwen2.5-VL-7B-Instruct',
            modelRevision: 'cc594898137f460bfe9f0759e9844b3ce807cfb5',
            modelAggregateSha256: '46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b',
          },
          generatedAssetsCreated: false,
          publicArtifactsCreated: false,
          signedUrlsCreated: false,
        },
      }
    },
  })
  const result = await provider.analyze({
    workspaceId: 'workspace-smoke',
    projectId: 'project-smoke',
    editSessionId: 'edit-smoke',
    mediaAssetId: 'media-smoke',
    analysisRole: 'source_edit_planning',
    frameArtifacts: [{
      artifactId: 'frame-smoke-1',
      localFilePath: framePath,
      timeSeconds: 1.5,
    }],
  })
  assert.equal(result.status, 'completed')
  assert.deepEqual(result.evidenceArtifactIds, ['frame-smoke-1'])
  assert.ok(postedBody)
  assert.equal(JSON.stringify(postedBody).includes('This raw prompt must never'), false)
  assert.equal(JSON.stringify(postedBody).includes('imageBase64'), true)
  assert.equal((postedBody?.safety as Record<string, unknown>).rawPromptIncluded, false)

  let blockedCallMade = false
  const blockedProvider = createQwenVisualUnderstandingProvider({
    env: {},
    authenticatedPost: async () => {
      blockedCallMade = true
      return { status: 500, data: {} }
    },
  })
  const blocked = await blockedProvider.analyze({
    workspaceId: 'workspace-smoke',
    projectId: 'project-smoke',
    editSessionId: 'edit-smoke',
    mediaAssetId: 'media-smoke',
    analysisRole: 'source_edit_planning',
    frameArtifacts: [{ artifactId: 'frame-smoke-1', localFilePath: framePath }],
  })
  assert.equal(blocked.status, 'blocked')
  assert.equal(blockedCallMade, false)
  assert.deepEqual(blocked.blockers, ['qwen_visual_runtime_not_configured'])

  const invalidProvider = createQwenVisualUnderstandingProvider({
    env: {
      REEDITPRO_QWEN_VISUAL_RUNTIME_MODE: 'internal_enabled',
      QWEN_VISUAL_RUNTIME_URL: 'https://visual-runtime.invalid/analyze',
    },
    authenticatedPost: async () => ({ status: 200, data: { summary: 'missing schema' } }),
  })
  const invalid = await invalidProvider.analyze({
    workspaceId: 'workspace-smoke',
    projectId: 'project-smoke',
    editSessionId: 'edit-smoke',
    mediaAssetId: 'media-smoke',
    analysisRole: 'source_edit_planning',
    frameArtifacts: [{ artifactId: 'frame-smoke-1', localFilePath: framePath }],
  })
  assert.equal(invalid.status, 'blocked')
  assert.deepEqual(invalid.blockers, ['qwen_visual_runtime_invalid_response'])

  console.log(JSON.stringify({
    ok: true,
    decision: 'qwen_visual_understanding_provider_contract_passed',
    checks: {
      privateFramePayloadBuilt: true,
      rawPromptExcluded: true,
      identityAwareTransportInjectable: true,
      missingConfigBlockedBeforeCall: true,
      invalidResponseRejected: true,
    },
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}
