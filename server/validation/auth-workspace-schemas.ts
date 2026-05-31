import { z } from 'zod'
import { idSchema } from './common-schemas'

export const ensureProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z.string().trim().url().max(2048).optional(),
}).strict()

export const ensureWorkspaceSchema = z.object({
  workspaceName: z.string().trim().min(1).max(120).optional(),
}).strict()

export const workspaceMembershipCheckSchema = z.object({
  workspaceId: idSchema,
}).strict()

export const projectAccessCheckSchema = z.object({
  projectId: idSchema,
}).strict()

export type EnsureProfileInput = z.infer<typeof ensureProfileSchema>
export type EnsureWorkspaceInput = z.infer<typeof ensureWorkspaceSchema>
export type WorkspaceMembershipCheckInput = z.infer<typeof workspaceMembershipCheckSchema>
export type ProjectAccessCheckInput = z.infer<typeof projectAccessCheckSchema>
