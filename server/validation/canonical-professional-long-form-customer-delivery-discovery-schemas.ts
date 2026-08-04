import { z } from 'zod'

const identity = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

export const professionalLongFormCustomerDeliveryDiscoveryQuerySchema =
  z.object({
    workspaceId: identity,
    approvedPlanSnapshotId: identity,
  }).strict()
