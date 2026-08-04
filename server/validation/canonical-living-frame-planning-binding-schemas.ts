import { z } from 'zod'

import {
  LIVING_FRAME_CLOSED_GATE_CODES,
} from '../../src/types/living-frame'
import {
  livingFrameProfessionalSkillComponentSchema,
} from '../../src/lib/living-frame/living-frame-contract'

export const CANONICAL_LIVING_FRAME_COMPONENT_KEY = 'livingFrame' as const

export const canonicalLivingFramePlanningBindingSchema =
  livingFrameProfessionalSkillComponentSchema.superRefine(
    (component, context) => {
      if (
        component.status !== 'deferred'
        || component.decisionSummary.decision !== 'deferred'
        || component.decisionSummary.reasonCode !==
          'capability_qualification_required'
        || component.decisionSummary.selectedMode !== null
        || component.decisionSummary.rejectedConcepts.length !== 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['decisionSummary'],
          message:
            'Canonical Living Frame v1 admits only one deferred expectation decision.',
        })
      }
      if (
        component.scenePlans.length !== 0
        || component.continuityPackRefs.length !== 0
        || component.capabilityRequirements.length !== 0
        || component.qaExpectationCodes.length !== 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scenePlans'],
          message:
            'Canonical Living Frame v1 cannot carry scene, capability, continuity, or QA payloads.',
        })
      }
      const estimate = component.estimateInputs
      if (
        estimate.sceneCount !== 0
        || estimate.componentCount !== 0
        || estimate.generatedStillCount !== 0
        || estimate.deterministicDrawCount !== 0
        || estimate.stillAlphaCount !== 0
        || estimate.temporalMaskCount !== 0
        || estimate.semanticTimingRequestCount !== 0
        || estimate.soundRequestCount !== 0
        || estimate.qaExpectationCount !== 0
        || estimate.continuityReferenceCount !== 0
        || estimate.motionComplexity !== 'none'
        || estimate.cameraComplexity !== 'none'
        || estimate.controlledIllustrationComplexity !== 'none'
        || estimate.generatedVideoExpectation !== 'not_required'
        || estimate.pricingAuthorityProvided !== false
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['estimateInputs'],
          message:
            'Canonical Living Frame v1 carries no estimate or complexity payload.',
        })
      }
      if (
        component.inputBindings.compiledIntent.evidenceClass !==
          'controlled_unverified_evidence'
        || component.inputBindings.sourceSequence.evidenceClass !==
          'controlled_unverified_evidence'
        || component.inputBindings.outputFrame.evidenceClass !==
          'controlled_unverified_evidence'
        || component.inputBindings.masterTiming.evidenceClass !==
          'controlled_unverified_evidence'
        || component.inputBindings.videoUnderstanding.evidenceClass !==
          'future_worker_evidence_required'
        || component.inputBindings.adaptiveStrategy.evidenceClass !==
          'future_worker_evidence_required'
        || component.inputBindings.segmentExpectations.some(
          (segment) =>
            segment.sourceSegmentRef.evidenceClass !==
              'controlled_unverified_evidence',
        )
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['inputBindings'],
          message:
            'Canonical Living Frame v1 evidence remains controlled, unverified, or future-required.',
        })
      }
      if (
        component.inputBindings.safeZoneRefs.length !== 0
        || component.inputBindings.faceProtectionRefs.length !== 0
        || component.inputBindings.gestureProtectionRefs.length !== 0
        || component.inputBindings.factSafetyRefs.length !== 0
        || component.inputBindings.characterSafetyRefs.length !== 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['inputBindings'],
          message:
            'Canonical Living Frame v1 cannot claim downstream safety evidence.',
        })
      }
      if (
        LIVING_FRAME_CLOSED_GATE_CODES.some(
          (gate) => !component.closedGateCodes.includes(gate),
        )
        || component.closedGateCodes.length !==
          LIVING_FRAME_CLOSED_GATE_CODES.length
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['closedGateCodes'],
          message: 'Every Living Frame v1 execution gate must remain closed.',
        })
      }
    },
  )

export type CanonicalLivingFramePlanningBinding = z.infer<
  typeof canonicalLivingFramePlanningBindingSchema
>
