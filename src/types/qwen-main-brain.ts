export const REEDITPRO_QWEN_MAIN_BRAIN_PROVIDER_NAME = 'qwen_3_7' as const
export const REEDITPRO_QWEN_MAIN_BRAIN_LABEL = 'Qwen 3.7 Max' as const
export const REEDITPRO_QWEN_MAIN_BRAIN_ROLE_LABEL = 'backend-only reasoning brain' as const

export type ReeditProQwenMainBrainProviderName = typeof REEDITPRO_QWEN_MAIN_BRAIN_PROVIDER_NAME

export function createReeditProQwenMainBrainSummary(): string {
  return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} is ReEditPro's ${REEDITPRO_QWEN_MAIN_BRAIN_ROLE_LABEL}.`
}
