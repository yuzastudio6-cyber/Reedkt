import type {
  ArtifactApproval,
  LayerPlan,
  ManualOverride,
  MotionLanguageDefinition,
  MotionStudioArtifactVersion,
  MotionStudioCommandEnvelope,
  MotionStudioOwnership,
  MotionStudioProduction,
  MotionStudioProviderRequest,
  NarrativeFunctionDefinition,
  ProductionRoute,
  ProductionCostActual,
  ProductionCostAdjustment,
  ProductionCostBudget,
  ProductionCostEstimate,
  ProductionCostEstimateItem,
  ProductionCostReconciliation,
  ProductionUsageEvent,
  ProviderRateCard,
  PropertyLock,
  SceneDocument,
  SceneRecipe,
  SceneRecipeInstantiation,
  ToolCostProfile,
} from '../../../types/motion-studio'
import {
  motionStudioArtifactApprovalSchema,
  motionStudioArtifactVersionSchema,
  motionStudioCommandEnvelopeSchema,
  motionStudioLayerPlanSchema,
  motionStudioManualOverrideSchema,
  motionStudioMotionLanguageDefinitionSchema,
  motionStudioNarrativeFunctionDefinitionSchema,
  motionStudioProductionSchema,
  motionStudioProviderRequestSchema,
  motionStudioSceneDocumentSchema,
  motionStudioSceneRecipeSchema,
  motionStudioSceneRecipeInstantiationSchema,
  motionStudioProductionRouteSchema,
  productionCostActualSchema,
  productionCostAdjustmentSchema,
  productionCostBudgetSchema,
  productionCostEstimateSchema,
  productionCostEstimateItemSchema,
  productionCostReconciliationSchema,
  productionUsageEventSchema,
  providerRateCardSchema,
  toolCostProfileSchema,
} from './schemas'
import { validateMotionStudioDeepValue } from './safe-values'

export interface MotionStudioValidationResult {
  ok: boolean
  errors: string[]
}

const forbiddenInternalCostKeys = new Set([
  'customerPrice',
  'customerPriceMicros',
  'customerCredits',
  'serviceFee',
  'serviceFeeMicros',
  'reeditproFee',
  'reeditproFeeMicros',
  'margin',
  'markup',
  'tax',
  'discount',
  'walletBalance',
  'settlementAmount',
])

const forbiddenSceneDocumentKeys = new Set([
  'project',
  'projectSystem',
  'permissionSystem',
  'assetStore',
  'timeline',
  'timelineManifest',
  'renderer',
  'wallet',
  'billing',
  'job',
  'jobQueue',
  'mutableJobState',
  'providerCredentials',
  'providerSecret',
  'providerApiKey',
  'signedUrl',
  'executableCode',
  'fileBlob',
  'fileBytes',
  'workerState',
  'export',
  'exportSystem',
  'exportSettings',
])

function errorsFromSchema(result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } }): string[] {
  if (result.success || !result.error) return []
  return result.error.issues.map((issue) => `${issue.path.join('.') || 'record'}: ${issue.message}`)
}

function findForbiddenKeys(value: unknown, forbidden: ReadonlySet<string>, path: string[] = []): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenKeys(item, forbidden, [...path, String(index)]))
  }
  const normalizedForbidden = new Set([...forbidden].map((key) => key.toLowerCase().replace(/[^a-z0-9]/g, '')))
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const next = [...path, key]
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    return [
      ...(normalizedForbidden.has(normalized) ? [next.join('.')] : []),
      ...findForbiddenKeys(child, forbidden, next),
    ]
  })
}

function isSafeMicros(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0
}

function findInvalidMicros(value: unknown, path: string[] = []): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findInvalidMicros(item, [...path, String(index)]))
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const next = [...path, key]
    const ownErrors = key.endsWith('Micros') && (typeof child !== 'number' || !isSafeMicros(child))
      ? [next.join('.')]
      : []
    return [...ownErrors, ...findInvalidMicros(child, next)]
  })
}

function validateInternalCostRecord(value: unknown): string[] {
  const errors: string[] = []
  errors.push(...findInvalidMicros(value).map((path) => `${path} must be non-negative safe integer micros.`))
  errors.push(...findForbiddenKeys(value, forbiddenInternalCostKeys).map((path) =>
    `Internal-cost record contains forbidden commercial field at ${path}.`,
  ))
  errors.push(...validateMotionStudioDeepValue(value).errors)
  return errors
}

export function validateMatchingOwnership(...records: MotionStudioOwnership[]): MotionStudioValidationResult {
  const errors: string[] = []
  const expected = records[0]
  if (!expected) return { ok: false, errors: ['At least one ownership record is required.'] }
  for (const [index, record] of records.entries()) {
    if (
      record.workspaceId !== expected.workspaceId ||
      record.projectId !== expected.projectId ||
      record.editSessionId !== expected.editSessionId
    ) {
      errors.push(`Ownership record ${index} does not match the composite workspace/project/edit-session identity.`)
    }
  }
  return { ok: errors.length === 0, errors }
}

export function validateMotionStudioProduction(value: MotionStudioProduction): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioProductionSchema.safeParse(value))
  return { ok: errors.length === 0, errors }
}

export function validateMotionStudioArtifactVersion(value: MotionStudioArtifactVersion): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioArtifactVersionSchema.safeParse(value))
  if ((value.state === 'approved' || value.state === 'locked') && value.immutable !== true) {
    errors.push('Approved and locked artifact versions must be immutable.')
  }
  if (value.versionNumber > 1 && !value.parentVersionId) {
    errors.push('Version numbers after one require parentVersionId.')
  }
  errors.push(...validateMotionStudioDeepValue(value).errors)
  return { ok: errors.length === 0, errors }
}

export function validateArtifactApprovalBoundary(value: ArtifactApproval): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioArtifactApprovalSchema.safeParse(value))
  if (value.artifactVersion.artifactId !== value.artifactId) {
    errors.push('Artifact approval must bind the same artifact identity as its exact version reference.')
  }
  return { ok: errors.length === 0, errors }
}

export function validateArtifactApprovalAgainstVersion(
  approval: ArtifactApproval,
  version: MotionStudioArtifactVersion,
): MotionStudioValidationResult {
  const errors = [
    ...validateArtifactApprovalBoundary(approval).errors,
    ...validateMotionStudioArtifactVersion(version).errors,
    ...validateMatchingOwnership(approval, version).errors,
  ]
  if (
    approval.artifactId !== version.artifactId ||
    approval.artifactVersion.artifactId !== version.artifactId ||
    approval.artifactVersion.versionId !== version.id ||
    approval.artifactVersion.versionNumber !== version.versionNumber ||
    approval.artifactVersion.contentDigest !== version.contentDigest
  ) {
    errors.push('Artifact approval does not match the exact artifact version identity and digest.')
  }
  if (!['approved', 'locked'].includes(version.state) || version.immutable !== true) {
    errors.push('Artifact approval may only bind an immutable approved or locked artifact version.')
  }
  return { ok: errors.length === 0, errors }
}

export function validateSceneDocumentBoundary(value: SceneDocument): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioSceneDocumentSchema.safeParse(value))
  const forbiddenPaths = findForbiddenKeys(value, forbiddenSceneDocumentKeys)
  errors.push(...forbiddenPaths.map((path) => `SceneDocument contains forbidden ownership at ${path}.`))
  errors.push(...validateMotionStudioDeepValue(value).errors)
  if (value.brollReferences.some((item) => item.referenceKind !== 'existing_b_roll_asset')) {
    errors.push('B-roll may only be referenced from the existing asset/edit system.')
  }
  return { ok: errors.length === 0, errors }
}

export function validateSceneRecipeBoundary(value: SceneRecipe): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioSceneRecipeSchema.safeParse(value))
  if (/b[_ -]?roll/i.test(value.id) || /b[_ -]?roll/i.test(value.name)) {
    errors.push('B-roll workflows must not be represented as Motion Studio scene recipes.')
  }
  if (value.scope === 'workspace_private' && !value.workspaceId) {
    errors.push('Workspace-private recipes require workspaceId.')
  }
  if (value.scope === 'system' && value.workspaceId) {
    errors.push('System recipes must not be owned by a workspace.')
  }
  return { ok: errors.length === 0, errors }
}

export function validateMotionLanguageDefinition(value: MotionLanguageDefinition): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioMotionLanguageDefinitionSchema.safeParse(value))
  errors.push(...validateMotionStudioDeepValue(value).errors)
  return { ok: errors.length === 0, errors }
}

export function validateNarrativeFunctionDefinition(value: NarrativeFunctionDefinition): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioNarrativeFunctionDefinitionSchema.safeParse(value))
  errors.push(...validateMotionStudioDeepValue(value).errors)
  return { ok: errors.length === 0, errors }
}

export function validateApprovedSceneRecipeInstantiation(
  value: SceneRecipeInstantiation,
  recipe: SceneRecipe,
  languages: readonly MotionLanguageDefinition[],
  narrativeFunctions: readonly NarrativeFunctionDefinition[],
): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioSceneRecipeInstantiationSchema.safeParse(value))
  errors.push(...validateMotionStudioDeepValue(value).errors)
  if (
    value.recipeVersion.artifactId !== recipe.id ||
    value.recipeDefinitionVersion !== recipe.definitionVersion ||
    value.recipeDefinitionDigest !== recipe.definitionDigest
  ) {
    errors.push('Approved recipe instance must freeze the exact recipe identity, artifact version, definition version, and semantic definition digest.')
  }
  const compatibleLanguage = recipe.compatibleMotionLanguages.some((reference) =>
    reference.motionLanguageId === value.motionLanguage.motionLanguageId &&
    reference.motionLanguageVersion === value.motionLanguage.motionLanguageVersion &&
    reference.motionLanguageDigest === value.motionLanguage.motionLanguageDigest,
  )
  if (!compatibleLanguage) errors.push('Approved recipe instance uses a Motion Language not frozen by the recipe.')
  const languageDefinition = languages.find((definition) =>
    definition.id === value.motionLanguage.motionLanguageId &&
    definition.version === value.motionLanguage.motionLanguageVersion &&
    definition.contentDigest === value.motionLanguage.motionLanguageDigest,
  )
  if (!languageDefinition) errors.push('Approved recipe instance references a missing Motion Language version or digest.')

  const compatibleFunction = recipe.compatibleNarrativeFunctions.some((reference) =>
    reference.narrativeFunctionId === value.narrativeFunction.narrativeFunctionId &&
    reference.narrativeFunctionVersion === value.narrativeFunction.narrativeFunctionVersion &&
    reference.narrativeFunctionDigest === value.narrativeFunction.narrativeFunctionDigest,
  )
  if (!compatibleFunction) errors.push('Approved recipe instance uses a Narrative Function not frozen by the recipe.')
  const narrativeDefinition = narrativeFunctions.find((definition) =>
    definition.id === value.narrativeFunction.narrativeFunctionId &&
    definition.version === value.narrativeFunction.narrativeFunctionVersion &&
    definition.contentDigest === value.narrativeFunction.narrativeFunctionDigest,
  )
  if (!narrativeDefinition) errors.push('Approved recipe instance references a missing Narrative Function version or digest.')
  if (!recipe.compatibleProductionModes.includes(value.productionMode)) {
    errors.push('Approved recipe instance freezes a production mode not supported by the recipe.')
  }
  return { ok: errors.length === 0, errors }
}

export function validateProductionRouteAgainstRecipeInstance(
  route: ProductionRoute,
  instance: SceneRecipeInstantiation,
): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioProductionRouteSchema.safeParse(route))
  if (route.mode !== instance.productionMode) errors.push('Production Route must use the approved recipe instance production mode.')
  if (
    route.motionLanguage.motionLanguageId !== instance.motionLanguage.motionLanguageId ||
    route.motionLanguage.motionLanguageVersion !== instance.motionLanguage.motionLanguageVersion ||
    route.motionLanguage.motionLanguageDigest !== instance.motionLanguage.motionLanguageDigest
  ) errors.push('Production Route must use the exact approved Motion Language reference.')
  if (
    route.narrativeFunction.narrativeFunctionId !== instance.narrativeFunction.narrativeFunctionId ||
    route.narrativeFunction.narrativeFunctionVersion !== instance.narrativeFunction.narrativeFunctionVersion ||
    route.narrativeFunction.narrativeFunctionDigest !== instance.narrativeFunction.narrativeFunctionDigest
  ) errors.push('Production Route must use the exact approved Narrative Function reference.')
  if (
    route.sceneRecipeVersion.artifactId !== instance.recipeVersion.artifactId ||
    route.sceneRecipeVersion.versionId !== instance.recipeVersion.versionId ||
    route.sceneRecipeVersion.versionNumber !== instance.recipeVersion.versionNumber ||
    route.sceneRecipeVersion.contentDigest !== instance.recipeVersion.contentDigest
  ) errors.push('Production Route must use the exact approved Scene Recipe version reference.')
  if (route.sceneRecipeDefinitionVersion !== instance.recipeDefinitionVersion) {
    errors.push('Production Route must use the exact approved Scene Recipe definition version.')
  }
  if (route.sceneRecipeDefinitionDigest !== instance.recipeDefinitionDigest) {
    errors.push('Production Route must use the exact approved Scene Recipe semantic definition digest.')
  }
  return { ok: errors.length === 0, errors }
}

export function validateCommandAgainstLocks(
  command: MotionStudioCommandEnvelope,
  locks: PropertyLock[],
): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioCommandEnvelopeSchema.safeParse(command))
  errors.push(...validateMotionStudioDeepValue(command).errors)
  if (!command.baseVersionDigest || !command.idempotencyKey) {
    errors.push('Commands require a base version digest and idempotency key.')
  }
  for (const operation of command.operations) {
    const conflict = locks.find((lock) =>
      !lock.releasedAt &&
      (operation.targetPath === lock.targetPath || operation.targetPath.startsWith(`${lock.targetPath}/`)),
    )
    if (conflict && operation.kind !== 'release_property_lock') {
      errors.push(`Operation ${operation.operationId} conflicts with lock ${conflict.id}.`)
    }
  }
  return { ok: errors.length === 0, errors }
}

export function validateProviderRequestBoundary(value: MotionStudioProviderRequest): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioProviderRequestSchema.safeParse(value))
  const forbidden = new Set(['providerSecret', 'providerApiKey', 'providerCredentials', 'signedUrl', 'rawProviderPayload'])
  errors.push(...findForbiddenKeys(value, forbidden).map((path) => `Provider request contains forbidden field at ${path}.`))
  errors.push(...validateMotionStudioDeepValue(value).errors)
  return { ok: errors.length === 0, errors }
}

export function validateManualOverrideBoundary(value: ManualOverride): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioManualOverrideSchema.safeParse(value))
  errors.push(...validateMotionStudioDeepValue(value).errors)
  return { ok: errors.length === 0, errors }
}

export function validateLayerPlanBoundary(value: LayerPlan): MotionStudioValidationResult {
  const errors = errorsFromSchema(motionStudioLayerPlanSchema.safeParse(value))
  errors.push(...validateMotionStudioDeepValue(value).errors)
  return { ok: errors.length === 0, errors }
}

export function validateProviderRateCardBoundary(value: ProviderRateCard): MotionStudioValidationResult {
  const errors = errorsFromSchema(providerRateCardSchema.safeParse(value))
  errors.push(...validateInternalCostRecord(value))
  return { ok: errors.length === 0, errors }
}

export function validateToolCostProfileBoundary(value: ToolCostProfile): MotionStudioValidationResult {
  const errors = errorsFromSchema(toolCostProfileSchema.safeParse(value))
  errors.push(...validateInternalCostRecord(value))
  return { ok: errors.length === 0, errors }
}

export function validateProductionCostEstimateItemBoundary(value: ProductionCostEstimateItem): MotionStudioValidationResult {
  const errors = errorsFromSchema(productionCostEstimateItemSchema.safeParse(value))
  errors.push(...validateInternalCostRecord(value))
  if (!(value.lowInternalCostMicros <= value.expectedInternalCostMicros && value.expectedInternalCostMicros <= value.highInternalCostMicros)) {
    errors.push('Estimate item range must be ordered low <= expected <= high.')
  }
  if (value.maximumAuthorizedInternalCostMicros < value.highInternalCostMicros) {
    errors.push('Estimate item maximum authorization must cover its high estimate.')
  }
  return { ok: errors.length === 0, errors }
}

export function validateProductionCostEstimateBoundary(value: ProductionCostEstimate): MotionStudioValidationResult {
  const errors = errorsFromSchema(productionCostEstimateSchema.safeParse(value))
  const money = [
    value.lowInternalCostMicros,
    value.expectedInternalCostMicros,
    value.highInternalCostMicros,
    value.maximumAuthorizedInternalCostMicros,
  ]
  if (!money.every(isSafeMicros)) errors.push('All internal monetary values must be non-negative safe integer micros.')
  if (!(value.lowInternalCostMicros <= value.expectedInternalCostMicros && value.expectedInternalCostMicros <= value.highInternalCostMicros)) {
    errors.push('Internal estimate range must be ordered low <= expected <= high.')
  }
  if (value.maximumAuthorizedInternalCostMicros < value.highInternalCostMicros) {
    errors.push('Maximum authorized internal cost must cover the approved high estimate.')
  }
  errors.push(...validateInternalCostRecord(value))
  return { ok: errors.length === 0, errors }
}

export function validateProductionUsageEventBoundary(value: ProductionUsageEvent): MotionStudioValidationResult {
  const errors = errorsFromSchema(productionUsageEventSchema.safeParse(value))
  if (!isSafeMicros(value.internalCostMicros)) {
    errors.push('Usage internalCostMicros must be a non-negative safe integer.')
  }
  errors.push(...validateInternalCostRecord(value))
  return { ok: errors.length === 0, errors }
}

export function validateProductionCostBudgetBoundary(value: ProductionCostBudget): MotionStudioValidationResult {
  const errors = errorsFromSchema(productionCostBudgetSchema.safeParse(value))
  const values = [
    value.maximumAuthorizedInternalCostMicros,
    value.incurredInternalCostMicros,
    value.releasedInternalCostMicros,
  ]
  if (!values.every(isSafeMicros)) errors.push('Budget monetary values must be non-negative safe integer micros.')
  if (value.incurredInternalCostMicros + value.releasedInternalCostMicros > value.maximumAuthorizedInternalCostMicros) {
    errors.push('Incurred plus released internal cost cannot exceed maximum authorization.')
  }
  errors.push(...validateInternalCostRecord(value))
  return { ok: errors.length === 0, errors }
}

export function validateProductionCostActualBoundary(value: ProductionCostActual): MotionStudioValidationResult {
  const errors = errorsFromSchema(productionCostActualSchema.safeParse(value))
  errors.push(...validateInternalCostRecord(value))
  return { ok: errors.length === 0, errors }
}

export function validateProductionCostReconciliationBoundary(value: ProductionCostReconciliation): MotionStudioValidationResult {
  const errors = errorsFromSchema(productionCostReconciliationSchema.safeParse(value))
  errors.push(...validateInternalCostRecord(value))
  return { ok: errors.length === 0, errors }
}

export function validateProductionCostAdjustmentBoundary(value: ProductionCostAdjustment): MotionStudioValidationResult {
  const errors = errorsFromSchema(productionCostAdjustmentSchema.safeParse(value))
  errors.push(...validateInternalCostRecord(value))
  return { ok: errors.length === 0, errors }
}
