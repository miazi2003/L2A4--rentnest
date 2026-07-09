import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db';
import { NotFoundError, BadRequestError } from '../../errors/appError';
import { IUpdateProfileInput, IChangePasswordInput } from './profile.validation';

/**
 * Retrieve the authenticated user's profile. Excludes the password.
 */
const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    throw new NotFoundError('User profile no longer exists');
  }

  return user;
};

/**
 * Update authenticated user's profile info (name and phone only).
 */
const updateProfile = async (userId: string, payload: IUpdateProfileInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User profile no longer exists');
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name,
      phone: payload.phone,
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

/**
 * Change the authenticated user's password. Hashes the new password.
 */
const changePassword = async (userId: string, payload: IChangePasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User profile no longer exists');
  }

  // 1. Verify current password matches using bcrypt
  const isMatch = await bcrypt.compare(payload.currentPassword, user.password);
  if (!isMatch) {
    throw new BadRequestError('Incorrect current password');
  }

  // 2. Prevent using the same password again
  const isSame = await bcrypt.compare(payload.newPassword, user.password);
  if (isSame) {
    throw new BadRequestError('New password must be different from current password');
  }

  // 3. Hash the new password and update
  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });
};

export const ProfileService = {
  getProfile,
  updateProfile,
  changePassword,
};
