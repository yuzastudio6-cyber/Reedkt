export const OCR_RUNTIME_EXPECTED_ARTIFACTS = [
  'phase_37c_ocr_runtime_plan.json',
  'phase_37c_ocr_model_asset_verification.json',
  'phase_37c_generated_fixture_manifest.json',
  'phase_37c_ocr_runtime_results.json',
  'phase_37c_ocr_text_match_report.json',
  'phase_37c_ocr_safe_zone_report.json',
  'phase_37c_ocr_runtime_qa_report.json',
  'phase_37c_private_artifact_manifest.json',
  'phase_37c_generated_ocr_runtime_report.json',
] as const

export const OCR_RUNTIME_BLOCKED_SCOPES = [
  'Cloud Run deploy',
  'Docker push',
  'GPU job',
  'real media OCR',
  'real video OCR',
  'caption/render integration',
  'provider execution',
  'public artifact',
  'signed URL source of truth',
  'Track A work',
  'beta unlock',
  'production unlock',
] as const

export function assertOcrRuntimeArtifactName(name: string): void {
  if (!OCR_RUNTIME_EXPECTED_ARTIFACTS.includes(name as typeof OCR_RUNTIME_EXPECTED_ARTIFACTS[number])) {
    throw new Error(`Unexpected Phase 37C artifact name: ${name}`)
  }
}
