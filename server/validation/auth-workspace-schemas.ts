import { z } from 'zod'

export const canonicalUuidSchema = z.string().uuid()

export const ensureProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z.string().trim().url().max(2048).optional(),
}).strict()

export const ensureWorkspaceSchema = z.object({
  workspaceName: z.string().trim().min(1).max(120).optional(),
}).strict()

export const workspaceMembershipCheckSchema = z.object({
  workspaceId: canonicalUuidSchema,
}).strict()

export const projectAccessCheckSchema = z.object({
  projectId: canonicalUuidSchema,
}).strict()

export type EnsureProfileInput = z.infer<typeof ensureProfileSchema>
export type EnsureWorkspaceInput = z.infer<typeof ensureWorkspaceSchema>
export type WorkspaceMembershipCheckInput = z.infer<typeof workspaceMembershipCheckSchema>
export type ProjectAccessCheckInput = z.infer<typeof projectAccessCheckSchema>
