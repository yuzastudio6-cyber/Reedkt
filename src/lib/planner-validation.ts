import type { EditPlan, PlannerInput } from '../types/reeditpro'

export function validateMockEditPlan(plan: EditPlan, input: PlannerInput): EditPlan['plannerValidation'] {
  const checks: string[] = []
  const warnings: string[] = []
  const browserIntent = /website|webpage|dashboard|browser|product page|article|evidence page|screen capture|saas|app|ui|checkout|ecommerce/i.test(
    `${input.customInstructions} ${input.workflowType} ${input.referenceUrl}`,
  )

  if (plan.referenceVideoPlan?.referenceProvided) {
    const referenceDNA = plan.referenceVideoPlan.referenceDNA

    if (referenceDNA) {
      checks.push('Reference DNA exists for the provided reference.')
    } else {
      warnings.push('Reference was provided but Reference DNA is missing.')
    }

    if (referenceDNA?.adaptationRules.length) {
      checks.push('Reference adaptation rules exist.')
    } else {
      warnings.push('Reference adaptation rules are missing.')
    }

    if (referenceDNA?.doNotCopyRules.length) {
      checks.push('Reference do-not-copy rules exist.')
    } else {
      warnings.push('Reference do-not-copy rules are missing.')
    }

    if (plan.qaChecks?.some((check) => check.toLowerCase().includes('shot-for-shot'))) {
      checks.push('QA includes no shot-for-shot copy policy.')
    } else {
      warnings.push('QA does not explicitly mention shot-for-shot copy avoidance.')
    }
  }

  const promptText = (plan.providerPromptGuidance ?? []).join(' ').toLowerCase()

  if ((input.editLevel === 'basic' || input.editLevel === 'pro') && promptText.includes('veo')) {
    warnings.push('Basic/Pro plan includes Veo guidance.')
  } else {
    checks.push('Reference did not introduce Veo for Basic/Pro.')
  }

  if (promptText.includes('1080p')) {
    warnings.push('Prompt guidance includes a 1080P default.')
  } else {
    checks.push('Reference did not force a 1080P default.')
  }

  if (plan.approvalRequired) {
    checks.push('Approval remains required.')
  } else {
    warnings.push('Approval gate was removed.')
  }

  checks.push('Reference did not change matching frame/panel background defaults.')

  if (browserIntent && !plan.browserCapturePlan?.active) {
    warnings.push('Browser/app visual opportunity detected but browserCapturePlan is inactive.')
  }

  if (plan.browserCapturePlan?.active) {
    if (plan.browserCapturePlan.items.length) {
      checks.push('Browser capture plan includes at least one item.')
    } else {
      warnings.push('Browser capture plan is active but has no items.')
    }

    for (const item of plan.browserCapturePlan.items) {
      const uploadedOrMockOnly = item.source.sourceType === 'uploaded_screenshot' || item.browserVisualType === 'browser_mockup_frame'

      if (uploadedOrMockOnly || (item.toolIds.includes('playwright') && item.toolIds.includes('sharp') && item.toolIds.includes('remotion'))) {
        checks.push(`${item.title} has the expected browser planning tool chain.`)
      } else {
        warnings.push(`${item.title} is missing Playwright/Sharp/Remotion planning tools.`)
      }

      if (item.toolIds.includes('veo')) {
        warnings.push(`${item.title} incorrectly uses Veo for browser capture.`)
      } else {
        checks.push(`${item.title} does not use Veo for browser capture.`)
      }

      if (item.whyNotAiVideo.toLowerCase().includes('not ai-video') || item.whyNotAiVideo.toLowerCase().includes('not ai video') || item.whyNotAiVideo.toLowerCase().includes('not ai-video invention')) {
        checks.push(`${item.title} explains why exact browser visuals are not AI video.`)
      } else {
        warnings.push(`${item.title} does not explain why exact browser visuals avoid AI video.`)
      }

      if (item.source.permissionStatus && item.source.safeWording) {
        checks.push(`${item.title} includes source permission/status and safe wording.`)
      } else {
        warnings.push(`${item.title} is missing source permission/status or safe wording.`)
      }

      if (item.redaction.privacyRisk === 'medium' || item.redaction.privacyRisk === 'high') {
        if (item.redaction.redactionNeeded && item.redaction.qaChecks.length) {
          checks.push(`${item.title} includes redaction planning for privacy risk.`)
        } else {
          warnings.push(`${item.title} has privacy risk but incomplete redaction planning.`)
        }
      }

      if ((input.workflowType === 'testimonial_case_study' || item.source.evidenceStatus === 'claimed_source' || item.source.evidenceStatus === 'unknown') && item.source.safeWording) {
        checks.push(`${item.title} uses safe wording for uncertain evidence/source status.`)
      }

      if (item.layout.layoutMode && item.layout.captionSafeZone) {
        checks.push(`${item.title} includes browser layout and caption safe zone.`)
      } else {
        warnings.push(`${item.title} is missing browser layout or caption safe zone.`)
      }

      if (item.qaChecks.length) {
        checks.push(`${item.title} includes browser capture QA checks.`)
      } else {
        warnings.push(`${item.title} is missing browser capture QA checks.`)
      }

      if (item.capture.captureMode === 'future_authenticated_capture') {
        warnings.push(`${item.title} mentions future authenticated capture; it must remain future/needs confirmation and not executed.`)
      }

      if (input.editLevel === 'basic' && (item.capture.captureMode === 'scroll_sequence' || item.capture.captureMode === 'step_sequence')) {
        warnings.push('Basic plan includes advanced scroll/step browser capture.')
      }
    }

    if (plan.browserCapturePlan.limitations.some((limitation) => limitation.toLowerCase().includes('mock-only')) && plan.browserCapturePlan.limitations.some((limitation) => limitation.toLowerCase().includes('no playwright'))) {
      checks.push('Browser capture limitations mention mock-only/no browser access.')
    } else {
      warnings.push('Browser capture limitations should mention mock-only and no browser access.')
    }
  }

  return {
    passed: warnings.length === 0,
    checks,
    warnings,
  }
}
