import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../errors/appError';
import { ILoginInput, IRegisterInput } from './auth.interface';

/**
 * Generate a JWT token with userId, email, and role.
 */
const generateToken = (user: User): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: env.JWT_EXPIRES_IN as any,
    },
  );
};

/**
 * Remove sensitive parameters like password from User object.
 */
const sanitizeUser = (user: User) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...sanitized } = user;
  return sanitized;
};

/**
 * Register a new Tenant or Landlord user.
 */
const register = async (payload: IRegisterInput) => {
  // Defensive check against ADMIN role registration via API
  if ((payload.role as string) === UserRole.ADMIN) {
    throw new ConflictError('Admin registration is not allowed');
  }

  // Verify unique email
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ConflictError('Email is already registered');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // Save user in DB
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      phone: payload.phone,
      role: payload.role,
      status: UserStatus.ACTIVE,
    },
  });

  const accessToken = generateToken(user);

  return {
    accessToken,
    user: sanitizeUser(user),
  };
};

/**
 * Login a user verifying credentials and account status.
 */
const login = async (payload: ILoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  // Check user existence and password validity
  if (!user || !(await bcrypt.compare(payload.password, user.password))) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Reject login for banned accounts
  if (user.status === UserStatus.BANNED) {
    throw new UnauthorizedError('Your account has been banned');
  }

  const accessToken = generateToken(user);

  return {
    accessToken,
    user: sanitizeUser(user),
  };
};

/**
 * Fetch the authenticated user's details.
 */
const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return sanitizeUser(user);
};

export const AuthService = {
  register,
  login,
  getMe,
};
