import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  canonicalTrackAllSam31L4TaskQaBuildSourceEntrySchema,
  canonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinateSchema,
  type CanonicalTrackAllSam31L4TaskQaBuildSourceEntry,
  type CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinate,
} from './canonical-track-all-sam3_1-l4-task-qa-private-capsule-source-contract'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_ARCHIVE_SAFETY_REVIEW_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-archive-safety-review-v2' as const
const LEGACY_CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_ARCHIVE_SAFETY_REVIEW_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-archive-safety-review-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPENDENCY_REVIEW_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-dependency-review-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_LICENSE_REVIEW_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-license-review-v1' as const

const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const legacyArchiveSafetyWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    LEGACY_CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_ARCHIVE_SAFETY_REVIEW_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_archive_safety_review_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('passed_for_private_candidate_image_build'),
  reviewId: safeId,
  reviewVersion: z.literal(1),
  operationId: z.literal('tool.kornia.refine_mask.v1'),
  buildSourceCoordinate:
    canonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinateSchema,
  buildSourceArtifactRef: evidenceRefSchema,
  archiveEntrySetSha256: rawSha256,
  archiveEntryCount: z.number().int().min(10).max(10_000),
  totalUncompressedBytes: z.number().int().positive().safe()
    .max(24 * 1024 * 1024 * 1024),
  exactCompressedBytesGenerationEtagAndSha256Reread: z.literal(true),
  canonicalUstarRegularFileEntriesOnly: z.literal(true),
  duplicateEntriesAbsent: z.literal(true),
  absoluteTraversalBackslashAndControlPathsAbsent: z.literal(true),
  symlinkHardlinkDeviceFifoSocketAndSparseEntriesAbsent: z.literal(true),
  nonZeroTrailingDataAbsent: z.literal(true),
  archiveEntryAllowlistPassed: z.literal(true),
  malwareContentClassificationClaimed: z.literal(false),
  postBuildArtifactAnalysisRequired: z.literal(true),
  customerMediaOrModelWeightsPresent: z.literal(false),
  preparedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (value.buildSourceArtifactRef.contentHash !==
    `sha256:${value.buildSourceCoordinate.sha256}`) context.addIssue({
    code: 'custom',
    message: 'Track All L4 archive review lost source identity.',
  })
})

const archiveSafetyWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_ARCHIVE_SAFETY_REVIEW_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_archive_safety_review_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('passed_for_private_candidate_image_build'),
  reviewId: safeId,
  reviewVersion: z.literal(1),
  operationId: z.literal('tool.kornia.refine_mask.v1'),
  buildSourceCoordinate:
    canonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinateSchema,
  buildSourceArtifactRef: evidenceRefSchema,
  regularFileEntrySetSha256: rawSha256,
  regularFileEntryCount: z.number().int().min(10).max(10_000),
  directoryEntrySetSha256: rawSha256,
  directoryEntryCount: z.number().int().min(2).max(10_000),
  totalArchiveEntryCount: z.number().int().min(12).max(10_000),
  totalUncompressedRegularFileBytes: z.number().int().positive().safe()
    .max(24 * 1024 * 1024 * 1024),
  exactCompressedBytesGenerationEtagAndSha256Reread: z.literal(true),
  canonicalUstarRegularFilesAndRequiredDirectoriesOnly: z.literal(true),
  parentDirectoryEntriesComplete: z.literal(true),
  duplicateEntriesAbsent: z.literal(true),
  absoluteTraversalBackslashAndControlPathsAbsent: z.literal(true),
  symlinkHardlinkDeviceFifoSocketAndSparseEntriesAbsent: z.literal(true),
  nonZeroTrailingDataAbsent: z.literal(true),
  archiveEntryAllowlistPassed: z.literal(true),
  cloudBuildGcsSourceFetcherCompatible: z.literal(true),
  malwareContentClassificationClaimed: z.literal(false),
  postBuildArtifactAnalysisRequired: z.literal(true),
  customerMediaOrModelWeightsPresent: z.literal(false),
  preparedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (value.buildSourceArtifactRef.contentHash !==
    `sha256:${value.buildSourceCoordinate.sha256}`
    || value.totalArchiveEntryCount !==
      value.regularFileEntryCount + value.directoryEntryCount) context.addIssue({
    code: 'custom',
    message: 'Track All L4 archive review lost source identity.',
  })
})

export const canonicalTrackAllSam31L4TaskQaArchiveSafetyReviewSchema = z.union([
  legacyArchiveSafetyWithoutHashSchema.extend({
    reviewHash: rawSha256,
  }).strict(),
  archiveSafetyWithoutHashSchema.extend({ reviewHash: rawSha256 }).strict(),
])
export type CanonicalTrackAllSam31L4TaskQaArchiveSafetyReview = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaArchiveSafetyReviewSchema
>

const pythonDependencySchema = z.object({
  normalizedName: z.enum([
    'kornia', 'kornia-rs', 'numpy', 'nvidia-ml-py', 'packaging', 'pillow',
  ]),
  version: z.string().regex(/^[0-9]+(?:\.[0-9]+){1,2}$/u),
  wheelPath: z.string().startsWith(
    'track_all_task_qa_private_build_input/python/wheelhouse/',
  ).endsWith('.whl'),
  wheelByteLength: z.number().int().positive().safe(),
  wheelSha256: rawSha256,
  metadataSha256: rawSha256,
  runtimeRole: z.enum([
    'mask_refinement', 'native_kornia_acceleration', 'array_runtime',
    'gpu_observability', 'dependency_version_resolution', 'strict_png_decode',
  ]),
}).strict()

const dependencyWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPENDENCY_REVIEW_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_dependency_review_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('passed_for_private_candidate_image_build'),
  reviewId: safeId,
  reviewVersion: z.literal(1),
  operationId: z.literal('tool.kornia.refine_mask.v1'),
  buildSourceArtifactRef: evidenceRefSchema,
  archiveSafetyReviewRef: evidenceRefSchema,
  requirementsLockSha256: rawSha256,
  pythonDependencies: z.array(pythonDependencySchema).length(6),
  inheritedRuntime: z.object({
    image: z.literal(
      'pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
    ),
    pythonVersion: z.literal('3.12'),
    torchVersion: z.literal('2.10.0+cu128'),
    cudaToolkitVersion: z.literal('12.8'),
    immutableDigestPinned: z.literal(true),
    transitiveSbomAndVulnerabilityRereadRequiredAfterBuild: z.literal(true),
  }).strict(),
  opencvCuda: z.object({
    version: z.literal('4.12.0'),
    sourceCommitSha: z.literal(
      '49486f61fb25722cbcf586b7f4320921d46fb38e',
    ),
    sourceArchiveSha256: z.literal(
      '8f00b42869ab2836be36090f6631ae4c38ba59171e22a69a8e0f92f8ef1771d4',
    ),
    contribCommitSha: z.literal(
      'd943e1d61c8bc556a13783e1546ee7c1a9e0b1cf',
    ),
    contribArchiveSha256: z.literal(
      '79b55fa0d0edc6b2766f20cc97baf9dcee5f974870d5afeb1f8e3c623623b59b',
    ),
    cudaArchitecture: z.literal('8.9'),
    buildInformationSha256: rawSha256,
    runtimeArtifactSetSha256: rawSha256,
    nonFreeAlgorithmsEnabled: z.literal(false),
    fastMathEnabled: z.literal(false),
  }).strict(),
  cudaForwardCompatibility: z.object({
    packageName: z.literal('cuda-compat-12-8'),
    packageVersion: z.literal('570.211.01-0ubuntu1'),
    architecture: z.literal('amd64'),
    packageByteLength: z.literal(37_945_232),
    packageSha256: z.literal(
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    ),
    debianControlSha256: z.literal(
      'c99dfe723c276cc4915446ec4341ab0f5eeae2d8cee0dd1f9234b19ce5121e57',
    ),
  }).strict(),
  dependencySetSha256: rawSha256,
  exactWheelSetMatchesHashLockedRequirements: z.literal(true),
  runtimePackageDownloadsAllowed: z.literal(false),
  pipNoIndexNoDependenciesAndRequireHashesRequired: z.literal(true),
  pipCheckRequiredDuringImageBuild: z.literal(true),
  callerPackageOrIndexSelectionAllowed: z.literal(false),
  samCheckpointOrModelWeightsIncluded: z.literal(false),
  baseImageTransitiveReleaseGranted: z.literal(false),
  preparedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (!isStrictlyOrderedUnique(
    value.pythonDependencies.map((dependency) => dependency.normalizedName),
  ) || value.dependencySetSha256 !== dependencySetHash(value)) {
    context.addIssue({
      code: 'custom',
      message: 'Track All L4 dependency review set is invalid.',
    })
  }
})

export const canonicalTrackAllSam31L4TaskQaDependencyReviewSchema =
  dependencyWithoutHashSchema.extend({ reviewHash: rawSha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaDependencyReview = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaDependencyReviewSchema
>

const licenseEvidenceSchema = z.object({
  normalizedName: z.enum([
    'kornia', 'kornia-rs', 'numpy', 'nvidia-ml-py', 'packaging', 'pillow',
  ]),
  version: z.string(),
  wheelSha256: rawSha256,
  licenseExpression: z.enum([
    'Apache-2.0', 'BSD-3-Clause', 'Apache-2.0 OR BSD-2-Clause', 'MIT-CMU',
  ]),
  evidencePath: z.string().min(1).max(256),
  evidenceSha256: rawSha256,
  metadataSha256: rawSha256,
}).strict()

const licenseWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_LICENSE_REVIEW_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_license_review_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('reviewed_for_private_candidate_image_build'),
  reviewId: safeId,
  reviewVersion: z.literal(1),
  operationId: z.literal('tool.kornia.refine_mask.v1'),
  buildSourceArtifactRef: evidenceRefSchema,
  dependencyReviewRef: evidenceRefSchema,
  pythonLicenses: z.array(licenseEvidenceSchema).length(6),
  opencvLicense: z.object({
    version: z.literal('4.12.0'),
    expression: z.literal('Apache-2.0'),
    sourceLicenseSha256: rawSha256,
    contribLicenseSha256: rawSha256,
    bundledThirdPartyNoticesRetained: z.literal(true),
    postBuildSbomLicenseInventoryRequired: z.literal(true),
  }).strict(),
  cudaForwardCompatibilityLicense: z.object({
    packageSha256: z.literal(
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    ),
    expression: z.literal('LicenseRef-NVIDIA-Driver'),
    debianCopyrightSha256: z.literal(
      '89b836340d5217ad1aca3097c0c7d00c85de24a2cc956361f755e08ae91df26e',
    ),
    proprietaryBinaryUnmodified: z.literal(true),
    privateUseOnOwnedOrLeasedNvidiaInfrastructureOnly: z.literal(true),
    publicRedistributionAuthorized: z.literal(false),
  }).strict(),
  licenseSetSha256: rawSha256,
  privateCandidateImageBuildAllowed: z.literal(true),
  runtimeReleaseAllowed: z.literal(false),
  legalApprovalClaimed: z.literal(false),
  publicImageOrBinaryDistributionAuthorized: z.literal(false),
  postBuildSpdxSbomLicenseAndVulnerabilityRereadRequired: z.literal(true),
  preparedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (!isStrictlyOrderedUnique(
    value.pythonLicenses.map((license) => license.normalizedName),
  ) || value.licenseSetSha256 !== licenseSetHash(value)) context.addIssue({
    code: 'custom',
    message: 'Track All L4 license review set is invalid.',
  })
})

export const canonicalTrackAllSam31L4TaskQaLicenseReviewSchema =
  licenseWithoutHashSchema.extend({ reviewHash: rawSha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaLicenseReview = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaLicenseReviewSchema
>

export interface CanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviewReadPort {
  rereadArchiveSafetyReview(input: {
    readonly reviewRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalTrackAllSam31L4TaskQaArchiveSafetyReview | null>
  rereadDependencyReview(input: {
    readonly reviewRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalTrackAllSam31L4TaskQaDependencyReview | null>
  rereadLicenseReview(input: {
    readonly reviewRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalTrackAllSam31L4TaskQaLicenseReview | null>
}

const PYTHON_DEPENDENCIES = [
  {
    normalizedName: 'kornia', version: '0.8.3',
    wheelPath: 'track_all_task_qa_private_build_input/python/wheelhouse/kornia-0.8.3-py3-none-any.whl',
    wheelByteLength: 1_189_381,
    wheelSha256: '0b15f5d359aeafd7ff54ea631ed1943a3eb295c4a6dae3f745ddeada25e33289',
    metadataSha256: 'deea8b6770901889451553e04da09ecd7956f0b6172c01ff62298af7c88d3063',
    runtimeRole: 'mask_refinement',
  },
  {
    normalizedName: 'kornia-rs', version: '0.1.14',
    wheelPath: 'track_all_task_qa_private_build_input/python/wheelhouse/kornia_rs-0.1.14-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl',
    wheelByteLength: 3_695_565,
    wheelSha256: '396f84661fcf260885c3f9db717caf6904eafd44857dca17be09a835bd7da8d9',
    metadataSha256: '48900e099774eef88f36d752fdaf4766bb4ead71665be6f9b20a70534db741da',
    runtimeRole: 'native_kornia_acceleration',
  },
  {
    normalizedName: 'numpy', version: '2.2.6',
    wheelPath: 'track_all_task_qa_private_build_input/python/wheelhouse/numpy-2.2.6-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl',
    wheelByteLength: 16_527_618,
    wheelSha256: 'fd83c01228a688733f1ded5201c678f0c53ecc1006ffbc404db9f7a899ac6249',
    metadataSha256: '22d648f53848429464ca643b40d73b49a920d47876fc77c395d4dca4e834904a',
    runtimeRole: 'array_runtime',
  },
  {
    normalizedName: 'nvidia-ml-py', version: '13.610.43',
    wheelPath: 'track_all_task_qa_private_build_input/python/wheelhouse/nvidia_ml_py-13.610.43-py3-none-any.whl',
    wheelByteLength: 53_163,
    wheelSha256: 'f13c72698edef492f985cc225f14faafe68ae065a2e407f45bdf6f4b9b43fde8',
    metadataSha256: '4b681b648e302800c83919435504193df847cb7229fecb4e0d6471aa6847f063',
    runtimeRole: 'gpu_observability',
  },
  {
    normalizedName: 'packaging', version: '26.3',
    wheelPath: 'track_all_task_qa_private_build_input/python/wheelhouse/packaging-26.3-py3-none-any.whl',
    wheelByteLength: 129_956,
    wheelSha256: 'd7193f7c8e4e93f444fde0262bf90af30e16fa0ad0ad44cb553c87339b23cd1c',
    metadataSha256: '70fdb89fc4d4a9a043bf7372b8972bcc883fddff34ab55e9cf80d73875384763',
    runtimeRole: 'dependency_version_resolution',
  },
  {
    normalizedName: 'pillow', version: '12.1.0',
    wheelPath: 'track_all_task_qa_private_build_input/python/wheelhouse/pillow-12.1.0-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.whl',
    wheelByteLength: 8_044_868,
    wheelSha256: 'bef9768cab184e7ae6e559c032e95ba8d07b3023c289f79a2bd36e8bf85605a5',
    metadataSha256: '4e7feda9a54d7d6fe71d11a63f3ca05dd5e70dbf500a6cf7ca82672774c5fc8b',
    runtimeRole: 'strict_png_decode',
  },
] as const

const PYTHON_LICENSES = [
  {
    normalizedName: 'kornia', version: '0.8.3',
    wheelSha256: PYTHON_DEPENDENCIES[0].wheelSha256,
    licenseExpression: 'Apache-2.0',
    evidencePath: 'kornia-0.8.3.dist-info/licenses/LICENSE',
    evidenceSha256: 'a6cba85bc92e0cff7a450b1d873c0eaa2e9fc96bf472df0247a26bec77bf3ff9',
    metadataSha256: PYTHON_DEPENDENCIES[0].metadataSha256,
  },
  {
    normalizedName: 'kornia-rs', version: '0.1.14',
    wheelSha256: PYTHON_DEPENDENCIES[1].wheelSha256,
    licenseExpression: 'Apache-2.0',
    evidencePath: 'kornia_rs-0.1.14.dist-info/licenses/LICENSE',
    evidenceSha256: 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
    metadataSha256: PYTHON_DEPENDENCIES[1].metadataSha256,
  },
  {
    normalizedName: 'numpy', version: '2.2.6',
    wheelSha256: PYTHON_DEPENDENCIES[2].wheelSha256,
    licenseExpression: 'BSD-3-Clause',
    evidencePath: 'numpy-2.2.6.dist-info/LICENSE.txt',
    evidenceSha256: 'c002bd26de7dc7aa464250a0de063d58fe55974452e4389e5c21c350a820bf06',
    metadataSha256: PYTHON_DEPENDENCIES[2].metadataSha256,
  },
  {
    normalizedName: 'nvidia-ml-py', version: '13.610.43',
    wheelSha256: PYTHON_DEPENDENCIES[3].wheelSha256,
    licenseExpression: 'BSD-3-Clause',
    evidencePath: 'pynvml.py',
    evidenceSha256: 'd3233c78cd3f17bda97850346eba30fa88f1d6b295cee90fa7ec1c6cbf291e5b',
    metadataSha256: PYTHON_DEPENDENCIES[3].metadataSha256,
  },
  {
    normalizedName: 'packaging', version: '26.3',
    wheelSha256: PYTHON_DEPENDENCIES[4].wheelSha256,
    licenseExpression: 'Apache-2.0 OR BSD-2-Clause',
    evidencePath: 'packaging-26.3.dist-info/licenses/LICENSE',
    evidenceSha256: 'cad1ef5bd340d73e074ba614d26f7deaca5c7940c3d8c34852e65c4909686c48',
    metadataSha256: PYTHON_DEPENDENCIES[4].metadataSha256,
  },
  {
    normalizedName: 'pillow', version: '12.1.0',
    wheelSha256: PYTHON_DEPENDENCIES[5].wheelSha256,
    licenseExpression: 'MIT-CMU',
    evidencePath: 'pillow-12.1.0.dist-info/licenses/LICENSE',
    evidenceSha256: '30178bf7aff9f8dc82afed35086cd378a9064e77fcb4380485f38b5da3377052',
    metadataSha256: PYTHON_DEPENDENCIES[5].metadataSha256,
  },
] as const

export function createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews(
  input: {
    readonly buildSourceCoordinate:
      CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinate
    readonly buildSourceArtifactRef: z.infer<typeof evidenceRefSchema>
    readonly buildSourceArchiveEntries:
      readonly CanonicalTrackAllSam31L4TaskQaBuildSourceEntry[]
    readonly buildSourceArchiveEntrySetSha256: string
    readonly buildSourceArchiveDirectoryEntries: readonly string[]
    readonly requirementsLockSha256: string
    readonly opencvBuildInformationSha256: string
    readonly opencvLicenseSha256: string
    readonly opencvContribLicenseSha256: string
    readonly preparedAt: string
  },
) {
  const coordinate =
    canonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinateSchema.parse(
      input.buildSourceCoordinate,
    )
  const entries = z.array(canonicalTrackAllSam31L4TaskQaBuildSourceEntrySchema)
    .min(10).max(10_000).parse(input.buildSourceArchiveEntries)
  const directories = z.array(z.string().min(1).max(512)
    .refine(isSafeArchivePath)).min(2).max(10_000)
    .parse(input.buildSourceArchiveDirectoryEntries)
  if (!isStrictlyOrderedUnique(entries.map((entry) => entry.path))
    || !isStrictlyOrderedUnique(directories)
    || sha256AuthorityValue(entries) !==
      input.buildSourceArchiveEntrySetSha256) {
    throw new Error('Track All L4 reviewed archive entry set changed.')
  }
  assertCompleteParentDirectories(entries, directories)
  assertExactReviewedDependencies({
    entries,
    requirementsLockSha256: input.requirementsLockSha256,
    opencvBuildInformationSha256: input.opencvBuildInformationSha256,
    opencvLicenseSha256: input.opencvLicenseSha256,
    opencvContribLicenseSha256: input.opencvContribLicenseSha256,
  })

  const archivePayload = archiveSafetyWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_ARCHIVE_SAFETY_REVIEW_VERSION,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_archive_safety_review_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'passed_for_private_candidate_image_build',
    reviewId: `track-all-l4-archive-safety-${coordinate.sha256.slice(0, 24)}`,
    reviewVersion: 1,
    operationId: 'tool.kornia.refine_mask.v1',
    buildSourceCoordinate: coordinate,
    buildSourceArtifactRef: input.buildSourceArtifactRef,
    regularFileEntrySetSha256: input.buildSourceArchiveEntrySetSha256,
    regularFileEntryCount: entries.length,
    directoryEntrySetSha256: sha256AuthorityValue(directories),
    directoryEntryCount: directories.length,
    totalArchiveEntryCount: entries.length + directories.length,
    totalUncompressedRegularFileBytes: entries.reduce(
      (total, entry) => total + entry.byteLength,
      0,
    ),
    exactCompressedBytesGenerationEtagAndSha256Reread: true,
    canonicalUstarRegularFilesAndRequiredDirectoriesOnly: true,
    parentDirectoryEntriesComplete: true,
    duplicateEntriesAbsent: true,
    absoluteTraversalBackslashAndControlPathsAbsent: true,
    symlinkHardlinkDeviceFifoSocketAndSparseEntriesAbsent: true,
    nonZeroTrailingDataAbsent: true,
    archiveEntryAllowlistPassed: true,
    cloudBuildGcsSourceFetcherCompatible: true,
    malwareContentClassificationClaimed: false,
    postBuildArtifactAnalysisRequired: true,
    customerMediaOrModelWeightsPresent: false,
    preparedAt: input.preparedAt,
  })
  const archiveSafetyReview =
    canonicalTrackAllSam31L4TaskQaArchiveSafetyReviewSchema.parse({
      ...archivePayload,
      reviewHash: sha256AuthorityValue(archivePayload),
    })
  const archiveSafetyReviewRef = archiveReviewRef(archiveSafetyReview)

  const dependencySeed = {
    pythonDependencies: PYTHON_DEPENDENCIES,
    inheritedRuntime: {
      image: 'pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
      pythonVersion: '3.12',
      torchVersion: '2.10.0+cu128',
      cudaToolkitVersion: '12.8',
      immutableDigestPinned: true,
      transitiveSbomAndVulnerabilityRereadRequiredAfterBuild: true,
    },
    opencvCuda: {
      version: '4.12.0',
      sourceCommitSha: '49486f61fb25722cbcf586b7f4320921d46fb38e',
      sourceArchiveSha256: '8f00b42869ab2836be36090f6631ae4c38ba59171e22a69a8e0f92f8ef1771d4',
      contribCommitSha: 'd943e1d61c8bc556a13783e1546ee7c1a9e0b1cf',
      contribArchiveSha256: '79b55fa0d0edc6b2766f20cc97baf9dcee5f974870d5afeb1f8e3c623623b59b',
      cudaArchitecture: '8.9',
      buildInformationSha256: input.opencvBuildInformationSha256,
      runtimeArtifactSetSha256: opencvRuntimeArtifactSetHash(entries),
      nonFreeAlgorithmsEnabled: false,
      fastMathEnabled: false,
    },
    cudaForwardCompatibility: {
      packageName: 'cuda-compat-12-8',
      packageVersion: '570.211.01-0ubuntu1',
      architecture: 'amd64',
      packageByteLength: 37_945_232,
      packageSha256: 'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
      debianControlSha256: 'c99dfe723c276cc4915446ec4341ab0f5eeae2d8cee0dd1f9234b19ce5121e57',
    },
  } as const
  const dependencyPayload = dependencyWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPENDENCY_REVIEW_VERSION,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_dependency_review_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'passed_for_private_candidate_image_build',
    reviewId: `track-all-l4-dependency-${coordinate.sha256.slice(0, 24)}`,
    reviewVersion: 1,
    operationId: 'tool.kornia.refine_mask.v1',
    buildSourceArtifactRef: input.buildSourceArtifactRef,
    archiveSafetyReviewRef,
    requirementsLockSha256: input.requirementsLockSha256,
    ...dependencySeed,
    dependencySetSha256: sha256AuthorityValue(dependencySeed),
    exactWheelSetMatchesHashLockedRequirements: true,
    runtimePackageDownloadsAllowed: false,
    pipNoIndexNoDependenciesAndRequireHashesRequired: true,
    pipCheckRequiredDuringImageBuild: true,
    callerPackageOrIndexSelectionAllowed: false,
    samCheckpointOrModelWeightsIncluded: false,
    baseImageTransitiveReleaseGranted: false,
    preparedAt: input.preparedAt,
  })
  const dependencyReview =
    canonicalTrackAllSam31L4TaskQaDependencyReviewSchema.parse({
      ...dependencyPayload,
      reviewHash: sha256AuthorityValue(dependencyPayload),
    })
  const dependencyReviewRef = dependencyReviewReference(dependencyReview)

  const licenseSeed = {
    pythonLicenses: PYTHON_LICENSES,
    opencvLicense: {
      version: '4.12.0',
      expression: 'Apache-2.0',
      sourceLicenseSha256: input.opencvLicenseSha256,
      contribLicenseSha256: input.opencvContribLicenseSha256,
      bundledThirdPartyNoticesRetained: true,
      postBuildSbomLicenseInventoryRequired: true,
    },
    cudaForwardCompatibilityLicense: {
      packageSha256: 'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
      expression: 'LicenseRef-NVIDIA-Driver',
      debianCopyrightSha256: '89b836340d5217ad1aca3097c0c7d00c85de24a2cc956361f755e08ae91df26e',
      proprietaryBinaryUnmodified: true,
      privateUseOnOwnedOrLeasedNvidiaInfrastructureOnly: true,
      publicRedistributionAuthorized: false,
    },
  } as const
  const licensePayload = licenseWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_LICENSE_REVIEW_VERSION,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_license_review_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'reviewed_for_private_candidate_image_build',
    reviewId: `track-all-l4-license-${coordinate.sha256.slice(0, 24)}`,
    reviewVersion: 1,
    operationId: 'tool.kornia.refine_mask.v1',
    buildSourceArtifactRef: input.buildSourceArtifactRef,
    dependencyReviewRef,
    ...licenseSeed,
    licenseSetSha256: sha256AuthorityValue(licenseSeed),
    privateCandidateImageBuildAllowed: true,
    runtimeReleaseAllowed: false,
    legalApprovalClaimed: false,
    publicImageOrBinaryDistributionAuthorized: false,
    postBuildSpdxSbomLicenseAndVulnerabilityRereadRequired: true,
    preparedAt: input.preparedAt,
  })
  const licenseReview =
    canonicalTrackAllSam31L4TaskQaLicenseReviewSchema.parse({
      ...licensePayload,
      reviewHash: sha256AuthorityValue(licensePayload),
    })

  return Object.freeze({
    archiveSafetyReview,
    dependencyReview,
    licenseReview,
    archiveSafetyReviewRef,
    dependencyReviewRef,
    licenseReviewRef: licenseReviewReference(licenseReview),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews(
  input: {
    readonly archiveSafetyReview: unknown
    readonly dependencyReview: unknown
    readonly licenseReview: unknown
    readonly buildSourceCoordinate:
      CanonicalTrackAllSam31L4TaskQaPrivateBuildSourceCoordinate
    readonly buildSourceArtifactRef: z.infer<typeof evidenceRefSchema>
    readonly buildSourceArchiveEntries:
      readonly CanonicalTrackAllSam31L4TaskQaBuildSourceEntry[]
    readonly buildSourceArchiveEntrySetSha256: string
    readonly buildSourceArchiveDirectoryEntries: readonly string[]
    readonly requirementsLockSha256: string
    readonly opencvBuildInformationSha256: string
    readonly opencvLicenseSha256: string
    readonly opencvContribLicenseSha256: string
  },
) {
  const archiveSafetyReview = assertArchiveReview(input.archiveSafetyReview)
  const dependencyReview = assertDependencyReview(input.dependencyReview)
  const licenseReview = assertLicenseReview(input.licenseReview)
  const expected = createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews({
    buildSourceCoordinate: input.buildSourceCoordinate,
    buildSourceArtifactRef: input.buildSourceArtifactRef,
    buildSourceArchiveEntries: input.buildSourceArchiveEntries,
    buildSourceArchiveEntrySetSha256:
      input.buildSourceArchiveEntrySetSha256,
    buildSourceArchiveDirectoryEntries:
      input.buildSourceArchiveDirectoryEntries,
    requirementsLockSha256: input.requirementsLockSha256,
    opencvBuildInformationSha256: input.opencvBuildInformationSha256,
    opencvLicenseSha256: input.opencvLicenseSha256,
    opencvContribLicenseSha256: input.opencvContribLicenseSha256,
    preparedAt: archiveSafetyReview.preparedAt,
  })
  if (
    dependencyReview.preparedAt !== archiveSafetyReview.preparedAt
    || licenseReview.preparedAt !== archiveSafetyReview.preparedAt
    || stableAuthorityStringify(archiveSafetyReview) !==
      stableAuthorityStringify(expected.archiveSafetyReview)
    || stableAuthorityStringify(dependencyReview) !==
      stableAuthorityStringify(expected.dependencyReview)
    || stableAuthorityStringify(licenseReview) !==
      stableAuthorityStringify(expected.licenseReview)
  ) throw new Error('Track All L4 private capsule reviews changed.')
  return expected
}

export function archiveReviewRef(
  value: unknown,
): z.infer<typeof evidenceRefSchema> {
  const review = assertArchiveReview(value)
  return evidenceRefSchema.parse({
    id: review.reviewId,
    version: review.reviewVersion,
    contentHash: `sha256:${review.reviewHash}`,
  })
}

export function dependencyReviewReference(
  value: unknown,
): z.infer<typeof evidenceRefSchema> {
  const review = assertDependencyReview(value)
  return evidenceRefSchema.parse({
    id: review.reviewId,
    version: review.reviewVersion,
    contentHash: `sha256:${review.reviewHash}`,
  })
}

export function licenseReviewReference(
  value: unknown,
): z.infer<typeof evidenceRefSchema> {
  const review = assertLicenseReview(value)
  return evidenceRefSchema.parse({
    id: review.reviewId,
    version: review.reviewVersion,
    contentHash: `sha256:${review.reviewHash}`,
  })
}

export function assertArchiveReview(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaArchiveSafetyReview {
  assertClosedPlainData(value, 'track_all_l4_archive_review')
  const review =
    canonicalTrackAllSam31L4TaskQaArchiveSafetyReviewSchema.parse(value)
  const { reviewHash, ...payload } = review
  if (reviewHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 archive review hash invalid.')
  }
  return review
}

export function assertDependencyReview(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaDependencyReview {
  assertClosedPlainData(value, 'track_all_l4_dependency_review')
  const review = canonicalTrackAllSam31L4TaskQaDependencyReviewSchema.parse(
    value,
  )
  const { reviewHash, ...payload } = review
  if (reviewHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 dependency review hash invalid.')
  }
  return review
}

export function assertLicenseReview(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaLicenseReview {
  assertClosedPlainData(value, 'track_all_l4_license_review')
  const review = canonicalTrackAllSam31L4TaskQaLicenseReviewSchema.parse(value)
  const { reviewHash, ...payload } = review
  if (reviewHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 license review hash invalid.')
  }
  return review
}

function dependencySetHash(value: z.infer<typeof dependencyWithoutHashSchema>) {
  return sha256AuthorityValue({
    pythonDependencies: value.pythonDependencies,
    inheritedRuntime: value.inheritedRuntime,
    opencvCuda: value.opencvCuda,
    cudaForwardCompatibility: value.cudaForwardCompatibility,
  })
}

function licenseSetHash(value: z.infer<typeof licenseWithoutHashSchema>) {
  return sha256AuthorityValue({
    pythonLicenses: value.pythonLicenses,
    opencvLicense: value.opencvLicense,
    cudaForwardCompatibilityLicense: value.cudaForwardCompatibilityLicense,
  })
}

function assertExactReviewedDependencies(
  input: {
    readonly entries: readonly CanonicalTrackAllSam31L4TaskQaBuildSourceEntry[]
    readonly requirementsLockSha256: string
    readonly opencvBuildInformationSha256: string
    readonly opencvLicenseSha256: string
    readonly opencvContribLicenseSha256: string
  },
): void {
  const byPath = new Map(input.entries.map((entry) => [entry.path, entry]))
  const requirements = byPath.get(
    'track_all_task_qa_private_build_input/python/requirements.lock.txt',
  )
  if (requirements?.sha256 !== input.requirementsLockSha256
    || input.requirementsLockSha256 !==
      '604f3858bb13b333d99c51aaf1a4c4a668b6a25408fc48fad37ca9778f58e5ac') {
    throw new Error('Track All L4 requirements lock is not reviewed.')
  }
  const requiredNative = new Map<string, string>([
    [
      'track_all_task_qa_private_build_input/opencv/opencv-build-information.txt',
      'd691f963c6132152b4c7f450550bf0ab458f0d89eabaadbaa6e5be8ecbd827ae',
    ],
    [
      'track_all_task_qa_private_build_input/opencv/LICENSE',
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    ],
    [
      'track_all_task_qa_private_build_input/opencv/CONTRIB_LICENSE',
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    ],
    [
      'track_all_task_qa_private_build_input/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb',
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    ],
  ])
  if (input.opencvBuildInformationSha256 !== requiredNative.values().next().value
    || input.opencvLicenseSha256 !==
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30'
    || input.opencvContribLicenseSha256 !==
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30') {
    throw new Error('Track All L4 native review hashes changed.')
  }
  for (const [path, expectedSha256] of requiredNative) {
    if (byPath.get(path)?.sha256 !== expectedSha256) {
      throw new Error(`Track All L4 native artifact ${path} changed.`)
    }
  }
  for (const dependency of PYTHON_DEPENDENCIES) {
    const observed = byPath.get(dependency.wheelPath)
    if (observed?.sha256 !== dependency.wheelSha256
      || observed.byteLength !== dependency.wheelByteLength) {
      throw new Error(`Track All L4 wheel ${dependency.normalizedName} changed.`)
    }
  }
}

function opencvRuntimeArtifactSetHash(
  entries: readonly CanonicalTrackAllSam31L4TaskQaBuildSourceEntry[],
): string {
  const prefix =
    'track_all_task_qa_private_build_input/opencv/install/'
  const runtimeEntries = entries
    .filter((entry) => entry.path.startsWith(prefix))
    .sort((left, right) => left.path < right.path ? -1 : 1)
  if (runtimeEntries.length < 1) {
    throw new Error('Track All L4 OpenCV CUDA runtime set is missing.')
  }
  const digest = createHash('sha256')
  for (const entry of runtimeEntries) {
    digest.update(
      `${entry.sha256}  ./${entry.path.slice(prefix.length)}\n`,
      'utf8',
    )
  }
  return digest.digest('hex')
}

function isStrictlyOrderedUnique(values: readonly string[]): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (!(values[index - 1] < values[index])) return false
  }
  return new Set(values).size === values.length
}

function isSafeArchivePath(path: string): boolean {
  return !path.startsWith('/')
    && !path.includes('\\')
    && [...path].every((character) => {
      const codePoint = character.codePointAt(0) ?? -1
      return codePoint > 31 && codePoint !== 127
    })
    && path.split('/').every((part) =>
      part.length > 0 && part !== '.' && part !== '..')
}

function assertCompleteParentDirectories(
  entries: readonly CanonicalTrackAllSam31L4TaskQaBuildSourceEntry[],
  directories: readonly string[],
): void {
  const directorySet = new Set(directories)
  for (const entry of entries) {
    const parts = entry.path.split('/')
    for (let index = 1; index < parts.length; index += 1) {
      if (!directorySet.has(parts.slice(0, index).join('/'))) {
        throw new Error('Track All L4 archive parent directory missing.')
      }
    }
  }
}

function assertClosedPlainData(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (current: unknown): void => {
    if (current === null || ['string', 'number', 'boolean'].includes(
      typeof current,
    )) return
    if (typeof current !== 'object') throw new Error(`${label}_not_data`)
    if (seen.has(current)) throw new Error(`${label}_cyclic`)
    seen.add(current)
    if (Array.isArray(current)) {
      if (Object.keys(current).length !== current.length) {
        throw new Error(`${label}_sparse_array`)
      }
      for (let index = 0; index < current.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(
          current,
          String(index),
        )
        if (!descriptor || descriptor.get || descriptor.set
          || !descriptor.enumerable) throw new Error(`${label}_unsafe_array`)
        visit(descriptor.value)
      }
      seen.delete(current)
      return
    }
    if (Object.getPrototypeOf(current) !== Object.prototype) {
      throw new Error(`${label}_not_plain`)
    }
    for (const key of Reflect.ownKeys(current)) {
      if (typeof key !== 'string') throw new Error(`${label}_symbol_key`)
      const descriptor = Object.getOwnPropertyDescriptor(current, key)
      if (!descriptor || descriptor.get || descriptor.set
        || !descriptor.enumerable) throw new Error(`${label}_unsafe_property`)
      visit(descriptor.value)
    }
    seen.delete(current)
  }
  visit(value)
}
