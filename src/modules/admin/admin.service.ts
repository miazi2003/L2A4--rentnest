import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../errors/appError';
import { IAdminUserQuery, IUpdateUserStatusInput } from './admin.validation';

/**
 * Retrieve all users with searching, filtering, and sorting options. Never returns password hashes.
 */
const getAllUsers = async (query: IAdminUserQuery) => {
  const { page, limit, search, role, status, sortBy, sortOrder } = query;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const orderBy: Prisma.UserOrderByWithRelationInput = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder || 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }

const total = await prisma.user.count({
  where,
});

const users = await prisma.user.findMany({
  where,
  skip,
  take,
  orderBy,
  select: {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  },
});

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: users,
  };
};

/**
 * Retrieve details of a single user by ID. Returns 404 if user not found. Excludes password.
 */
const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

/**
 * Update user status to ACTIVE or BANNED. Enforces rules prohibiting self-banning or banning fellow administrators.
 */
const updateUserStatus = async (id: string, adminId: string, payload: IUpdateUserStatusInput) => {
  // Prevent self status modification
  if (id === adminId) {
    throw new BadRequestError('You cannot modify your own user status');
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Prevent banning another ADMIN user
  if (user.role === 'ADMIN' && payload.status === 'BANNED') {
    throw new ForbiddenError('Administrators cannot ban other admin accounts');
  }

  return prisma.user.update({
    where: { id },
    data: {
      status: payload.status,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const AdminUserService = {
  getAllUsers,
  getUserById,
  updateUserStatus,
};
