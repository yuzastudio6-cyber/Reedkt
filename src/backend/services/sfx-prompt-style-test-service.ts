import type {
  SFXPromptAdapterTestRecord,
  SFXPromptStyle,
  SFXProvider,
} from '../../types'
import type { SfxUseCase } from '../../types/audio-music'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

export function createSFXPromptAdapterTest(
  db: MockDatabase,
  input: {
    provider: SFXProvider
    modelName: string
    promptStyle: SFXPromptStyle
    testPrompt: string
    expectedUseCase: SfxUseCase
    notes?: string[]
  },
): ServiceResult<SFXPromptAdapterTestRecord> {
  return ok(insertMockRecord(db, 'sfxPromptAdapterTests', {
    id: createMockId('sfx-prompt-adapter-test'),
    provider: input.provider,
    modelName: input.modelName,
    promptStyle: input.promptStyle,
    testPrompt: input.testPrompt,
    expectedUseCase: input.expectedUseCase,
    notes: input.notes ?? ['Mock prompt adapter test only; no provider call is made.'],
    status: 'planned',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noProviderCall: true },
  }))
}

export function createMireloPromptStyleTestMatrix(db: MockDatabase): ServiceResult<SFXPromptAdapterTestRecord[]> {
  const prompts: Array<Parameters<typeof createSFXPromptAdapterTest>[1]> = [
    {
      provider: 'mirelo_sfx_v1_5',
      modelName: 'mirelo-sfx-v1.5',
      promptStyle: 'simple_keyword',
      testPrompt: 'premium transition whoosh',
      expectedUseCase: 'transition_soft_whoosh',
    },
    {
      provider: 'mirelo_sfx_v1_5',
      modelName: 'mirelo-sfx-v1.5',
      promptStyle: 'short_phrase',
      testPrompt: 'Soft premium transition whoosh, clean airy movement.',
      expectedUseCase: 'transition_soft_whoosh',
    },
    {
      provider: 'mirelo_sfx_v1_5',
      modelName: 'mirelo-sfx-v1.5',
      promptStyle: 'tag_list',
      testPrompt: 'soft, premium, transition, whoosh, airy, short-tail',
      expectedUseCase: 'transition_soft_whoosh',
    },
    {
      provider: 'mirelo_sfx_v1_5',
      modelName: 'mirelo-sfx-v1.5',
      promptStyle: 'structured_sentence',
      testPrompt: 'Soft premium transition whoosh, clean airy movement, subtle luxury tone, short smooth tail, no harsh riser.',
      expectedUseCase: 'transition_soft_whoosh',
    },
  ]

  return ok(prompts.map((prompt) => createSFXPromptAdapterTest(db, prompt)).map((result) => {
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }))
}

export function createMMAudioPromptLengthTestMatrix(db: MockDatabase): ServiceResult<SFXPromptAdapterTestRecord[]> {
  const prompts: Array<Parameters<typeof createSFXPromptAdapterTest>[1]> = [
    {
      provider: 'mmaudio_v',
      modelName: 'mmaudio-v',
      promptStyle: 'video_conditioned_short_prompt',
      testPrompt: 'soft whoosh',
      expectedUseCase: 'transition_soft_whoosh',
    },
    {
      provider: 'mmaudio_v',
      modelName: 'mmaudio-v',
      promptStyle: 'video_conditioned_short_prompt',
      testPrompt: 'subtle graphic reveal sound',
      expectedUseCase: 'graphic_card_reveal',
    },
    {
      provider: 'mmaudio_v',
      modelName: 'mmaudio-v',
      promptStyle: 'video_conditioned_short_prompt',
      testPrompt: 'gentle line drawing sound',
      expectedUseCase: 'stroke_line_trace',
    },
  ]

  return ok(prompts.map((prompt) => createSFXPromptAdapterTest(db, prompt)).map((result) => {
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }))
}

export function summarizePromptStyleTestPlan(records: SFXPromptAdapterTestRecord[]): string {
  return `${records.length} mock SFX prompt adapter tests planned; no provider calls are included.`
}
