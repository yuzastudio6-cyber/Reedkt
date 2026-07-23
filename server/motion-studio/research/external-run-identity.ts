export type Ms011bExternalAuthorizationId =
  | 'MS-011B-EXT-001'
  | 'MS-011B-EXT-002'
  | 'MS-011B-EXT-003'
  | 'MS-011B-EXT-004'
  | 'MS-011B-EXT-005'
  | 'MS-011B-EXT-006'

export interface Ms011bExternalRunIdentity {
  authorizationId: Ms011bExternalAuthorizationId
  authorityFileSha256: string
  compiledRequestTemplateDigest: string
  ownerAuthorizedAt: string
  authorizationRecordIdPrefix: string
  runId: string
  costEstimateId: string
  costEstimateItemIdPrefix: string
  workItemKey: string
  idempotencyKey: string
  runEventIdPrefix: string
  attemptIntentIdPrefix: string
  attemptIdPrefix: string
  captureIdPrefix: string
  usageIdPrefix: string
  costOutcomeId: string
  actualCostRecordId: string
  reconciliationRecordId: string
  resultBindingIdPrefix: string
  privateEvidenceRootChildPrefix: string
  createCostEstimateRpc: string
  completeAttemptRpc: string
  recordWikipediaEvidenceRpc: string
  recordCommonsEvidenceRpc: string
  finalizeCostRpc: string
}

export const MS011B_EXT001_RUN_IDENTITY = Object.freeze({
  authorizationId: 'MS-011B-EXT-001',
  authorityFileSha256: '65aaa89b808b41f23b884d7505c51a4fb52f8be65340c142eaf69ac497195feb',
  compiledRequestTemplateDigest: '62a88c5e071b944b0ecc5e39e80392fcc40598709f3ef4eb4ea3d08a0d9ed368',
  ownerAuthorizedAt: '2026-07-16T23:45:13.000Z',
  authorizationRecordIdPrefix: 'ms011b-ext-001:',
  runId: 'ms011b-run-001',
  costEstimateId: 'ms011b-cost-estimate',
  costEstimateItemIdPrefix: 'ms011b-cost-item-',
  workItemKey: 'ms011b-public-evidence',
  idempotencyKey: 'ms011b-live-run',
  runEventIdPrefix: 'ms011b-event-',
  attemptIntentIdPrefix: 'ms011b-intent-',
  attemptIdPrefix: 'ms011b-attempt-',
  captureIdPrefix: 'ms011b-capture-',
  usageIdPrefix: 'ms011b-usage-',
  costOutcomeId: 'ms011b-cost-outcome',
  actualCostRecordId: 'ms011b-cost-actual',
  reconciliationRecordId: 'ms011b-cost-reconciliation',
  resultBindingIdPrefix: 'ms011b-binding-',
  privateEvidenceRootChildPrefix: 'MS-011B-EXT-001-',
  createCostEstimateRpc: 'create_motion_studio_ms011b_cost_estimate',
  completeAttemptRpc: 'complete_motion_studio_ms011b_attempt',
  recordWikipediaEvidenceRpc: 'record_motion_studio_ms011b_wikipedia_evidence',
  recordCommonsEvidenceRpc: 'record_motion_studio_ms011b_commons_evidence',
  finalizeCostRpc: 'finalize_motion_studio_ms011b_cost',
} satisfies Ms011bExternalRunIdentity)

export const MS011B_EXT002_RUN_IDENTITY = Object.freeze({
  authorizationId: 'MS-011B-EXT-002',
  authorityFileSha256: '0b5731dc10bc234608768d9387d1f528ca1234195d6076f8623b8cb4f8c51987',
  compiledRequestTemplateDigest: 'a9eb612b865f6e1b43de14cc87de986acae0a6bfae1e7189ed173b1e048070fb',
  ownerAuthorizedAt: '2026-07-17T14:55:07.000Z',
  authorizationRecordIdPrefix: 'ms011b-ext-002:',
  runId: 'ms011b-run-002',
  costEstimateId: 'ms011b-ext-002-cost-estimate',
  costEstimateItemIdPrefix: 'ms011b-ext-002-cost-item-',
  workItemKey: 'ms011b-ext-002-public-evidence',
  idempotencyKey: 'ms011b-ext-002-live-run',
  runEventIdPrefix: 'ms011b-ext-002-event-',
  attemptIntentIdPrefix: 'ms011b-ext-002-intent-',
  attemptIdPrefix: 'ms011b-ext-002-attempt-',
  captureIdPrefix: 'ms011b-ext-002-capture-',
  usageIdPrefix: 'ms011b-ext-002-usage-',
  costOutcomeId: 'ms011b-ext-002-cost-outcome',
  actualCostRecordId: 'ms011b-ext-002-cost-actual',
  reconciliationRecordId: 'ms011b-ext-002-cost-reconciliation',
  resultBindingIdPrefix: 'ms011b-ext-002-binding-',
  privateEvidenceRootChildPrefix: 'MS-011B-EXT-002-',
  createCostEstimateRpc: 'create_motion_studio_ms011b_ext002_cost_estimate',
  completeAttemptRpc: 'complete_motion_studio_ms011b_ext002_attempt',
  recordWikipediaEvidenceRpc: 'record_motion_studio_ms011b_ext002_wikipedia_evidence',
  recordCommonsEvidenceRpc: 'record_motion_studio_ms011b_ext002_commons_evidence',
  finalizeCostRpc: 'finalize_motion_studio_ms011b_ext002_cost',
} satisfies Ms011bExternalRunIdentity)

export const MS011B_EXT003_RUN_IDENTITY = Object.freeze({
  authorizationId: 'MS-011B-EXT-003',
  authorityFileSha256: '47854b788eca361abc2937210ad3efc7d659bffd83f24d71e10b8fd18735569a',
  compiledRequestTemplateDigest: '04fbb5fb77d3db7bcc7458f1af5f4cb0ef352f6d73ab054f77689a90b19ed9cf',
  ownerAuthorizedAt: '2026-07-17T16:37:18.000Z',
  authorizationRecordIdPrefix: 'ms011b-ext-003:',
  runId: 'ms011b-run-003',
  costEstimateId: 'ms011b-ext-003-cost-estimate',
  costEstimateItemIdPrefix: 'ms011b-ext-003-cost-item-',
  workItemKey: 'ms011b-ext-003-public-evidence',
  idempotencyKey: 'ms011b-ext-003-live-run',
  runEventIdPrefix: 'ms011b-ext-003-event-',
  attemptIntentIdPrefix: 'ms011b-ext-003-intent-',
  attemptIdPrefix: 'ms011b-ext-003-attempt-',
  captureIdPrefix: 'ms011b-ext-003-capture-',
  usageIdPrefix: 'ms011b-ext-003-usage-',
  costOutcomeId: 'ms011b-ext-003-cost-outcome',
  actualCostRecordId: 'ms011b-ext-003-cost-actual',
  reconciliationRecordId: 'ms011b-ext-003-cost-reconciliation',
  resultBindingIdPrefix: 'ms011b-ext-003-binding-',
  privateEvidenceRootChildPrefix: 'MS-011B-EXT-003-',
  createCostEstimateRpc: 'create_motion_studio_ms011b_ext003_cost_estimate',
  completeAttemptRpc: 'complete_motion_studio_ms011b_ext003_attempt',
  recordWikipediaEvidenceRpc: 'record_motion_studio_ms011b_ext003_wikipedia_evidence',
  recordCommonsEvidenceRpc: 'record_motion_studio_ms011b_ext003_commons_evidence',
  finalizeCostRpc: 'finalize_motion_studio_ms011b_ext003_cost',
} satisfies Ms011bExternalRunIdentity)

export const MS011B_EXT004_RUN_IDENTITY = Object.freeze({
  authorizationId: 'MS-011B-EXT-004',
  authorityFileSha256: '706780997fb457aa34a0c0339f25f60872acd1e9c948fd0bf84228d3f1668b50',
  compiledRequestTemplateDigest: '80022be880f21978e61e68ebe670b95d52311f94e6e60bbcb6e2f14a5ec356b7',
  ownerAuthorizedAt: '2026-07-17T20:59:38.000Z',
  authorizationRecordIdPrefix: 'ms011b-ext-004:',
  runId: 'ms011b-run-004',
  costEstimateId: 'ms011b-ext-004-cost-estimate',
  costEstimateItemIdPrefix: 'ms011b-ext-004-cost-item-',
  workItemKey: 'ms011b-ext-004-public-evidence',
  idempotencyKey: 'ms011b-ext-004-live-run',
  runEventIdPrefix: 'ms011b-ext-004-event-',
  attemptIntentIdPrefix: 'ms011b-ext-004-intent-',
  attemptIdPrefix: 'ms011b-ext-004-attempt-',
  captureIdPrefix: 'ms011b-ext-004-capture-',
  usageIdPrefix: 'ms011b-ext-004-usage-',
  costOutcomeId: 'ms011b-ext-004-cost-outcome',
  actualCostRecordId: 'ms011b-ext-004-cost-actual',
  reconciliationRecordId: 'ms011b-ext-004-cost-reconciliation',
  resultBindingIdPrefix: 'ms011b-ext-004-binding-',
  privateEvidenceRootChildPrefix: 'MS-011B-EXT-004-',
  createCostEstimateRpc: 'create_motion_studio_ms011b_ext004_cost_estimate',
  completeAttemptRpc: 'complete_motion_studio_ms011b_ext004_attempt',
  recordWikipediaEvidenceRpc: 'record_motion_studio_ms011b_ext004_wikipedia_evidence',
  recordCommonsEvidenceRpc: 'record_motion_studio_ms011b_ext004_commons_evidence',
  finalizeCostRpc: 'finalize_motion_studio_ms011b_ext004_cost',
} satisfies Ms011bExternalRunIdentity)

export const MS011B_EXT005_RUN_IDENTITY = Object.freeze({
  authorizationId: 'MS-011B-EXT-005',
  authorityFileSha256: '79fe900559d8df467d6d8e4529b524a4981e911fb10452c30e973851871adef0',
  compiledRequestTemplateDigest: 'a288da02809ea9ea6ca9662a4a1e2634e8cdde02bf3fcaf34bdcacd04e6e7ddb',
  ownerAuthorizedAt: '2026-07-17T21:35:35.000Z',
  authorizationRecordIdPrefix: 'ms011b-ext-005:',
  runId: 'ms011b-run-005',
  costEstimateId: 'ms011b-ext-005-cost-estimate',
  costEstimateItemIdPrefix: 'ms011b-ext-005-cost-item-',
  workItemKey: 'ms011b-ext-005-public-evidence',
  idempotencyKey: 'ms011b-ext-005-live-run',
  runEventIdPrefix: 'ms011b-ext-005-event-',
  attemptIntentIdPrefix: 'ms011b-ext-005-intent-',
  attemptIdPrefix: 'ms011b-ext-005-attempt-',
  captureIdPrefix: 'ms011b-ext-005-capture-',
  usageIdPrefix: 'ms011b-ext-005-usage-',
  costOutcomeId: 'ms011b-ext-005-cost-outcome',
  actualCostRecordId: 'ms011b-ext-005-cost-actual',
  reconciliationRecordId: 'ms011b-ext-005-cost-reconciliation',
  resultBindingIdPrefix: 'ms011b-ext-005-binding-',
  privateEvidenceRootChildPrefix: 'MS-011B-EXT-005-',
  createCostEstimateRpc: 'create_motion_studio_ms011b_ext005_cost_estimate',
  completeAttemptRpc: 'complete_motion_studio_ms011b_ext005_attempt',
  recordWikipediaEvidenceRpc: 'record_motion_studio_ms011b_ext005_wikipedia_evidence',
  recordCommonsEvidenceRpc: 'record_motion_studio_ms011b_ext005_commons_evidence',
  finalizeCostRpc: 'finalize_motion_studio_ms011b_ext005_cost',
} satisfies Ms011bExternalRunIdentity)

export const MS011B_EXT006_RUN_IDENTITY = Object.freeze({
  authorizationId: 'MS-011B-EXT-006',
  authorityFileSha256: '7c383e0dc9c648a971898e680409046bffee347cf2a013ef1c122bb14643f772',
  compiledRequestTemplateDigest: 'a1b6dfaa10574c93e88511a3229ea95c2497b954bee93380ce7e4b21efc696be',
  ownerAuthorizedAt: '2026-07-17T22:18:38.000Z',
  authorizationRecordIdPrefix: 'ms011b-ext-006:',
  runId: 'ms011b-run-006',
  costEstimateId: 'ms011b-ext-006-cost-estimate',
  costEstimateItemIdPrefix: 'ms011b-ext-006-cost-item-',
  workItemKey: 'ms011b-ext-006-public-evidence',
  idempotencyKey: 'ms011b-ext-006-live-run',
  runEventIdPrefix: 'ms011b-ext-006-event-',
  attemptIntentIdPrefix: 'ms011b-ext-006-intent-',
  attemptIdPrefix: 'ms011b-ext-006-attempt-',
  captureIdPrefix: 'ms011b-ext-006-capture-',
  usageIdPrefix: 'ms011b-ext-006-usage-',
  costOutcomeId: 'ms011b-ext-006-cost-outcome',
  actualCostRecordId: 'ms011b-ext-006-cost-actual',
  reconciliationRecordId: 'ms011b-ext-006-cost-reconciliation',
  resultBindingIdPrefix: 'ms011b-ext-006-binding-',
  privateEvidenceRootChildPrefix: 'MS-011B-EXT-006-',
  createCostEstimateRpc: 'create_motion_studio_ms011b_ext006_cost_estimate',
  completeAttemptRpc: 'complete_motion_studio_ms011b_ext006_attempt',
  recordWikipediaEvidenceRpc: 'record_motion_studio_ms011b_ext006_wikipedia_evidence',
  recordCommonsEvidenceRpc: 'record_motion_studio_ms011b_ext006_commons_evidence',
  finalizeCostRpc: 'finalize_motion_studio_ms011b_ext006_cost',
} satisfies Ms011bExternalRunIdentity)
