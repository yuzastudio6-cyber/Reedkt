import {
  REEDITPRO_QWEN_MAIN_BRAIN_LABEL,
  REEDITPRO_QWEN_MAIN_BRAIN_PROVIDER_NAME,
  type QwenSecretReference,
} from '../../types'
import { ok, type ServiceResult } from '../service-result'

export const QWEN_SYMBOLIC_SECRET_NAMES = [
  'QWEN_REASONING_API_KEY_SECRET',
  'QWEN_REASONING_BASE_URL_SECRET',
  'QWEN_RUNTIME_CONFIG_SECRET',
] as const

export type QwenSymbolicSecretName = typeof QWEN_SYMBOLIC_SECRET_NAMES[number]

const purposeBySymbolicName: Record<QwenSymbolicSecretName, QwenSecretReference['purpose']> = {
  QWEN_REASONING_API_KEY_SECRET: 'reasoning_api_key',
  QWEN_REASONING_BASE_URL_SECRET: 'reasoning_base_url',
  QWEN_RUNTIME_CONFIG_SECRET: 'runtime_config',
}

export function createQwenSecretReference(symbolicName: QwenSymbolicSecretName): QwenSecretReference {
  return {
    id: `qwen-secret-reference-${symbolicName.toLowerCase().replace(/_/g, '-')}`,
    providerName: REEDITPRO_QWEN_MAIN_BRAIN_PROVIDER_NAME,
    purpose: purposeBySymbolicName[symbolicName],
    referenceStatus: 'symbolic_reference_only',
    symbolicName,
    valueAccessed: false,
    valuePrinted: false,
    frontendVisible: false,
    mockOnly: true,
    warnings: [
      'Symbolic reference only; no Secret Manager metadata or value was inspected.',
      'Frontend visibility is false.',
    ],
  }
}

export function listQwenRequiredSecretReferences(): QwenSecretReference[] {
  return QWEN_SYMBOLIC_SECRET_NAMES.map(createQwenSecretReference)
}

export function createQwenSecretReferenceSummary(references: QwenSecretReference[]): string {
  return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} symbolic secret references: ${references.length}. Values accessed: false. Values printed: false. Frontend visible: false.`
}

export function validateQwenSecretReferenceIsSymbolicOnly(reference: QwenSecretReference): ServiceResult<{
  ok: boolean
  warnings: string[]
}> {
  const okResult = reference.referenceStatus === 'symbolic_reference_only'
    && reference.valueAccessed === false
    && reference.valuePrinted === false
    && reference.frontendVisible === false

  return ok({
    ok: okResult,
    warnings: okResult
      ? ['Qwen secret reference is symbolic only.']
      : ['Qwen secret reference is not safe for RP-QWEN-01.'],
  })
}
