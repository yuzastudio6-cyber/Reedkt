export type ID = string
export type UUID = string
export type ISODateString = string
export type CurrencyCode = 'USD'
export type CreditAmount = number
export type Seconds = number
export type Milliseconds = number
export type FrameNumber = number
export type Timecode = string
export type Percentage = number

export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONValue[]

export interface JSONObject {
  [key: string]: JSONValue
}

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5' | 'let_ai_decide'

export type TargetPlatform =
  | 'tiktok_reels_shorts'
  | 'youtube'
  | 'website'
  | 'course_training'
  | 'client_review'
  | 'instagram'
  | 'linkedin'
  | 'custom'

export type RecordStatus = 'active' | 'archived' | 'deleted'

export type ApprovalStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revise_requested'
  | 'expired'

export type ProcessingStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'waiting_dependency'
  | 'waiting_user_input'
  | 'waiting_user_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying'

export type CreditImpact = 'none' | 'low' | 'medium' | 'high' | 'premium'

export type Priority = 'low' | 'normal' | 'high' | 'urgent'

export type ActorType =
  | 'user'
  | 'assistant'
  | 'system'
  | 'agent'
  | 'worker'
  | 'admin'

export interface BaseRecord {
  id: ID
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface OwnedRecord extends BaseRecord {
  userId: ID
  workspaceId: ID
}

export interface TimeRange {
  startSeconds: Seconds
  endSeconds: Seconds
  startFrame?: FrameNumber
  endFrame?: FrameNumber
  timecode?: Timecode
}

export interface AuditActor {
  actorType: ActorType
  actorId?: ID
  displayName?: string
}

export interface StatusReason {
  status: ProcessingStatus
  reason?: string
  details?: JSONObject
}

export const PROCESSING_STATUSES: ProcessingStatus[] = [
  'draft',
  'queued',
  'running',
  'waiting_dependency',
  'waiting_user_input',
  'waiting_user_approval',
  'completed',
  'failed',
  'cancelled',
  'retrying',
]

export const APPROVAL_STATUSES: ApprovalStatus[] = [
  'not_required',
  'pending',
  'approved',
  'rejected',
  'revise_requested',
  'expired',
]
