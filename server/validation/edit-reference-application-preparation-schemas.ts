import { z } from 'zod'
import {
  EDIT_REFERENCE_APPLICATION_PREPARATION_INTENT_VERSION,
} from '../../src/types/edit-reference-production-application-preparation-api'

const id = z.string().trim().min(1).max(240)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

export const editReferenceApplicationPreparationIntentSchema = z.object({
  schemaVersion: z.literal(EDIT_REFERENCE_APPLICATION_PREPARATION_INTENT_VERSION),
  workspaceId: id,
  editReferenceId: id,
  studySessionId: id,
  dnaVersionId: id,
  expectedReferenceRevision: z.number().int().positive(),
  expectedDNAContentDigestSha256: sha256,
  applicationSource: z.enum(['setup_selector', 'chat_tag', 'session_panel']),
  targetUnderstandingPackageId: id,
  targetUnderstandingPackageDigestSha256: sha256,
  targetUnderstandingSourceStorageObjectRecordId: id,
  targetUnderstandingSourceMediaAssetId: id,
  targetUnderstandingEditBriefDigestSha256: sha256,
}).strict()
