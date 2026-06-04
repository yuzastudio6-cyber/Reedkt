# Edit Intent Schema

Edit intents translate findings into possible actions. They are still planning records, not worker instructions.

Required fields:

- `intentId`
- `agentId`
- `intentType`
- `targetScope`
- `evidenceRefs`
- `rationale`
- `proposedToolFamily`
- `requiredCapabilities`
- `estimatedCostClass`
- `riskLevel`
- `privacyImpact`
- `userApprovalRequired`
- `blocked`
- `blockedReason`
- `allowedInInternalTesting`
- `allowedInExternalBeta`
- `allowedInProduction`

Canonical example intent types include conservative color adjustment, caption burn-in preview, text-behind-subject preview, route map overlay, location context card, voiceover generation, noise cleanup, motion graphics lower third, slow-motion segment, and web research planning context.
