import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'BANNED'] as const, {
    message: 'Status must be either ACTIVE or BANNED',
  }),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format. Must be a valid UUID'),
});

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().positive('page must be a positive integer').default(1),
  limit: z.coerce.number().int().positive('limit must be a positive integer').default(10),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'LANDLORD', 'TENANT'] as const).optional(),
  status: z.enum(['ACTIVE', 'BANNED'] as const).optional(),
  sortBy: z.enum(['createdAt', 'name'] as const).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'] as const).default('desc'),
});

export type IUpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type IAdminUserQuery = z.infer<typeof adminUserQuerySchema>;
