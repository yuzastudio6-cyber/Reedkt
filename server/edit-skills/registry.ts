import {
  EditSkillArtifactSchemaRegistry,
  InMemoryCreateOnlyEditSkillArtifactStore,
} from './core/edit-skill-artifact-store'
import { SkillCapabilityRegistry } from './core/skill-capability-registry'
import type { SkillReferenceCatalog } from './core/skill-capability-validator'
import { SkillEstimatorRegistry } from './core/skill-estimator-registry'
import { SkillQaRegistry } from './core/skill-qa-registry'
import { SkillQualificationRegistry } from './core/skill-qualification-registry'
import { registerBrollSkill } from './b-roll'
import { StandaloneCanonicalSoundSkillService } from './sound'
import { registerSoundSkill } from './sound/sound-shared-kernel-registration'
import { StandaloneCanonicalMusicSkillService } from './music'
import { registerMusicSkill } from './music/music-shared-kernel-registration'

export const editSkillCapabilityRegistry = new SkillCapabilityRegistry()
export const editSkillEstimatorRegistry = new SkillEstimatorRegistry()
export const editSkillQaRegistry = new SkillQaRegistry()
export const editSkillArtifactSchemaRegistry = new EditSkillArtifactSchemaRegistry()
export const editSkillQualificationRegistry = new SkillQualificationRegistry()
export const editSkillArtifactStore = new InMemoryCreateOnlyEditSkillArtifactStore(
  editSkillArtifactSchemaRegistry,
)

export const editSkillReferenceCatalog: SkillReferenceCatalog = {
  jobTypes: new Set(),
  toolOperations: new Set(),
  providerOperations: new Set(),
  sourceOperations: new Set(),
  noActionOperations: new Set(),
  phases: new Set(),
}

export const standaloneSoundSkillService = new StandaloneCanonicalSoundSkillService({
  artifacts: {
    async resolve() {
      throw new Error('Sound media execution requires the private server artifact resolver; shared planning does not expose paths.')
    },
    async privateOutputRoot() {
      throw new Error('Sound media execution requires the private server artifact resolver; shared planning does not expose paths.')
    },
  },
})

export const standaloneMusicSkillService = new StandaloneCanonicalMusicSkillService({
  artifacts: {
    async resolve() {
      throw new Error('Music media execution requires the private server artifact resolver; shared planning does not expose paths.')
    },
    async privateOutputRoot() {
      throw new Error('Music media execution requires the private server artifact resolver; shared planning does not expose paths.')
    },
  },
})

registerBrollSkill({
  capabilities: editSkillCapabilityRegistry,
  estimators: editSkillEstimatorRegistry,
  qa: editSkillQaRegistry,
  artifacts: editSkillArtifactSchemaRegistry,
  artifactStore: editSkillArtifactStore,
  qualifications: editSkillQualificationRegistry,
  catalog: editSkillReferenceCatalog,
})

registerSoundSkill({
  capabilities: editSkillCapabilityRegistry,
  estimators: editSkillEstimatorRegistry,
  qa: editSkillQaRegistry,
  artifacts: editSkillArtifactSchemaRegistry,
  artifactStore: editSkillArtifactStore,
  qualifications: editSkillQualificationRegistry,
  catalog: editSkillReferenceCatalog,
  service: standaloneSoundSkillService,
})

registerMusicSkill({
  capabilities: editSkillCapabilityRegistry,
  estimators: editSkillEstimatorRegistry,
  qa: editSkillQaRegistry,
  artifacts: editSkillArtifactSchemaRegistry,
  artifactStore: editSkillArtifactStore,
  qualifications: editSkillQualificationRegistry,
  catalog: editSkillReferenceCatalog,
  service: standaloneMusicSkillService,
})
