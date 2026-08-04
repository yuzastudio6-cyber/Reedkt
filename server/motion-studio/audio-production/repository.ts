import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import {
  motionStudioAudioMixBindingDtoSchema,
  motionStudioAudioMixWorkspaceDtoSchema,
} from '../../../src/lib/motion-studio/contracts'
import type { MotionStudioAudioMixBindingDto } from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import type { MotionStudioProductionRow } from '../commands/types'
import type {
  MotionStudioAudioAuthorityRow,
  MotionStudioAudioMixArtifactRow,
  MotionStudioAudioMixAttemptRow,
  MotionStudioAudioMixBindingRow,
  MotionStudioAudioMixJobRow,
  MotionStudioAudioMixRepository,
} from './types'

const uuid = z.string().uuid()
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().min(1).max(240).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const integer = z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const requiredQualityGates = [
  'file_integrity','format','duration_sync','integrated_loudness','true_peak',
  'sample_clipping','cue_timing','speech_priority','rights_provenance',
] as const
const privateMixQualitySchema = z.object({
  schemaVersion: z.literal('motion-studio.private-audio-mix-quality-report.v1'),
  profileId: z.literal('motion_studio_storytelling_speech_safe_mix_v1'),
  integratedLufs: z.number().finite(), loudnessRangeLu: z.number().finite(),
  truePeakDbfs: z.number().finite(), samplePeakDbfs: z.number().finite(),
  sampleRateHertz: z.literal(48_000), channelCount: z.literal(2),
  sampleCountPerChannel: integer.positive(), durationFrames: integer.positive(),
  fps: z.union([z.literal(24), z.literal(30)]), speechPriorityRatio: z.number().finite(),
  gateResults: z.array(z.object({
    gate: z.enum(requiredQualityGates),
    result: z.literal('passed'), blocking: z.literal(true),
  }).strict()).length(9).superRefine((values, context) => {
    if(new Set(values.map((value)=>value.gate)).size!==requiredQualityGates.length){
      context.addIssue({code:z.ZodIssueCode.custom,message:'Private audio quality requires all nine distinct blocking gates.'})
    }
  }),
  qaEvidenceDigest: digest,
}).strict()
const productionSchema = z.object({
  id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId, owner_id: uuid,
  module_id: z.literal('storytelling'), module_catalog_version: z.literal('motion-studio-module-catalog-v1'),
  stage_profile_id: z.literal('motion-studio-storytelling-stage-profile-v1'),
  status: z.enum(['draft','planning','awaiting_review','approved_for_execution','producing','blocked','reviewing','delivery_ready','completed','archived']),
  current_stage: z.enum(['director_brief','story_understanding','research','story_script','references','motion_dna','voice','calibration_reel','scene_board','storyboard','animatic','scene_editor','picture_lock','sound_music','fine_cut','quality_control','delivery']),
  workspace_mode: z.enum(['guided','studio']),
  default_production_mode: z.enum(['generative_first','layered_first','native_graphics_first','footage_first','hybrid_directed']),
  user_facing_strategy: z.literal("Director's Hybrid"), record_version: z.coerce.number().int().positive(),
  created_at: z.string().min(1), updated_at: z.string().min(1),
}).strict()
const audioAuthoritySchema = z.object({
  id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId, production_id: uuid,
  approved_snapshot_id: uuid, mix_plan_version_id: uuid, mix_plan_content_digest: digest,
  timing_authority_digest: digest, created_by: uuid, immutable: z.literal(true),
}).strict()
const verifiedInputSchema = z.object({
  role: z.enum(['narration','music','foley','exact_sfx']), stemId: stableId, mediaAssetId: stableId,
  uploadIntentId: stableId, storageObjectRecordId: stableId, authorityRevision: z.number().int().positive(),
  authorityChecksumSha256: digest, storageIdentityHash: digest, checksumSha256: digest,
  byteLength: integer.min(44).max(24 * 1024 * 1024), mimeType: z.literal('audio/wav'),
  audioCodec: z.literal('pcm_s16le'), sampleRateHertz: z.literal(48_000),
  channelCount: z.union([z.literal(1),z.literal(2)]), sampleCountPerChannel: integer.positive(),
  durationMilliseconds: integer.positive(), startFrame: integer, endFrame: integer.positive(),
  cueAuthorityId: stableId, cueReason: z.string().min(8).max(360), rightsEvidenceId: stableId,
  bindingHash: digest,
}).strict()
const bindingSchema = z.object({
  id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId, production_id: uuid,
  source_audio_authority_id: uuid, source_approved_snapshot_id: uuid,
  execution_approved_snapshot_id: uuid, mix_plan_version_id: uuid, mix_plan_content_digest: digest,
  timing_authority_digest: digest, job_id: stableId, approved_work_item_id: uuid,
  cost_budget_id: stableId, profile_id: z.literal('motion_studio_storytelling_speech_safe_mix_v1'),
  fps: z.union([z.literal(24),z.literal(30)]), duration_frames: integer.positive(),
  sample_count_per_channel: integer.positive(), verified_inputs_json: z.array(verifiedInputSchema).length(4),
  input_digest: digest, created_by: uuid, created_at: z.string().min(1), immutable: z.literal(true),
}).strict()
const jobSchema = z.object({
  id: stableId, production_id: uuid, approved_snapshot_id: uuid, approved_work_item_id: uuid,
  cost_budget_id: stableId, work_item_type: z.literal('mix_motion_studio_storytelling_audio'),
  required_worker_class: z.literal('motion_studio_audio_mix_worker'),
  status: z.enum(['waiting','queued','claimed','running','cancel_requested','reconciliation_required','blocked','succeeded','failed','cancelled']),
  maximum_authorized_internal_cost_micros: integer, attempt_count: integer, max_attempts: integer.positive(),
}).strict()
const attemptSchema = z.object({
  id: stableId, job_id: stableId, attempt_number: z.number().int().positive(),
  status: z.enum(['claimed','running','succeeded','failed','cancelled','unknown']),
  failure_category: stableId.nullable(), started_at: z.string().nullable(), completed_at: z.string().nullable(),
}).strict()
const leaseSchema = z.object({
  id: uuid, job_id: stableId, attempt_id: stableId, credential_hash_sha256: digest,
  status: z.enum(['active','released','expired']), expires_at: z.string().min(1),
}).strict()
const artifactSchema = z.object({
  id: uuid, binding_id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId,
  production_id: uuid, job_id: stableId, attempt_id: stableId, private_object_identity_hash: digest,
  artifact_sha256: digest, byte_length: integer, mime_type: z.literal('audio/wav'),
  codec: z.literal('pcm_s16le'), sample_rate_hertz: z.literal(48_000), channel_count: z.literal(2),
  sample_count_per_channel: integer.positive(), duration_frames: integer.positive(),
  fps: z.union([z.literal(24),z.literal(30)]), integrated_lufs: z.coerce.number().finite(),
  loudness_range_lu: z.coerce.number().finite(), true_peak_dbfs: z.coerce.number().finite(),
  sample_peak_dbfs: z.coerce.number().finite(), speech_priority_ratio: z.coerce.number().finite(),
  quality_json: privateMixQualitySchema, qa_evidence_digest: digest, runtime_identity_digest: digest,
  normalization_attestation_digest: digest, measurement_attestation_digest: digest,
  probe_attestation_digest: digest, input_evidence_digest: digest, created_at: z.string().min(1),
  immutable: z.literal(true),
}).strict()
const costItemSchema = z.object({
  id: stableId, capability_or_tool_id: z.literal('ffmpeg'), rate_card_version_id: stableId,
  quantity: z.coerce.number().positive(), unit: z.literal('cpu_second'),
  maximum_authorized_internal_cost_micros: integer,
}).strict()
const rateCardSchema = z.object({
  id: stableId, unit: z.literal('cpu_second'), unit_price_micros: integer,
  minimum_charge_micros: integer, immutable: z.literal(true),
}).strict()
const usageLineSchema = z.object({
  cost_estimate_item_id: stableId, meter_id: z.literal('cpu_second'),
  quantity: z.coerce.number().nonnegative(), internal_cost_micros: integer,
  evidence_class: z.literal('infrastructure_metered'), evidence_digest: digest,
}).strict()
const completionSchema = z.object({
  completion: z.record(z.string(), z.unknown()), artifact: artifactSchema,
}).strict()

const PRODUCTION_SELECT = 'id,workspace_id,project_id,edit_session_id,owner_id,module_id,module_catalog_version,stage_profile_id,status,current_stage,workspace_mode,default_production_mode,user_facing_strategy,record_version,created_at,updated_at'
const AUTHORITY_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,approved_snapshot_id,mix_plan_version_id,mix_plan_content_digest,timing_authority_digest,created_by,immutable'
const BINDING_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,source_audio_authority_id,source_approved_snapshot_id,execution_approved_snapshot_id,mix_plan_version_id,mix_plan_content_digest,timing_authority_digest,job_id,approved_work_item_id,cost_budget_id,profile_id,fps,duration_frames,sample_count_per_channel,verified_inputs_json,input_digest,created_by,created_at,immutable'
const JOB_SELECT = 'id,production_id,approved_snapshot_id,approved_work_item_id,cost_budget_id,work_item_type,required_worker_class,status,maximum_authorized_internal_cost_micros,attempt_count,max_attempts'
const ATTEMPT_SELECT = 'id,job_id,attempt_number,status,failure_category,started_at,completed_at'
const LEASE_SELECT = 'id,job_id,attempt_id,credential_hash_sha256,status,expires_at'
const ARTIFACT_SELECT = 'id,binding_id,workspace_id,project_id,edit_session_id,production_id,job_id,attempt_id,private_object_identity_hash,artifact_sha256,byte_length,mime_type,codec,sample_rate_hertz,channel_count,sample_count_per_channel,duration_frames,fps,integrated_lufs,loudness_range_lu,true_peak_dbfs,sample_peak_dbfs,speech_priority_ratio,quality_json,qa_evidence_digest,runtime_identity_digest,normalization_attestation_digest,measurement_attestation_digest,probe_attestation_digest,input_evidence_digest,created_at,immutable'

export function createSupabaseMotionStudioAudioMixRepository(client: SupabaseClient): MotionStudioAudioMixRepository {
  return {
    async findProduction(productionId) {
      return readMaybe(await client.from('motion_studio_productions').select(PRODUCTION_SELECT).eq('id',productionId).maybeSingle(),productionSchema,'Motion Studio production') as MotionStudioProductionRow|undefined
    },
    async findAudioAuthority(productionId,audioAuthorityId) {
      return readMaybe(await client.from('motion_studio_audio_authorities').select(AUTHORITY_SELECT).eq('production_id',productionId).eq('id',audioAuthorityId).maybeSingle(),audioAuthoritySchema,'Storytelling audio authority') as MotionStudioAudioAuthorityRow|undefined
    },
    async createBinding(input) {
      return readRequired(await client.rpc('create_motion_studio_audio_mix_binding',{
        target_production_id:input.productionId,target_audio_authority_id:input.request.audioAuthorityId,
        target_source_approved_snapshot_id:input.request.sourceApprovedSnapshotId,
        target_execution_approved_snapshot_id:input.request.executionApprovedSnapshotId,
        target_mix_plan_version_id:input.request.mixPlanVersionId,
        target_mix_plan_content_digest:input.request.mixPlanContentDigest,target_job_id:input.request.jobId,
        target_fps:input.request.fps,target_duration_frames:input.request.durationFrames,
        target_verified_inputs_json:input.verifiedInputs,target_input_digest:input.inputDigest,
        target_actor_user_id:input.actorUserId,target_idempotency_key:input.idempotencyKey,
        target_request_hash:input.requestHash,
      }),bindingSchema,'Storytelling private audio mix binding') as MotionStudioAudioMixBindingRow
    },
    async readWorkspace(productionId) {
      const bindings=readMany(await client.from('motion_studio_audio_mix_bindings').select(BINDING_SELECT).eq('production_id',productionId).order('created_at',{ascending:false}).limit(50),bindingSchema,'Storytelling audio mix bindings') as MotionStudioAudioMixBindingRow[]
      if(!bindings.length)return motionStudioAudioMixWorkspaceDtoSchema.parse({productionId,state:'empty',bindings:[],warning:warning()})
      const jobIds=bindings.map((binding)=>binding.job_id)
      const jobs=readMany(await client.from('jobs').select(JOB_SELECT).in('id',jobIds),jobSchema,'Storytelling audio mix jobs') as MotionStudioAudioMixJobRow[]
      const attempts=readMany(await client.from('job_attempts').select(ATTEMPT_SELECT).in('job_id',jobIds).order('attempt_number',{ascending:false}),attemptSchema,'Storytelling audio mix attempts') as MotionStudioAudioMixAttemptRow[]
      const artifacts=readMany(await client.from('motion_studio_audio_mix_artifacts').select(ARTIFACT_SELECT).eq('production_id',productionId),artifactSchema,'Storytelling audio mix artifacts') as MotionStudioAudioMixArtifactRow[]
      const jobMap=new Map(jobs.map((job)=>[job.id,job]));const attemptMap=new Map<string,MotionStudioAudioMixAttemptRow>();for(const attempt of attempts)if(!attemptMap.has(attempt.job_id))attemptMap.set(attempt.job_id,attempt)
      const artifactMap=new Map(artifacts.map((artifact)=>[artifact.binding_id,artifact]))
      const dtos=bindings.map((binding)=>{const job=jobMap.get(binding.job_id);if(!job)throw invalidDatabase('Audio mix binding lost its job authority.');return bindingDto({binding,job,attempt:attemptMap.get(job.id),artifact:artifactMap.get(binding.id)})})
      const state=dtos.some((entry)=>entry.state==='ready_for_private_review')?'ready_for_private_review':dtos.some((entry)=>['failed','blocked','reconciliation_required'].includes(entry.state))?'attention_required':'active'
      return motionStudioAudioMixWorkspaceDtoSchema.parse({productionId,state,bindings:dtos,warning:warning()})
    },
    async findExecutionAuthority(bindingId,leaseId) {
      const binding=readMaybe(await client.from('motion_studio_audio_mix_bindings').select(BINDING_SELECT).eq('id',bindingId).maybeSingle(),bindingSchema,'Storytelling audio mix binding') as MotionStudioAudioMixBindingRow|undefined
      if(!binding)return undefined
      const job=readRequired(await client.from('jobs').select(JOB_SELECT).eq('id',binding.job_id).single(),jobSchema,'Storytelling audio mix job') as MotionStudioAudioMixJobRow
      const lease=readRequired(await client.from('worker_leases').select(LEASE_SELECT).eq('id',leaseId).eq('job_id',job.id).single(),leaseSchema,'Storytelling audio mix lease')
      const attempt=readRequired(await client.from('job_attempts').select(ATTEMPT_SELECT).eq('id',lease.attempt_id).eq('job_id',job.id).single(),attemptSchema,'Storytelling audio mix attempt') as MotionStudioAudioMixAttemptRow
      const artifact=readMaybe(await client.from('motion_studio_audio_mix_artifacts').select(ARTIFACT_SELECT).eq('binding_id',binding.id).maybeSingle(),artifactSchema,'Storytelling audio mix artifact') as MotionStudioAudioMixArtifactRow|undefined
      const costBindings=readMany(await client.from('job_cost_estimate_items').select('estimate_item_id').eq('job_id',job.id),z.object({estimate_item_id:stableId}).strict(),'Storytelling audio mix cost binding')
      if(costBindings.length!==1)throw invalidDatabase('Storytelling audio mix requires one exact CPU cost item.')
      const item=readRequired(await client.from('production_cost_estimate_items').select('id,capability_or_tool_id,rate_card_version_id,quantity,unit,maximum_authorized_internal_cost_micros').eq('id',costBindings[0]!.estimate_item_id).single(),costItemSchema,'Storytelling audio mix cost item')
      const card=readRequired(await client.from('provider_rate_card_versions').select('id,unit,unit_price_micros,minimum_charge_micros,immutable').eq('id',item.rate_card_version_id).single(),rateCardSchema,'Storytelling audio mix rate card')
      const usageRow=readMaybe(await client.from('production_usage_events').select('cost_estimate_item_id,meter_id,quantity,internal_cost_micros,evidence_class,evidence_digest').eq('attempt_id',attempt.id).eq('cost_estimate_item_id',item.id).maybeSingle(),usageLineSchema,'Storytelling audio mix attempt usage')
      const usage=usageRow?{costEstimateItemId:usageRow.cost_estimate_item_id,meterId:usageRow.meter_id,quantity:usageRow.quantity,internalCostMicros:usageRow.internal_cost_micros,evidenceClass:usageRow.evidence_class,evidenceDigest:usageRow.evidence_digest}:undefined
      return {binding,job,attempt,lease,cost:{estimateItemId:item.id,capabilityOrToolId:'ffmpeg',rateCardVersionId:item.rate_card_version_id,unit:'cpu_second',quantity:item.quantity,maximumAuthorizedInternalCostMicros:item.maximum_authorized_internal_cost_micros,unitPriceMicros:card.unit_price_micros,minimumChargeMicros:card.minimum_charge_micros},...(artifact?{artifact}:{}),...(usage?{usage}:{})}
    },
    async completeAttempt(input) {
      const response=readRequired(await client.rpc('complete_motion_studio_audio_mix_attempt',{
        target_binding_id:input.bindingId,target_lease_id:input.leaseId,target_credential_hash:input.credentialHash,
        target_private_object_identity_hash:input.privateObjectIdentityHash,target_artifact_sha256:input.result.artifact.sha256,
        target_byte_length:input.result.artifact.byteLength,target_quality_json:input.result.quality,
        target_runtime_identity_digest:input.result.evidence.runtimeIdentityDigest,
        target_normalization_attestation_digest:input.result.evidence.normalizationAttestationDigest,
        target_measurement_attestation_digest:input.result.evidence.measurementAttestationDigest,
        target_probe_attestation_digest:input.result.evidence.probeAttestationDigest,
        target_input_evidence_digest:input.result.evidence.inputEvidenceDigest,target_usage_json:input.usage,
        target_outcome_digest:input.outcomeDigest,target_actor_user_id:input.actorUserId,
        target_idempotency_key:input.idempotencyKey,target_request_hash:input.requestHash,
      }),completionSchema,'Storytelling audio mix completion')
      return response.artifact as MotionStudioAudioMixArtifactRow
    },
    async findArtifact(artifactId){return readMaybe(await client.from('motion_studio_audio_mix_artifacts').select(ARTIFACT_SELECT).eq('id',artifactId).maybeSingle(),artifactSchema,'Storytelling audio mix artifact') as MotionStudioAudioMixArtifactRow|undefined},
    bindingDto,
  }
}

function bindingDto(input:{binding:MotionStudioAudioMixBindingRow;job:MotionStudioAudioMixJobRow;attempt?:MotionStudioAudioMixAttemptRow;artifact?:MotionStudioAudioMixArtifactRow}):MotionStudioAudioMixBindingDto{
  const state=input.artifact?'ready_for_private_review':input.job.status==='succeeded'?'blocked':input.job.status==='queued'&&input.job.attempt_count>0?'resumable':input.job.status==='queued'?'queued':['claimed','running','cancel_requested'].includes(input.job.status)?'in_progress':input.job.status==='reconciliation_required'?'reconciliation_required':input.job.status==='failed'?'failed':input.job.status==='cancelled'?'cancelled':'blocked'
  return motionStudioAudioMixBindingDtoSchema.parse({bindingId:input.binding.id,productionId:input.binding.production_id,audioAuthorityId:input.binding.source_audio_authority_id,sourceApprovedSnapshotId:input.binding.source_approved_snapshot_id,executionApprovedSnapshotId:input.binding.execution_approved_snapshot_id,mixPlanVersionId:input.binding.mix_plan_version_id,mixPlanContentDigest:input.binding.mix_plan_content_digest,jobId:input.binding.job_id,profileId:input.binding.profile_id,state,fps:input.binding.fps,durationFrames:input.binding.duration_frames,sampleCountPerChannel:input.binding.sample_count_per_channel,inputs:input.binding.verified_inputs_json.map((entry)=>({role:entry.role,stemId:entry.stemId,mediaAssetId:entry.mediaAssetId,checksumSha256:entry.checksumSha256,startFrame:entry.startFrame,endFrame:entry.endFrame,cueAuthorityId:entry.cueAuthorityId,cueReason:entry.cueReason,rightsEvidenceId:entry.rightsEvidenceId,mimeType:entry.mimeType,audioCodec:entry.audioCodec,sampleRateHertz:entry.sampleRateHertz,channelCount:entry.channelCount,sampleCountPerChannel:entry.sampleCountPerChannel})),attemptCount:input.job.attempt_count,...(input.attempt?{latestAttemptNumber:input.attempt.attempt_number}:{}),providerCostMicros:0,customerPricingIncluded:false,customerCreditsIncluded:false,...(input.artifact?{artifact:{artifactId:input.artifact.id,sha256:input.artifact.artifact_sha256,byteLength:input.artifact.byte_length,mimeType:'audio/wav',codec:'pcm_s16le',sampleRateHertz:48000,channelCount:2,sampleCountPerChannel:input.artifact.sample_count_per_channel,durationFrames:input.artifact.duration_frames,fps:input.artifact.fps,quality:{integratedLufs:input.artifact.integrated_lufs,loudnessRangeLu:input.artifact.loudness_range_lu,truePeakDbfs:input.artifact.true_peak_dbfs,samplePeakDbfs:input.artifact.sample_peak_dbfs,speechPriorityRatio:input.artifact.speech_priority_ratio,gateResults:input.artifact.quality_json.gateResults,qaEvidenceDigest:input.artifact.qa_evidence_digest},privateReviewOnly:true,contentPath:`/v1/motion-studio/audio-mix-artifacts/${input.artifact.id}/content`}}:{}),createdAt:canonicalIsoDateTime(input.binding.created_at)})
}

function canonicalIsoDateTime(value:string):string{
  const parsed=new Date(value)
  if(Number.isNaN(parsed.getTime()))throw invalidDatabase('Storytelling audio mix binding returned an invalid creation timestamp.')
  return parsed.toISOString()
}

function warning(){return 'Private Storytelling audio mix only. External providers, timeline, render, export, billing, customer pricing, credits, deployment, and public delivery remain disabled.'}
function readMaybe<T>(response:{data:unknown;error:PostgrestError|null},schema:z.ZodType<T>,label:string):T|undefined{if(response.error)throw databaseError(label,response.error);if(response.data===null)return undefined;const parsed=schema.safeParse(response.data);if(!parsed.success)throw invalidDatabase(`${label} returned an invalid record.`,parsed.error.flatten());return parsed.data}
function readMany<T>(response:{data:unknown;error:PostgrestError|null},schema:z.ZodType<T>,label:string):T[]{if(response.error)throw databaseError(label,response.error);const parsed=z.array(schema).safeParse(response.data);if(!parsed.success)throw invalidDatabase(`${label} returned invalid records.`,parsed.error.flatten());return parsed.data}
function readRequired<T>(response:{data:unknown;error:PostgrestError|null},schema:z.ZodType<T>,label:string):T{const value=readMaybe(response,schema,label);if(value===undefined)throw invalidDatabase(`${label} was missing.`);return value}
function invalidDatabase(message:string,details?:unknown):ApiError{return new ApiError('INTERNAL_ERROR',message,500,details,{internal:true})}
function databaseError(label:string,error:PostgrestError):ApiError{const status=error.code==='42501'?403:error.code==='P0002'?404:['22023','23514'].includes(error.code)?400:['23503','23505','55000'].includes(error.code)?409:500;return new ApiError(status===403?'WORKSPACE_ACCESS_DENIED':status===404?'MOTION_STUDIO_NOT_FOUND':status===400?'VALIDATION_FAILED':status===409?'MOTION_STUDIO_CONFLICT':'INTERNAL_ERROR',`${label} could not be read or persisted.`,status)}
