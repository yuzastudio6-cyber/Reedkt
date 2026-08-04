import {
  editSkillArtifactSchemaRegistry,
  editSkillCapabilityRegistry,
  editSkillEstimatorRegistry,
  editSkillQaRegistry,
  editSkillReferenceCatalog,
} from '../edit-skills/registry'
import { validateSkillCapabilityManifests } from '../edit-skills/core/skill-capability-validator'

const result = validateSkillCapabilityManifests({
  registry: editSkillCapabilityRegistry,
  estimators: editSkillEstimatorRegistry,
  qa: editSkillQaRegistry,
  artifacts: editSkillArtifactSchemaRegistry,
  catalog: editSkillReferenceCatalog,
})

console.log(JSON.stringify({
  status: 'ok',
  manifestCount: result.manifestCount,
  manifestHashes: result.manifestHashes,
}, null, 2))
