import { z } from 'zod/v4';

export const createReferralSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  setSaldo: z.number().min(0),
  accExpirationDays: z.number().int().min(1).max(365),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;