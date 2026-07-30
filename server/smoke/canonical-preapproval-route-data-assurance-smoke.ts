import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  REEDITPRO_REASONING_MODEL_ROUTE_IDS,
  type ReEditProActiveReasoningModelRouteId,
} from '../../src/types/reasoning-model-routing'
import {
  canonicalPreapprovalRouteDataAssuranceBindingSchema,
  createCanonicalPreapprovalModelDataRequestClassification,
  createCanonicalPreapprovalModelRouteDataAssurance,
  createCanonicalPreapprovalPolicyEvidence,
  createCanonicalPreapprovalProjectModelDataPolicy,
  createCanonicalPreapprovalRouteDataAssuranceBinding,
  type CanonicalPreapprovalModelDataRequestClassification,
  type CanonicalPreapprovalModelRouteDataAssurance,
  type CanonicalPreapprovalProjectModelDataPolicy,
  verifyCanonicalPreapprovalRouteDataAssuranceBinding,
} from '../model-data-assurance/canonical-preapproval-route-data-assurance-contract'
import {
  deriveCanonicalPreapprovalRouteDataAssuranceLocator,
  PrivateCanonicalPreapprovalRouteDataAssuranceRepository,
} from '../model-data-assurance/private-canonical-preapproval-route-data-assurance-repository'
import {
  CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_READER_RESULT_VERSION,
  CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_SOURCE_LOCATOR_VERSION,
  createCanonicalPreapprovalRouteDataAssuranceReader,
  createCanonicalPreapprovalRouteDataAssuranceReaderResult,
  type CanonicalPreapprovalRouteDataAssuranceContext,
  type CanonicalPreapprovalRouteDataAssuranceReaderPort,
  persistCanonicalPreapprovalRouteDataAssurance,
  readCurrentCanonicalPreapprovalRouteDataAssurance,
} from '../services/canonical-preapproval-route-data-assurance-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const WORKSPACE_ID = 'workspace-route-data-smoke'
const PROJECT_ID = 'project-route-data-smoke'
const EDIT_SESSION_ID = 'edit-route-data-smoke'
const REQUEST_DIGEST = digest('route-data-request')
const SOURCE_LOCATOR_ID = 'route-data-source-locator-smoke'
const SNAPSHOT_ID = 'route-data-source-snapshot-smoke-v1'
const REGION_ID = 'verified-provider-region'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-route-data-'))
const repository =
  new PrivateCanonicalPreapprovalRouteDataAssuranceRepository()
const repositoryScope = {
  localStorageRoot: root,
  ownerUserId: 'owner-route-data-smoke',
  workspaceId: WORKSPACE_ID,
}
const canonicalContext = context()

try {
  const allowedFixture = fixture()
  const helperResult =
    createCanonicalPreapprovalRouteDataAssuranceReaderResult({
      serverOwnedLocatorId: SOURCE_LOCATOR_ID,
      evidenceSnapshotId: SNAPSHOT_ID,
      evidenceRevision: 1,
      evaluatedAt: allowedFixture.evaluatedAt,
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      requestDigestSha256: REQUEST_DIGEST,
      projectPolicy: allowedFixture.projectPolicy,
      requestClassification: allowedFixture.requestClassification,
      routeAssurances: allowedFixture.routeAssurances,
    })
  assert.equal(helperResult.routeAssuranceCount, 3)
  const {
    readerResultDigestSha256: helperDigest,
    ...helperDraft
  } = helperResult
  assert.equal(helperDigest, sha256AuthorityValue(helperDraft))

  const persisted = await persistCanonicalPreapprovalRouteDataAssurance(
    persistenceInput({ fixture: allowedFixture }),
  )
  assert.equal(persisted.disposition, 'created')
  assert.equal(
    persisted.persistence,
    'backend_local_private_content_addressed',
  )
  assert.equal(persisted.providerCallMade, false)
  assert.equal(persisted.credentialReadMade, false)
  assert.equal(persisted.customerCreditsMutated, false)
  assert.equal(persisted.remoteMutationMade, false)

  const binding = await readCurrentCanonicalPreapprovalRouteDataAssurance({
    repositoryScope,
    canonicalContext,
    locator: persisted.locator,
    repository,
  })
  assert.equal(binding.status, 'ready_for_provider_envelope')
  assert.equal(binding.allRoutesAllowed, true)
  assert.equal(binding.requiresReview, false)
  assert.deepEqual(
    binding.orderedRouteIds,
    REEDITPRO_REASONING_MODEL_ROUTE_IDS,
  )
  assert.deepEqual(
    binding.routeDecisions.map((decision) => decision.eligibility),
    ['allowed', 'allowed', 'allowed'],
  )
  assert.deepEqual(
    binding.routeDecisions.map((decision) => decision.reasonCodes),
    [['route_allowed'], ['route_allowed'], ['route_allowed']],
  )
  assert.equal(binding.providerEnvelopeDigestSha256, null)
  assert.equal(binding.providerTransportAuthorized, false)
  assert.equal(binding.providerCallMade, false)
  assert.equal(binding.authorityBoundary.routeDataAssuranceOnly, true)
  assert.equal(binding.authorityBoundary.providerCallAuthority, false)
  assert.equal(binding.authorityBoundary.customerCreditAuthority, false)
  assert.equal(binding.authorityBoundary.selectedSceneAuthority, false)
  assert.equal(binding.authorityBoundary.productionReady, false)
  assert.deepEqual(binding.requestClassification.requestedModalities, ['text'])
  assert.equal(binding.requestClassification.rawMediaIncluded, false)
  assert.equal(binding.requestClassification.rawTranscriptIncluded, false)
  assert.equal(binding.requestClassification.browserCaptureIncluded, false)

  const replay = await persistCanonicalPreapprovalRouteDataAssurance(
    persistenceInput({ fixture: allowedFixture }),
  )
  assert.equal(replay.disposition, 'idempotent_replay')
  assert.equal(replay.packageDigestSha256, persisted.packageDigestSha256)

  await expectRejects(
    () => persistCanonicalPreapprovalRouteDataAssurance({
      ...persistenceInput({ fixture: allowedFixture }),
      reader: null,
    }),
    'missing process-bound reader',
  )
  const forgedReader = {
    schemaVersion: 'canonical-preapproval-route-data-assurance-reader-v1',
    sourceAuthority:
      'canonical_private_route_data_assurance_repository',
    evidenceClass:
      'process_bound_private_route_data_assurance_reader',
    productionReady: false,
    callerSuppliedPolicyAccepted: false,
    readCurrentByServerOwnedLocator: async () => createReaderResult({
      fixture: allowedFixture,
    }),
  } as CanonicalPreapprovalRouteDataAssuranceReaderPort
  await expectRejects(
    () => persistCanonicalPreapprovalRouteDataAssurance({
      ...persistenceInput({ fixture: allowedFixture }),
      reader: forgedReader,
    }),
    'structurally forged reader',
  )
  await expectRejects(
    () => persistCanonicalPreapprovalRouteDataAssurance({
      ...persistenceInput({ fixture: allowedFixture }),
      sourceAssuranceLocator: {
        schemaVersion:
          CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_SOURCE_LOCATOR_VERSION,
        serverOwnedLocatorId: SOURCE_LOCATOR_ID,
        projectPolicy: allowedFixture.projectPolicy,
      },
    }),
    'caller policy injected through locator',
  )
  await expectRejects(
    () => persistCanonicalPreapprovalRouteDataAssurance(
      persistenceInput({
        fixture: allowedFixture,
        reader: createReader({
          fixture: allowedFixture,
          resultFactory: () => createReaderResult({
            fixture: allowedFixture,
            identityOverrides: {
              workspaceId: 'workspace-route-data-foreign',
            },
          }),
        }),
      }),
    ),
    'wrong tenant reader result',
  )
  await expectRejects(
    () => persistCanonicalPreapprovalRouteDataAssurance(
      persistenceInput({
        fixture: allowedFixture,
        reader: createReader({
          fixture: allowedFixture,
          resultFactory: () => createReaderResult({
            fixture: allowedFixture,
            readerResultDigestSha256: digest('forged-reader-result'),
          }),
        }),
      }),
    ),
    'reader result digest forgery',
  )
  await expectRejects(
    () => persistCanonicalPreapprovalRouteDataAssurance(
      persistenceInput({
        fixture: allowedFixture,
        reader: createReader({
          fixture: allowedFixture,
          resultFactory: (invocation) => createReaderResult({
            fixture: invocation === 1
              ? allowedFixture
              : fixture({
                  requestDigestSha256: digest('racing-request'),
                }),
            identityOverrides: invocation === 1
              ? undefined
              : {
                  requestDigestSha256: digest('racing-request'),
                },
          }),
        }),
      }),
    ),
    'reader reread race',
  )
  await expectRejects(
    () => readCurrentCanonicalPreapprovalRouteDataAssurance({
      repositoryScope,
      canonicalContext: context({
        requestDigestSha256: digest('stale-current-request'),
      }),
      locator: persisted.locator,
      repository,
    }),
    'stale request digest',
  )
  await expectRejects(
    () => readCurrentCanonicalPreapprovalRouteDataAssurance({
      repositoryScope: {
        ...repositoryScope,
        ownerUserId: 'owner-route-data-foreign',
      },
      canonicalContext,
      locator: persisted.locator,
      repository,
    }),
    'cross-owner read',
  )

  for (const evidenceCase of [
    {
      state: 'missing',
      reason: 'route_assurance_missing',
    },
    {
      state: 'expired',
      reason: 'route_assurance_expired',
    },
    {
      state: 'conflict',
      reason: 'route_assurance_conflict',
    },
  ] as const) {
    const unresolvedFixture = fixture({
      editSessionId:
        `${EDIT_SESSION_ID}-${evidenceCase.state}-evidence`,
      requestDigestSha256:
        digest(`${evidenceCase.state}-evidence-request`),
      routeEvidenceState: evidenceCase.state,
    })
    const unresolvedBinding =
      createCanonicalPreapprovalRouteDataAssuranceBinding({
        evidenceSnapshotId:
          `${evidenceCase.state}-evidence-snapshot`,
        evidenceRevision: 1,
        evaluatedAt: unresolvedFixture.evaluatedAt,
        projectPolicy: unresolvedFixture.projectPolicy,
        requestClassification:
          unresolvedFixture.requestClassification,
        routeAssurances: unresolvedFixture.routeAssurances,
      })
    assert.equal(
      unresolvedBinding.status,
      'requires_review',
      evidenceCase.state,
    )
    assert.equal(
      unresolvedBinding.allRoutesAllowed,
      false,
      evidenceCase.state,
    )
    assert.equal(
      unresolvedBinding.requiresReview,
      true,
      evidenceCase.state,
    )
    assert.ok(
      unresolvedBinding.routeDecisions.every((decision) =>
        decision.reasonCodes.includes(evidenceCase.reason)),
      evidenceCase.state,
    )
  }

  const blockedCases = [
    {
      label: 'retention commitment insufficient',
      fixture: fixture({
        editSessionId: `${EDIT_SESSION_ID}-retention`,
        requestDigestSha256: digest('retention-request'),
        routeOverrides: {
          kimi_k3_primary: {
            retentionCommitment: 'standard_retention',
          },
        },
      }),
      reason: 'retention_commitment_insufficient',
    },
    {
      label: 'training use permitted',
      fixture: fixture({
        editSessionId: `${EDIT_SESSION_ID}-training`,
        requestDigestSha256: digest('training-request'),
        routeOverrides: {
          kimi_k3_primary: {
            trainingUseState: 'permitted',
          },
        },
      }),
      reason: 'route_training_use_permitted',
    },
    {
      label: 'processing region substitution',
      fixture: fixture({
        editSessionId: `${EDIT_SESSION_ID}-region`,
        requestDigestSha256: digest('region-request'),
        allowedProcessingRegions: ['different-verified-region'],
      }),
      reason: 'processing_region_not_permitted',
    },
    {
      label: 'sensitivity exceeds route',
      fixture: fixture({
        editSessionId: `${EDIT_SESSION_ID}-sensitivity`,
        requestDigestSha256: digest('sensitivity-request'),
        sensitivity: 'restricted',
        routeOverrides: {
          gpt_5_6_terra_fallback: {
            maximumSensitivity: 'internal',
          },
        },
      }),
      reason: 'sensitivity_exceeds_route_assurance',
    },
    {
      label: 'confidential source forbidden',
      fixture: fixture({
        editSessionId: `${EDIT_SESSION_ID}-confidential`,
        requestDigestSha256: digest('confidential-request'),
        confidentialSourceState: 'provider_processing_forbidden',
      }),
      reason: 'confidential_source_request_forbidden',
    },
    {
      label: 'human likeness consent missing',
      fixture: fixture({
        editSessionId: `${EDIT_SESSION_ID}-likeness`,
        requestDigestSha256: digest('likeness-request'),
        humanLikenessState: 'consent_missing',
      }),
      reason: 'human_likeness_consent_missing',
    },
    {
      label: 'minor guardian consent missing',
      fixture: fixture({
        editSessionId: `${EDIT_SESSION_ID}-minor`,
        requestDigestSha256: digest('minor-request'),
        humanLikenessState: 'consent_verified',
        minorLikenessState: 'guardian_consent_missing',
      }),
      reason: 'minor_guardian_consent_missing',
    },
    {
      label: 'rights safety blocked',
      fixture: fixture({
        editSessionId: `${EDIT_SESSION_ID}-rights`,
        requestDigestSha256: digest('rights-request'),
        rightsSafetyState: 'blocked',
      }),
      reason: 'rights_safety_blocked',
    },
    {
      label: 'fact safety blocked',
      fixture: fixture({
        editSessionId: `${EDIT_SESSION_ID}-facts`,
        requestDigestSha256: digest('facts-request'),
        factSafetyState: 'blocked',
      }),
      reason: 'fact_safety_blocked',
    },
  ] as const
  for (const blockedCase of blockedCases) {
    const blockedBinding =
      createCanonicalPreapprovalRouteDataAssuranceBinding({
        evidenceSnapshotId: `${blockedCase.label.replaceAll(' ', '-')}-snapshot`,
        evidenceRevision: 1,
        evaluatedAt: blockedCase.fixture.evaluatedAt,
        projectPolicy: blockedCase.fixture.projectPolicy,
        requestClassification:
          blockedCase.fixture.requestClassification,
        routeAssurances: blockedCase.fixture.routeAssurances,
      })
    assert.equal(blockedBinding.status, 'blocked', blockedCase.label)
    assert.equal(blockedBinding.allRoutesAllowed, false, blockedCase.label)
    assert.ok(
      blockedBinding.routeDecisions.some((decision) =>
        decision.reasonCodes.includes(
          blockedCase.reason as never,
        )),
      blockedCase.label,
    )
  }

  const reordered = [...allowedFixture.routeAssurances].reverse()
  await expectRejects(
    async () => {
      createCanonicalPreapprovalRouteDataAssuranceBinding({
        evidenceSnapshotId: 'reordered-route-snapshot',
        evidenceRevision: 1,
        evaluatedAt: allowedFixture.evaluatedAt,
        projectPolicy: allowedFixture.projectPolicy,
        requestClassification: allowedFixture.requestClassification,
        routeAssurances: reordered,
      })
    },
    'route reorder',
  )
  const providerSubstitution = resignRouteAssurance({
    ...allowedFixture.routeAssurances[0]!,
    provider: 'deepseek',
  })
  await expectRejects(
    async () => {
      createCanonicalPreapprovalRouteDataAssuranceBinding({
        evidenceSnapshotId: 'provider-substitution-snapshot',
        evidenceRevision: 1,
        evaluatedAt: allowedFixture.evaluatedAt,
        projectPolicy: allowedFixture.projectPolicy,
        requestClassification: allowedFixture.requestClassification,
        routeAssurances: [
          providerSubstitution,
          allowedFixture.routeAssurances[1]!,
          allowedFixture.routeAssurances[2]!,
        ],
      })
    },
    'provider substitution with recomputed digest',
  )
  const modelSubstitution = resignRouteAssurance({
    ...allowedFixture.routeAssurances[1]!,
    exactProviderModelId: 'qwen2.5-vl-72b',
  })
  await expectRejects(
    async () => {
      createCanonicalPreapprovalRouteDataAssuranceBinding({
        evidenceSnapshotId: 'visual-model-substitution-snapshot',
        evidenceRevision: 1,
        evaluatedAt: allowedFixture.evaluatedAt,
        projectPolicy: allowedFixture.projectPolicy,
        requestClassification: allowedFixture.requestClassification,
        routeAssurances: [
          allowedFixture.routeAssurances[0]!,
          modelSubstitution,
          allowedFixture.routeAssurances[2]!,
        ],
      })
    },
    'Qwen visual specialist substituted as reasoning route',
  )

  const forgedDecision = structuredClone(binding)
  forgedDecision.routeDecisions[0]!.eligibility = 'disallowed'
  forgedDecision.routeDecisions[0]!.reasonCodes = [
    'provider_not_permitted',
  ]
  forgedDecision.contractDigestSha256 = resignBinding(forgedDecision)
  await expectRejects(
    async () => {
      verifyCanonicalPreapprovalRouteDataAssuranceBinding(
        forgedDecision,
      )
    },
    're-signed route-decision forgery',
  )
  assert.equal(
    canonicalPreapprovalRouteDataAssuranceBindingSchema.safeParse({
      ...binding,
      rawTranscript: 'Never send raw transcript text through this record.',
    }).success,
    false,
  )
  assert.equal(
    canonicalPreapprovalRouteDataAssuranceBindingSchema.safeParse({
      ...binding,
      providerRequest: {
        url: 'https://provider.invalid',
        apiKey: 'not-accepted',
      },
    }).success,
    false,
  )
  assert.equal(
    canonicalPreapprovalRouteDataAssuranceBindingSchema.safeParse({
      ...binding,
      authorityBoundary: Object.fromEntries(
        Object.keys(binding.authorityBoundary).map((key) => [key, true]),
      ),
    }).success,
    false,
  )

  const rollbackContext = context({
    editSessionId: `${EDIT_SESSION_ID}-rollback`,
    requestDigestSha256: digest('rollback-request'),
  })
  const rollbackFixture = fixture({
    editSessionId: rollbackContext.editSessionId,
    requestDigestSha256: rollbackContext.requestDigestSha256,
  })
  const firstRollback = await persistCanonicalPreapprovalRouteDataAssurance(
    persistenceInput({
      fixture: rollbackFixture,
      canonicalContext: rollbackContext,
      sourceLocatorId: `${SOURCE_LOCATOR_ID}-rollback`,
      evidenceSnapshotId: 'rollback-snapshot-v1',
      evidenceRevision: 1,
    }),
  )
  const advancedFixture = fixture({
    editSessionId: rollbackContext.editSessionId,
    requestDigestSha256: rollbackContext.requestDigestSha256,
    policyVersion: 'route-data-policy-v2',
  })
  const advancedRollback =
    await persistCanonicalPreapprovalRouteDataAssurance(
      persistenceInput({
        fixture: advancedFixture,
        canonicalContext: rollbackContext,
        sourceLocatorId: `${SOURCE_LOCATOR_ID}-rollback`,
        evidenceSnapshotId: 'rollback-snapshot-v2',
        evidenceRevision: 2,
      }),
    )
  assert.equal(advancedRollback.disposition, 'advanced_latest')
  assert.equal(
    await countStoredVersions(firstRollback.locator.serverOwnedLocatorId),
    2,
  )
  await expectRejects(
    () => persistCanonicalPreapprovalRouteDataAssurance(
      persistenceInput({
        fixture: rollbackFixture,
        canonicalContext: rollbackContext,
        sourceLocatorId: `${SOURCE_LOCATOR_ID}-rollback`,
        evidenceSnapshotId: 'rollback-snapshot-v1',
        evidenceRevision: 1,
      }),
    ),
    'historical revision rollback',
  )
  const sameRevisionSubstitution = fixture({
    editSessionId: rollbackContext.editSessionId,
    requestDigestSha256: rollbackContext.requestDigestSha256,
    policyVersion: 'route-data-policy-v2-substituted',
  })
  await expectRejects(
    () => persistCanonicalPreapprovalRouteDataAssurance(
      persistenceInput({
        fixture: sameRevisionSubstitution,
        canonicalContext: rollbackContext,
        sourceLocatorId: `${SOURCE_LOCATOR_ID}-rollback`,
        evidenceSnapshotId: 'rollback-snapshot-v2',
        evidenceRevision: 2,
      }),
    ),
    'same revision content substitution',
  )
  assert.equal(
    await countStoredVersions(firstRollback.locator.serverOwnedLocatorId),
    2,
  )

  const locator = deriveCanonicalPreapprovalRouteDataAssuranceLocator(
    binding,
  )
  assert.equal(
    locator.serverOwnedLocatorId,
    persisted.locator.serverOwnedLocatorId,
  )
  const pointerPath = await findLatestPointerPath(
    persisted.locator.serverOwnedLocatorId,
  )
  const pointer = JSON.parse(await readFile(pointerPath, 'utf8')) as {
    packageDigestSha256: string
  }
  pointer.packageDigestSha256 = digest('tampered-pointer')
  await writeFile(pointerPath, `${JSON.stringify(pointer)}\n`, 'utf8')
  await expectRejects(
    () => readCurrentCanonicalPreapprovalRouteDataAssurance({
      repositoryScope,
      canonicalContext,
      locator: persisted.locator,
      repository,
    }),
    'checksummed latest pointer tamper',
  )

  console.log(JSON.stringify({
    ok: true,
    smoke: 'canonical-preapproval-route-data-assurance',
    exactRouteOrder: binding.orderedRouteIds,
    allThreeRoutesAllowed: true,
    textProjectionOnly: true,
    rawMediaTranscriptAndBrowserCaptureRejected: true,
    regionRetentionAndTrainingBound: true,
    confidentialLikenessMinorRightsAndFactSafetyBound: true,
    missingExpiredOrConflictingEvidenceRequiresReview: true,
    oldKimiGptAndQwenVisualRoutesRejected: true,
    processBoundReaderRequired: true,
    rereadRaceRejected: true,
    historicalRollbackRejected: true,
    privateContentAddressedRepository: true,
    allProviderRuntimeAndCommercialAuthoritiesClosed: true,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

type EvidenceState = 'verified_current' | 'missing' | 'expired' | 'conflict'

interface Fixture {
  readonly evaluatedAt: string
  readonly projectPolicy: CanonicalPreapprovalProjectModelDataPolicy
  readonly requestClassification:
    CanonicalPreapprovalModelDataRequestClassification
  readonly routeAssurances:
    readonly CanonicalPreapprovalModelRouteDataAssurance[]
}

function fixture(input?: {
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  requestDigestSha256?: string
  policyVersion?: string
  evaluatedAt?: string
  routeEvidenceState?: EvidenceState
  allowedProcessingRegions?: readonly string[]
  sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted'
  confidentialSourceState?:
    | 'not_present'
    | 'provider_processing_approved'
    | 'provider_processing_forbidden'
    | 'review_required'
  humanLikenessState?:
    | 'not_present'
    | 'consent_verified'
    | 'consent_missing'
    | 'review_required'
  minorLikenessState?:
    | 'not_present'
    | 'guardian_consent_verified'
    | 'guardian_consent_missing'
    | 'review_required'
  rightsSafetyState?: 'approved' | 'blocked' | 'review_required'
  factSafetyState?:
    | 'not_applicable'
    | 'approved'
    | 'blocked'
    | 'review_required'
  routeOverrides?: Partial<Record<
    ReEditProActiveReasoningModelRouteId,
    Partial<{
      maximumSensitivity:
        'public' | 'internal' | 'confidential' | 'restricted'
      trainingUseState:
        | 'prohibited_by_contract'
        | 'provider_setting_disabled'
        | 'permitted'
        | 'unknown'
      retentionCommitment:
        | 'zero_retention_verified'
        | 'contractual_no_training_verified'
        | 'standard_retention'
        | 'unknown'
    }>
  >>
}): Fixture {
  const workspaceId = input?.workspaceId ?? WORKSPACE_ID
  const projectId = input?.projectId ?? PROJECT_ID
  const editSessionId = input?.editSessionId ?? EDIT_SESSION_ID
  const requestDigestSha256 =
    input?.requestDigestSha256 ?? REQUEST_DIGEST
  const evaluatedAt = input?.evaluatedAt ?? new Date().toISOString()
  const verifiedAt = new Date(
    Date.parse(evaluatedAt) - 24 * 60 * 60 * 1_000,
  ).toISOString()
  const expiresAt = new Date(
    Date.parse(evaluatedAt) + 30 * 24 * 60 * 60 * 1_000,
  ).toISOString()
  const verifiedEvidence = (label: string) =>
    createCanonicalPreapprovalPolicyEvidence({
      state: 'verified_current',
      evidenceReferenceId: `${label}-evidence`,
      evidenceDigestSha256: digest(`${label}-evidence`),
      verifiedAt,
      expiresAt,
    })
  const projectPolicy =
    createCanonicalPreapprovalProjectModelDataPolicy({
      policyId: 'route-data-project-policy',
      policyVersion: input?.policyVersion ?? 'route-data-policy-v1',
      organizationPolicyId: 'route-data-organization-policy',
      workspaceId,
      projectId,
      editSessionId,
      sensitivity: input?.sensitivity ?? 'internal',
      permittedProviderIds: [
        'moonshot_ai',
        'openai',
        'deepseek',
      ],
      allowedProcessingRegions:
        input?.allowedProcessingRegions ?? [REGION_ID],
      retentionRequirement: 'contractual_no_training',
      trainingUseRestriction: 'prohibited',
      confidentialSourceRule: 'allow_verified_provider',
      humanLikenessRule: 'verified_consent_required',
      minorLikenessRule: 'verified_guardian_consent_required',
      organizationPolicyEvidence:
        verifiedEvidence('organization-policy'),
      projectPolicyEvidence: verifiedEvidence('project-policy'),
      decidedAt: verifiedAt,
    })
  const requestClassification =
    createCanonicalPreapprovalModelDataRequestClassification({
      classificationId: 'route-data-request-classification',
      workspaceId,
      projectId,
      editSessionId,
      requestDigestSha256,
      requestedUse: 'edit_planning',
      confidentialSourceState:
        input?.confidentialSourceState ?? 'not_present',
      humanLikenessState:
        input?.humanLikenessState ?? 'not_present',
      minorLikenessState:
        input?.minorLikenessState ?? 'not_present',
      rightsSafetyState: input?.rightsSafetyState ?? 'approved',
      factSafetyState:
        input?.factSafetyState ?? 'not_applicable',
      classificationEvidenceDigestSha256:
        digest(`classification-${requestDigestSha256}`),
      classifiedAt: verifiedAt,
    })
  const routeAssurances = REEDITPRO_REASONING_MODEL_ROUTE_IDS.map(
    (routeId) => {
      const state = input?.routeEvidenceState ?? 'verified_current'
      const evidence = state === 'missing'
        ? createCanonicalPreapprovalPolicyEvidence({
            state,
            evidenceReferenceId: null,
            evidenceDigestSha256: null,
            verifiedAt: null,
            expiresAt: null,
          })
        : createCanonicalPreapprovalPolicyEvidence({
            state,
            evidenceReferenceId: `${routeId}-assurance-evidence`,
            evidenceDigestSha256:
              digest(`${routeId}-assurance-evidence`),
            verifiedAt,
            expiresAt,
          })
      const override = input?.routeOverrides?.[routeId]
      return createCanonicalPreapprovalModelRouteDataAssurance({
        assuranceId: `${routeId}-assurance`,
        routeId,
        selectedProcessingRegion: REGION_ID,
        maximumSensitivity:
          override?.maximumSensitivity ?? 'restricted',
        retentionCommitment:
          override?.retentionCommitment
            ?? 'contractual_no_training_verified',
        trainingUseState:
          override?.trainingUseState ?? 'prohibited_by_contract',
        confidentialSourceHandling: 'contractually_permitted',
        humanLikenessHandling: 'consent_bound_permitted',
        minorLikenessHandling:
          'guardian_consent_bound_permitted',
        assuranceEvidence: evidence,
      })
    },
  )
  return {
    evaluatedAt,
    projectPolicy,
    requestClassification,
    routeAssurances,
  }
}

function context(input?: {
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  requestDigestSha256?: string
}): CanonicalPreapprovalRouteDataAssuranceContext {
  return {
    workspaceId: input?.workspaceId ?? WORKSPACE_ID,
    projectId: input?.projectId ?? PROJECT_ID,
    editSessionId: input?.editSessionId ?? EDIT_SESSION_ID,
    requestDigestSha256:
      input?.requestDigestSha256 ?? REQUEST_DIGEST,
  }
}

function persistenceInput(input: {
  fixture: Fixture
  canonicalContext?: CanonicalPreapprovalRouteDataAssuranceContext
  sourceLocatorId?: string
  evidenceSnapshotId?: string
  evidenceRevision?: number
  reader?: CanonicalPreapprovalRouteDataAssuranceReaderPort | null
}): Parameters<
  typeof persistCanonicalPreapprovalRouteDataAssurance
>[0] {
  const currentContext = input.canonicalContext ?? canonicalContext
  const sourceLocatorId = input.sourceLocatorId ?? SOURCE_LOCATOR_ID
  return {
    repositoryScope,
    canonicalContext: currentContext,
    sourceAssuranceLocator: {
      schemaVersion:
        CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_SOURCE_LOCATOR_VERSION,
      serverOwnedLocatorId: sourceLocatorId,
    },
    reader: input.reader === undefined
      ? createReader({
          fixture: input.fixture,
          canonicalContext: currentContext,
          sourceLocatorId,
          evidenceSnapshotId:
            input.evidenceSnapshotId ?? `${sourceLocatorId}-snapshot`,
          evidenceRevision: input.evidenceRevision ?? 1,
        })
      : input.reader,
    repository,
  }
}

function createReader(input: {
  fixture: Fixture
  canonicalContext?: CanonicalPreapprovalRouteDataAssuranceContext
  sourceLocatorId?: string
  evidenceSnapshotId?: string
  evidenceRevision?: number
  resultFactory?: (invocation: number) => unknown
}): CanonicalPreapprovalRouteDataAssuranceReaderPort {
  const currentContext = input.canonicalContext ?? canonicalContext
  const sourceLocatorId = input.sourceLocatorId ?? SOURCE_LOCATOR_ID
  let invocation = 0
  return createCanonicalPreapprovalRouteDataAssuranceReader(
    async (request) => {
      assert.equal(request.serverOwnedLocatorId, sourceLocatorId)
      assert.deepEqual(request.expectedScope, {
        workspaceId: currentContext.workspaceId,
        projectId: currentContext.projectId,
        editSessionId: currentContext.editSessionId,
      })
      assert.equal(
        request.expectedRequestDigestSha256,
        currentContext.requestDigestSha256,
      )
      invocation += 1
      return input.resultFactory
        ? input.resultFactory(invocation)
        : createReaderResult({
            fixture: input.fixture,
            canonicalContext: currentContext,
            sourceLocatorId,
            evidenceSnapshotId: input.evidenceSnapshotId,
            evidenceRevision: input.evidenceRevision,
          })
    },
  )
}

function createReaderResult(input: {
  fixture: Fixture
  canonicalContext?: CanonicalPreapprovalRouteDataAssuranceContext
  sourceLocatorId?: string
  evidenceSnapshotId?: string
  evidenceRevision?: number
  identityOverrides?: Partial<{
    workspaceId: string
    projectId: string
    editSessionId: string
    requestDigestSha256: string
  }>
  readerResultDigestSha256?: string
}): unknown {
  const currentContext = input.canonicalContext ?? canonicalContext
  const sourceLocatorId = input.sourceLocatorId ?? SOURCE_LOCATOR_ID
  const draft = {
    schemaVersion:
      CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_READER_RESULT_VERSION,
    sourceAuthority:
      'canonical_private_route_data_assurance_repository',
    evidenceClass:
      'private_verified_preapproval_route_data_assurance_source',
    productionReady: false,
    callerSuppliedPolicyAccepted: false,
    serverOwnedLocatorId: sourceLocatorId,
    evidenceSnapshotId:
      input.evidenceSnapshotId ?? `${sourceLocatorId}-snapshot`,
    evidenceRevision: input.evidenceRevision ?? 1,
    evaluatedAt: input.fixture.evaluatedAt,
    identity: {
      workspaceId: currentContext.workspaceId,
      projectId: currentContext.projectId,
      editSessionId: currentContext.editSessionId,
      requestDigestSha256: currentContext.requestDigestSha256,
      ...input.identityOverrides,
    },
    projectPolicy: input.fixture.projectPolicy,
    requestClassification: input.fixture.requestClassification,
    routeAssurances: input.fixture.routeAssurances,
    routeAssuranceCount: 3,
  }
  return {
    ...draft,
    readerResultDigestSha256:
      input.readerResultDigestSha256 ?? sha256AuthorityValue(draft),
  }
}

function resignRouteAssurance(
  value: CanonicalPreapprovalModelRouteDataAssurance,
): CanonicalPreapprovalModelRouteDataAssurance {
  const { assuranceDigestSha256: _digest, ...draft } = value
  void _digest
  return {
    ...draft,
    assuranceDigestSha256: sha256AuthorityValue(draft),
  }
}

function resignBinding(
  value: ReturnType<
    typeof createCanonicalPreapprovalRouteDataAssuranceBinding
  >,
): string {
  const { contractDigestSha256: _digest, ...draft } = value
  void _digest
  return sha256AuthorityValue(draft)
}

async function countStoredVersions(locatorId: string): Promise<number> {
  const versions = join(repositoryLocatorDirectory(locatorId), 'versions')
  return (await readdir(versions)).filter((name) => name.endsWith('.json'))
    .length
}

async function findLatestPointerPath(locatorId: string): Promise<string> {
  return join(repositoryLocatorDirectory(locatorId), 'latest.json')
}

function repositoryLocatorDirectory(locatorId: string): string {
  return join(
    root,
    'canonical-preapproval-route-data-assurance',
    'scopes',
    sha256AuthorityValue({
      ownerUserId: repositoryScope.ownerUserId,
      workspaceId: repositoryScope.workspaceId,
    }),
    'locators',
    sha256AuthorityValue(locatorId),
  )
}

async function expectRejects(
  operation: () => Promise<unknown>,
  label: string,
): Promise<void> {
  await assert.rejects(operation, label)
}

function digest(value: string): string {
  return sha256AuthorityValue(value)
}
