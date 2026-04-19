import { z } from 'zod/v4';

export const editUserSchema = z.object({
  fullname: z.string().max(100).optional(),
  email: z.email().optional(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  saldo: z.number().min(0).optional(),
  status: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  expirationDate: z.string().optional(),
});

export const fullnameSchema = z.object({
  fullname: z.string().min(4, 'Fullname must be at least 4 characters').max(155, 'Fullname must be less than 155 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type EditUserInput = z.infer<typeof editUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type FullnameInput = z.infer<typeof fullnameSchema>;