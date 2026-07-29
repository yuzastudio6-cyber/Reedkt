import assert from 'node:assert/strict'

import type {
  LivingFrameIpAdapterExtensionEvaluation,
} from '../../src/types/living-frame-controlled-illustration-ipadapter-extension'
import {
  createLivingFrameIpAdapterExtensionEvaluation,
  LivingFrameIpAdapterExtensionEvaluationError,
  validateLivingFrameIpAdapterExtensionEvaluation,
  verifyLivingFrameIpAdapterExtensionEvaluation,
} from '../living-frame/living-frame-controlled-illustration-ipadapter-extension'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const digest = (label: string) => sha256AuthorityValue(label)
const input = {
  evaluationId: 'ipadapter-extension.generic-evaluation',
  controlledIllustrationQualificationDigestSha256:
    digest('qualification'),
  controlledIllustrationSourceObservationDigestSha256:
    digest('source-observation'),
  stockComfyUiGraphExpectationDigestSha256:
    digest('stock-comfyui-graph'),
}
const evaluation = createLivingFrameIpAdapterExtensionEvaluation(input)

assert.equal(
  verifyLivingFrameIpAdapterExtensionEvaluation(evaluation),
  true,
)
assert.equal(
  validateLivingFrameIpAdapterExtensionEvaluation(evaluation).ok,
  true,
)
assert.equal(
  evaluation.sourceBindings.immutableRevisionSha1,
  'b188a6cb39b512a9c6da7235b880af42c78ccd0d',
)
assert.equal(
  evaluation.sourceBindings.sourceTreeSha1,
  '8e16f8055ae089c28a68c2d9711c1d5d93bb52b8',
)
assert.deepEqual(
  evaluation.nodeBoundary.genericAllowlistedNodeClasses,
  ['IPAdapterModelLoader', 'IPAdapterAdvanced'],
)
assert.equal(evaluation.nodeBoundary.faceIdNodeAllowed, false)
assert.equal(evaluation.nodeBoundary.insightFaceLoaderAllowed, false)
assert.equal(evaluation.nodeBoundary.unifiedLoaderAllowed, false)
assert.equal(evaluation.nodeBoundary.customFileIoNodeAllowed, false)
assert.equal(evaluation.nodeBoundary.runtimeDownloadAllowed, false)
assert.equal(evaluation.dependencyBoundary.dependencyLockPresent, false)
assert.equal(
  evaluation.dependencyBoundary.genericIpAdapterWeightManifestPresent,
  false,
)
assert.equal(
  evaluation.dependencyBoundary.clipVisionWeightManifestPresent,
  false,
)
assert.equal(
  evaluation.dependencyBoundary.sourceRepositoryMetadataPointsToOriginalCubiqProject,
  true,
)
assert.equal(evaluation.genericRouteStructurallyRepresentable, true)
assert.equal(evaluation.genericRouteQualified, false)
assert.equal(evaluation.faceIdRouteQualified, false)
assert.equal(evaluation.auraFaceUsedAsGenerationAdapter, false)
assert.equal(evaluation.subjectSpecificRouting, false)
assert.equal(evaluation.productionReady, false)
assert.equal(JSON.stringify(evaluation).includes('://'), false)
assert.equal(JSON.stringify(evaluation).includes('/Users/'), false)
assertAllAuthorityClosed(evaluation)

const replay = createLivingFrameIpAdapterExtensionEvaluation(input)
assert.deepEqual(replay, evaluation)

const changedParent = createLivingFrameIpAdapterExtensionEvaluation({
  ...input,
  stockComfyUiGraphExpectationDigestSha256:
    digest('changed-stock-comfyui-graph'),
})
assert.notEqual(
  changedParent.evaluationDigestSha256,
  evaluation.evaluationDigestSha256,
)

for (const value of [
  { ...input, prompt: 'forbidden' },
  { ...input, modelPath: '/tmp/forbidden' },
  { ...input, url: 'https://forbidden.invalid' },
  { ...input, providerId: 'forbidden' },
  {
    ...input,
    controlledIllustrationQualificationDigestSha256: 'bad',
  },
]) {
  let caught: unknown
  try {
    createLivingFrameIpAdapterExtensionEvaluation(value as never)
  } catch (error) {
    caught = error
  }
  assert.ok(caught instanceof LivingFrameIpAdapterExtensionEvaluationError)
  assert.equal(
    caught.message,
    'Living Frame IP-Adapter extension evaluation failed.',
  )
}

const forged: Array<{
  readonly value: unknown
  readonly expectedCode: string
}> = [
  {
    value: sign({
      ...withoutDigest(evaluation),
      sourceBindings: {
        ...evaluation.sourceBindings,
        immutableRevisionSha1:
          '0000000000000000000000000000000000000000',
      },
    }),
    expectedCode: 'source_binding_invalid',
  },
  {
    value: sign({
      ...withoutDigest(evaluation),
      sourceFileObservations:
        evaluation.sourceFileObservations.map((entry, index) =>
          index === 0
            ? { ...entry, digestSha256: digest('forged-file') }
            : entry),
    }),
    expectedCode: 'file_observation_invalid',
  },
  {
    value: sign({
      ...withoutDigest(evaluation),
      sourceFileObservations: [
        evaluation.sourceFileObservations[1],
        evaluation.sourceFileObservations[0],
        ...evaluation.sourceFileObservations.slice(2),
      ],
    }),
    expectedCode: 'file_observation_order_invalid',
  },
  {
    value: sign({
      ...withoutDigest(evaluation),
      nodeBoundary: {
        ...evaluation.nodeBoundary,
        genericAllowlistedNodeClasses: [
          ...evaluation.nodeBoundary.genericAllowlistedNodeClasses,
          'IPAdapterFaceID',
        ],
        faceIdNodeAllowed: true,
      },
    }),
    expectedCode: 'node_boundary_invalid',
  },
  {
    value: sign({
      ...withoutDigest(evaluation),
      nodeBoundary: {
        ...evaluation.nodeBoundary,
        runtimeFilenameSelectionAllowed: true,
        runtimeDownloadAllowed: true,
      },
    }),
    expectedCode: 'node_boundary_invalid',
  },
  {
    value: sign({
      ...withoutDigest(evaluation),
      dependencyBoundary: {
        ...evaluation.dependencyBoundary,
        dependencyLockPresent: true,
        genericIpAdapterWeightManifestPresent: true,
        clipVisionWeightManifestPresent: true,
        modelLicensesIndependentlyApproved: true,
        sourceLicenseLegallyApprovedForDeployment: true,
        comfyUiCompatibilityProven: true,
      },
    }),
    expectedCode: 'dependency_boundary_invalid',
  },
  {
    value: sign({
      ...withoutDigest(evaluation),
      openGateCodes: [],
    }),
    expectedCode: 'gate_set_invalid',
  },
  {
    value: sign({
      ...withoutDigest(evaluation),
      authorityBoundary: Object.fromEntries(
        Object.keys(evaluation.authorityBoundary).map((key) => [key, true]),
      ),
      genericRouteQualified: true,
      faceIdRouteQualified: true,
      auraFaceUsedAsGenerationAdapter: true,
      executableWorkflowPresent: true,
      packageInstalled: true,
      runtimeArtifactPresent: true,
      subjectSpecificRouting: true,
      productionReady: true,
    }),
    expectedCode: 'authority_promotion_forbidden',
  },
  {
    value: {
      ...evaluation,
      evaluationDigestSha256: digest('forged-report'),
    },
    expectedCode: 'digest_mismatch',
  },
]

for (const fixture of forged) {
  const validation =
    validateLivingFrameIpAdapterExtensionEvaluation(fixture.value)
  assert.equal(validation.ok, false)
  if (!validation.ok) {
    assert.ok(
      validation.issues.some(
        (issue) => issue.code === fixture.expectedCode,
      ),
      `${fixture.expectedCode} must be reported; got ${
        validation.issues.map((issue) => issue.code).join(', ')
      }.`,
    )
  }
}

function assertAllAuthorityClosed(
  value: LivingFrameIpAdapterExtensionEvaluation,
): void {
  assert.equal(value.authorityBoundary.controlledSourceEvaluationOnly, true)
  for (const [key, authority] of Object.entries(value.authorityBoundary)) {
    if (key === 'controlledSourceEvaluationOnly') continue
    assert.equal(authority, false, `${key} must remain false.`)
  }
}

function withoutDigest(
  value: LivingFrameIpAdapterExtensionEvaluation,
): Record<string, unknown> {
  const { evaluationDigestSha256: _digest, ...draft } = value
  void _digest
  return draft
}

function sign(draft: Record<string, unknown>): unknown {
  return {
    ...draft,
    evaluationDigestSha256: digest(canonicalJson(draft)),
  }
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (
    typeof value !== 'object'
    || value === null
    || Array.isArray(value)
  ) return value
  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [
        key,
        canonicalize((value as Record<string, unknown>)[key]),
      ]),
  )
}

console.log(
  'Living Frame IP-Adapter extension smoke passed: '
    + 'generic source route bounded, FaceID/InsightFace blocked, '
    + `${forged.length + 5} adversarial cases.`,
)
