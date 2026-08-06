import assert from 'node:assert/strict'

import type {
  LivingFrameRemotionProfile,
} from '../../src/types/living-frame-remotion-profile'
import type {
  LivingFrameRemotionMotionSampleBinding,
} from '../../src/types/living-frame-remotion-motion-sample-binding'
import {
  livingFrameChoreographyFixtureMotionBundle,
} from './living-frame-choreography-binding-smoke'
import {
  livingFrameRemotionProfileFixture,
} from './living-frame-remotion-profile-smoke'
import {
  compileLivingFrameRemotionMotionSampleBinding,
  verifyLivingFrameRemotionMotionSampleBinding,
} from '../living-frame/living-frame-remotion-motion-sample-binding'
import {
  verifyLivingFrameRemotionProfileDigest,
} from '../living-frame/living-frame-remotion-profile'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const motion = structuredClone(
  livingFrameChoreographyFixtureMotionBundle,
)
const sourceProfile = structuredClone(
  livingFrameRemotionProfileFixture,
)
const routeTrack = motion.tracks.find(
  (track) => track.trackId === 'track.hormuz-route-reveal',
)
assert.ok(routeTrack)

const compatibleProfile = signProfile({
  ...withoutProfileDigest(sourceProfile),
  layers: sourceProfile.layers.map((layer) => ({
    ...layer,
    componentId: routeTrack.componentId,
    motionTrackIds: [routeTrack.trackId],
    motionSampleCount: routeTrack.samples.length,
  })),
  metrics: {
    ...sourceProfile.metrics,
    motionTrackCount: 1,
    motionSampleCount: routeTrack.samples.length,
  },
})
assert.equal(
  verifyLivingFrameRemotionProfileDigest(compatibleProfile),
  true,
)

const compatible =
  compileLivingFrameRemotionMotionSampleBinding({
    remotionProfile: compatibleProfile,
    motionBundle: motion,
  })
assert.equal(
  verifyLivingFrameRemotionMotionSampleBinding(compatible),
  true,
)
assert.equal(
  compatible.bindingState,
  'candidate_samples_bound_pending_protocol',
)
assert.equal(compatible.layerBindings.length, 1)
assert.equal(compatible.cameraBindings.length, 0)
assert.equal(
  compatible.layerBindings[0]?.sourceProfileMotionTrackIds[0],
  routeTrack.trackId,
)
assert.equal(
  compatible.layerBindings[0]?.motionTracks[0]?.trackId,
  routeTrack.trackId,
)
assert.equal(
  compatible.layerBindings[0]?.compiledMotionSampleCount,
  routeTrack.samples.length,
)
assert.equal(
  compatible.metrics.referencedSampleCount,
  routeTrack.samples.length,
)
assert.equal(
  compatible.blockerCodes.includes(
    'offline_remotion_protocol_profile_admission_required',
  ),
  true,
)
assert.equal(
  compatible.blockerCodes.includes(
    'motion_sample_count_mismatch',
  ),
  false,
)
assert.equal(
  compatible.authorityBoundary.masterTimingAuthority,
  false,
)
assert.equal(
  compatible.authorityBoundary.artifactCommitmentAuthority,
  false,
)
assert.equal(
  compatible.authorityBoundary.remotionProtocolAuthority,
  false,
)
assert.equal(
  compatible.authorityBoundary.remotionExecutionAuthority,
  false,
)
assert.equal(
  compatible.authorityBoundary.productionAuthority,
  false,
)
assert.equal(compatible.createsArtifactCommitments, false)
assert.equal(
  compatible.createsWorkItemsOrAssetManifestEntries,
  false,
)
assert.equal(compatible.subjectSpecificRouting, false)
assert.equal(compatible.remotionExecutionStillForbidden, true)

const structurallyBlocked =
  compileLivingFrameRemotionMotionSampleBinding({
    remotionProfile: sourceProfile,
    motionBundle: motion,
  })
assert.equal(
  structurallyBlocked.bindingState,
  'blocked_by_profile_or_track_lineage',
)
assert.equal(
  structurallyBlocked.blockerCodes.includes(
    'motion_track_owner_component_mismatch',
  ),
  true,
)
assert.equal(
  structurallyBlocked.blockerCodes.includes(
    'motion_sample_count_mismatch',
  ),
  true,
)
assert.equal(
  verifyLivingFrameRemotionMotionSampleBinding(
    structurallyBlocked,
  ),
  true,
)

const replay = compileLivingFrameRemotionMotionSampleBinding({
  remotionProfile: compatibleProfile,
  motionBundle: motion,
})
assert.equal(
  replay.bindingDigestSha256,
  compatible.bindingDigestSha256,
)

const adversarial: unknown[] = [
  {
    ...compatible,
    providerId: 'provider.forbidden',
  },
  signBinding({
    ...withoutBindingDigest(compatible),
    createsArtifactCommitments: true,
  }),
  signBinding({
    ...withoutBindingDigest(compatible),
    createsWorkItemsOrAssetManifestEntries: true,
  }),
  signBinding({
    ...withoutBindingDigest(compatible),
    subjectSpecificRouting: true,
    subjectRoute: 'special_case',
  }),
  signBinding({
    ...withoutBindingDigest(compatible),
    remotionExecutionStillForbidden: false,
  }),
  signBinding({
    ...withoutBindingDigest(compatible),
    authorityBoundary: {
      ...compatible.authorityBoundary,
      masterTimingAuthority: true,
      artifactCommitmentAuthority: true,
      approvalAuthority: true,
      remotionProtocolAuthority: true,
      remotionExecutionAuthority: true,
      productionAuthority: true,
    },
  }),
  signBinding({
    ...withoutBindingDigest(compatible),
    layerBindings: compatible.layerBindings.map((binding) => ({
      ...binding,
      sourceProfileMotionTrackIds: ['track.missing'],
    })),
  }),
  signBinding({
    ...withoutBindingDigest(compatible),
    layerBindings: compatible.layerBindings.map((binding) => ({
      ...binding,
      compiledMotionSampleCount:
        binding.compiledMotionSampleCount + 1,
    })),
  }),
  signBinding({
    ...withoutBindingDigest(compatible),
    blockerCodes: [],
    bindingState: 'candidate_samples_bound_pending_protocol',
  }),
]

for (const [index, packet] of adversarial.entries()) {
  assert.equal(
    verifyLivingFrameRemotionMotionSampleBinding(packet),
    false,
    `adversarial motion-sample packet ${index} must fail`,
  )
}

assert.throws(
  () => compileLivingFrameRemotionMotionSampleBinding({
    remotionProfile: compatibleProfile,
    motionBundle: {
      ...motion,
      bundleDigestSha256: hash('wrong-motion'),
    },
  }),
  /input is invalid/,
)
assert.throws(
  () => compileLivingFrameRemotionMotionSampleBinding({
    remotionProfile: signProfile({
      ...withoutProfileDigest(compatibleProfile),
      masterTiming: {
        ...compatibleProfile.masterTiming,
        masterTimingPlanDigestSha256: hash('wrong-timing'),
      },
    }),
    motionBundle: motion,
  }),
  /stale/,
)

console.log(JSON.stringify({
  suite: 'living-frame-remotion-motion-sample-binding',
  genericCompatibleExamples: 1,
  genericBlockedExamples: 1,
  adversarialAssertions: adversarial.length + 2,
  deterministicReplay: true,
  exactSampleCountBound: routeTrack.samples.length,
  createsArtifactCommitments: false,
  createsWorkOrManifestEntries: false,
  remotionProtocolAuthorityGranted: false,
  remotionExecutionAuthorityGranted: false,
  productionAuthorityGranted: false,
  subjectSpecificRouting: false,
}, null, 2))

function withoutProfileDigest(
  profile: LivingFrameRemotionProfile,
): Omit<LivingFrameRemotionProfile, 'profileDigestSha256'> {
  const { profileDigestSha256: _ignored, ...draft } = profile
  void _ignored
  return draft
}

function signProfile(
  draft: Omit<LivingFrameRemotionProfile, 'profileDigestSha256'>,
): LivingFrameRemotionProfile {
  return {
    ...draft,
    profileDigestSha256: sha256AuthorityValue(draft),
  }
}

function withoutBindingDigest(
  binding: LivingFrameRemotionMotionSampleBinding,
): Omit<
  LivingFrameRemotionMotionSampleBinding,
  'bindingDigestSha256'
> {
  const { bindingDigestSha256: _ignored, ...draft } = binding
  void _ignored
  return draft
}

function signBinding(
  draft: Record<string, unknown>,
): unknown {
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}

function hash(value: string): string {
  return sha256AuthorityValue(value)
}
