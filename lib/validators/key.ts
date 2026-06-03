import { z } from 'zod/v4';

export const generateKeySchema = z.object({
  game: z.string().min(1, 'Game is required'),
  duration: z.string().min(1),
  maxDevices: z.coerce.number().int().min(1).max(10),
  count: z.coerce.number().int().min(1).max(100).default(1),
});

export const editKeySchema = z.object({
  game: z.string().min(1).optional(),
  userKey: z.string().min(1).optional(),
  duration: z.string().min(1).optional(),
  maxDevices: z.coerce.number().int().min(1).max(10).optional(),
  status: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const connectSchema = z.object({
  game: z.string().regex(/^[a-zA-Z0-9_-]*$/, 'Invalid game format').optional(),
  user_key: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid key format'),
  serial: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid serial format'),
});

export const bulkDeleteSchema = z.object({
  filter: z.enum(['expired', 'blocked', 'unused', 'all']),
  game: z.string().optional(),
});

export const bulkDeleteAllSchema = z.object({
  deleteKeys: z.literal(true),
  deleteAll: z.literal(true),
});

export const extendKeySchema = z.object({
  keyId: z.string().min(1, 'Key ID is required'),
  additionalDays: z.number().int().min(1, 'Additional days must be at least 1'),
});

export type GenerateKeyInput = z.infer<typeof generateKeySchema>;
export type EditKeyInput = z.infer<typeof editKeySchema>;
export type ConnectInput = z.infer<typeof connectSchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type ExtendKeyInput = z.infer<typeof extendKeySchema>;

export function parseDuration(raw: string): number | '1h' | '3h' {
  if (raw === '1h' || raw === '3h') return raw;
  const num = parseInt(raw, 10);
  if (!isNaN(num) && num > 0) return num;
  throw new Error('Invalid duration');
}