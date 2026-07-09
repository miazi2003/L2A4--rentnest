import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  phone: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type IUpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type IChangePasswordInput = z.infer<typeof changePasswordSchema>;
