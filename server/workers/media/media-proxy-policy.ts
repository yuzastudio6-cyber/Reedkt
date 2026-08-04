import { REEDITPRO_ANALYSIS_PROXY_POLICY } from '../../../src/types/large-media'

const HDR_TRANSFERS = new Set(['smpte2084', 'arib-std-b67'])
const WIDE_GAMUT_PRIMARIES = new Set(['bt2020', 'smpte431', 'smpte432'])

export interface SourceVideoColorMetadata {
  pixelFormat?: string
  colorSpace?: string
  colorTransfer?: string
  colorPrimaries?: string
  colorRange?: string
  bitsPerRawSample?: number
}

export type AnalysisProxyColorDecision =
  | {
      status: 'ready'
      mode: 'sdr_rec709'
      profileId: typeof REEDITPRO_ANALYSIS_PROXY_POLICY.id
      sourceDynamicRange: 'sdr'
      sourceColorAssumption: 'declared_rec709' | 'untagged_sdr_rec709_assumption'
      outputColorSpace: 'bt709'
      originalMasterPreserved: true
      warning?: string
    }
  | {
      status: 'requires_color_managed_runtime'
      mode: 'hdr_or_wide_gamut_review'
      profileId: typeof REEDITPRO_ANALYSIS_PROXY_POLICY.id
      sourceDynamicRange: 'hdr' | 'wide_gamut_or_unknown'
      outputColorSpace: 'bt709'
      originalMasterPreserved: true
      reasonCode: 'hdr_tonemap_required' | 'wide_gamut_transform_required'
      message: string
    }

/**
 * The browser-compatible proxy is explicitly Rec.709 SDR. HDR and wide-gamut
 * sources must not be pushed through that path until a color-managed transform
 * runtime and visual QA are proven. The immutable source remains authoritative
 * in every case.
 */
export function resolveAnalysisProxyColorDecision(
  source: SourceVideoColorMetadata | undefined,
): AnalysisProxyColorDecision {
  const colorTransfer = normalized(source?.colorTransfer)
  const colorPrimaries = normalized(source?.colorPrimaries)
  const colorSpace = normalized(source?.colorSpace)
  const hdrDetected = colorTransfer !== undefined && HDR_TRANSFERS.has(colorTransfer)
  const wideGamutDetected = (
    (colorPrimaries !== undefined && WIDE_GAMUT_PRIMARIES.has(colorPrimaries)) ||
    colorSpace?.startsWith('bt2020') === true
  )

  if (hdrDetected) {
    return {
      status: 'requires_color_managed_runtime',
      mode: 'hdr_or_wide_gamut_review',
      profileId: REEDITPRO_ANALYSIS_PROXY_POLICY.id,
      sourceDynamicRange: 'hdr',
      outputColorSpace: 'bt709',
      originalMasterPreserved: true,
      reasonCode: 'hdr_tonemap_required',
      message: 'HDR source requires a validated color-managed tone-map before a Rec.709 analysis proxy can be created.',
    }
  }

  if (wideGamutDetected) {
    return {
      status: 'requires_color_managed_runtime',
      mode: 'hdr_or_wide_gamut_review',
      profileId: REEDITPRO_ANALYSIS_PROXY_POLICY.id,
      sourceDynamicRange: 'wide_gamut_or_unknown',
      outputColorSpace: 'bt709',
      originalMasterPreserved: true,
      reasonCode: 'wide_gamut_transform_required',
      message: 'Wide-gamut source requires a validated color-managed transform before a Rec.709 analysis proxy can be created.',
    }
  }

  const rec709Declared = [colorSpace, colorPrimaries].some((value) => value === 'bt709')
  return {
    status: 'ready',
    mode: 'sdr_rec709',
    profileId: REEDITPRO_ANALYSIS_PROXY_POLICY.id,
    sourceDynamicRange: 'sdr',
    sourceColorAssumption: rec709Declared ? 'declared_rec709' : 'untagged_sdr_rec709_assumption',
    outputColorSpace: 'bt709',
    originalMasterPreserved: true,
    ...(!rec709Declared ? {
      warning: 'Source has no recognized wide-gamut/HDR declaration; the working proxy uses a reviewable Rec.709 SDR assumption while the original remains unchanged.',
    } : {}),
  }
}

function normalized(value: string | undefined): string | undefined {
  const result = value?.trim().toLowerCase()
  return result || undefined
}
