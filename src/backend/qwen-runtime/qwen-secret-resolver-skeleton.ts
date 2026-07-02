import type { QwenDisabledSecretResolverResult } from '../../types'

export function createDisabledQwenSecretResolver() {
  return {
    status: 'disabled' as const,
    canResolveSecretValue: false as const,
    gcloudCommandRun: false as const,
    secretMetadataInspected: false as const,
    summary: 'Qwen Secret Manager resolver is disabled in RP-QWEN-01.',
  }
}

export function resolveQwenSecretValueDisabled(symbolicName: string): QwenDisabledSecretResolverResult {
  return {
    ok: false,
    status: 'blocked',
    symbolicName,
    valueAccessed: false,
    valuePrinted: false,
    gcloudCommandRun: false,
    secretMetadataInspected: false,
    warning: 'RP-QWEN-01 does not resolve Secret Manager values.',
    mockOnly: true,
  }
}

export function createQwenSecretResolverBoundarySummary(result: QwenDisabledSecretResolverResult): string {
  return `Qwen secret resolver blocked for ${result.symbolicName}; valueAccessed false, valuePrinted false, gcloudCommandRun false.`
}
