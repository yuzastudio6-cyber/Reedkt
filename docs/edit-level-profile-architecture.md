# Edit Level Profile Architecture

This document defines the future `EditLevelProfile` architecture. RP-EDITLEVEL-01 does not implement the runtime type, registry, resolver, API shape, repository, database table, or UI behavior.

## Future Profile Shape

Future implementation should introduce one profile per public level:

```ts
type FutureEditLevelProfile = {
  level: 'normal' | 'premium' | 'ultra_premium'
  legacyLevelAliases: Array<'basic' | 'pro' | 'premium'>
  displayName: 'Normal' | 'Premium' | 'Ultra Premium'
  shortPromise: string
  userFacingDescription: string
  analysisDepth: 'standard' | 'deep' | 'studio'
  qwenReasoningDepth: 'standard' | 'deep' | 'multi_pass'
  qwen25vlVisualDepth: 'targeted' | 'key_moments' | 'scene_level'
  transcriptPolicy: 'optional_targeted' | 'recommended_when_speech_exists' | 'required_when_speech_exists'
  audioPolicy: 'basic_professional' | 'recommended_sound_polish' | 'sound_design_planning'
  graphicsPolicy: 'safe_basic' | 'styled_cards' | 'advanced_graphic_direction'
  editBriefPolicy: 'optional' | 'recommended' | 'strongly_recommended'
  editPreferencePolicy: 'safe_hints' | 'strong_application' | 'deep_application_with_qa'
  sourceUnderstandingPolicy: 'basic_metadata' | 'source_understanding_package' | 'deep_source_understanding'
  qaProfile: 'normal' | 'premium' | 'ultra_premium'
  estimateProfile: 'minimal' | 'medium' | 'highest'
  planComplexity: 'low' | 'medium' | 'high'
  toolBudget: 'minimal' | 'medium' | 'highest'
  renderPassBudgetFuture: 'basic' | 'medium' | 'highest'
  revisionBudgetFuture: 'basic' | 'medium' | 'highest'
  variantBudgetFuture: 'basic' | 'medium' | 'highest'
  creditEstimateMultiplier: string
  timeEstimateMultiplier: string
  fallbackPolicy: string
  degradedCapabilityNotice: string
  readiness: {
    mockOnly: boolean
    betaReady: boolean
    productionReady: boolean
  }
}
```

## Profile Responsibilities

The profile should be the source of truth for public labels, legacy basic/pro/premium compatibility, Qwen 3.7 reasoning depth, Qwen2.5-VL visual depth, source understanding, Edit Brief handling, Edit Preference/DNA use, QA profile, estimate policy, tool budget, fallback policy, and degraded capability notices.

## Non-Responsibilities

The profile should not execute tools, call providers, run media analysis, reserve credits, render/export, or start progress. Credit estimate only fields and render budget future fields are metadata until future approved backend gates exist.

## Runtime Boundary

No runtime implementation is added in RP-EDITLEVEL-01. The next milestone, RP-EDITLEVEL-02, should add types, profiles, and mock fixtures only after this architecture is accepted.
