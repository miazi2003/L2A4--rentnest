import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { AuthProvider, User, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../errors/appError';
import { logger } from '../../utils/logger';
import {
  ILoginInput,
  IRegisterInput,
  IGoogleLoginInput,
  IFacebookLoginInput,
} from './auth.interface';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

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
      provider: AuthProvider.LOCAL,
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
  if (!user || !user.password || !(await bcrypt.compare(payload.password, user.password))) {
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
 * Authenticate or register a user using verified Google ID Token credential.
 */
const googleLogin = async (payload: IGoogleLoginInput) => {
  let googleEmail: string;
  let googleSub: string;
  let googleName: string | undefined;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const tokenPayload = ticket.getPayload();

    if (!tokenPayload?.email || !tokenPayload.sub) {
      throw new UnauthorizedError('Google authentication failed: Email and subject are required');
    }

    if (tokenPayload.email_verified !== true) {
      logger.warn('Google authentication rejected because the account email is not verified');
      throw new UnauthorizedError('Google authentication failed: A verified email is required');
    }

    googleEmail = tokenPayload.email.toLowerCase();
    googleSub = tokenPayload.sub;
    googleName = tokenPayload.name;
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Google authentication failed: Invalid or expired token');
  }

  // A provider subject is authoritative. Email linking is restricted to non-privileged tenants.
  let user = await prisma.user.findUnique({ where: { googleId: googleSub } });

  if (!user) {
    const emailUser = await prisma.user.findUnique({ where: { email: googleEmail } });

    if (emailUser) {
      if (emailUser.status === UserStatus.BANNED) {
        throw new UnauthorizedError('Your account has been banned');
      }

      if (emailUser.role === UserRole.ADMIN || emailUser.role === UserRole.LANDLORD) {
        logger.warn(`Blocked unsafe Google email-link attempt for privileged user ${emailUser.id}`);
        throw new ConflictError(
          'This account must use its existing sign-in method or explicitly link Google while authenticated.',
        );
      }

      if (
        emailUser.googleId ||
        (emailUser.provider !== AuthProvider.LOCAL && emailUser.provider !== AuthProvider.GOOGLE)
      ) {
        throw new ConflictError('This email is already associated with another sign-in method');
      }

      user = await prisma.user.update({
        where: { id: emailUser.id },
        data: { googleId: googleSub },
      });
    }
  }

  if (user) {
    // Check if banned
    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedError('Your account has been banned');
    }
  } else {
    // Create new TENANT user
    user = await prisma.user.create({
      data: {
        email: googleEmail,
        name: googleName || 'Google User',
        googleId: googleSub,
        provider: AuthProvider.GOOGLE,
        role: UserRole.TENANT,
        status: UserStatus.ACTIVE,
      },
    });
  }

  const accessToken = generateToken(user);

  return {
    accessToken,
    user: sanitizeUser(user),
  };
};

/**
 * Authenticate or register a user using verified Facebook access token.
 */
const facebookLogin = async (payload: IFacebookLoginInput) => {
  let fbId: string;
  let fbEmail: string;
  let fbName: string | undefined;

  try {
    const appAccessToken = `${env.FACEBOOK_APP_ID}|${env.FACEBOOK_APP_SECRET}`;
    const debugResponse = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(payload.accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`,
    );

    if (!debugResponse.ok) {
      throw new UnauthorizedError('Facebook token verification failed');
    }

    const debugResult = (await debugResponse.json()) as {
      data?: { app_id?: string; is_valid?: boolean; user_id?: string };
    };
    const debugData = debugResult.data;

    if (!debugData?.is_valid || !debugData.user_id) {
      throw new UnauthorizedError('Facebook authentication failed: Invalid access token');
    }

    if (debugData.app_id !== env.FACEBOOK_APP_ID) {
      logger.warn('Facebook authentication rejected because the token app ID did not match');
      throw new UnauthorizedError(
        'Facebook authentication failed: Token was issued for another app',
      );
    }

    const profileResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(payload.accessToken)}`,
    );

    if (!profileResponse.ok) {
      throw new UnauthorizedError('Facebook profile retrieval failed');
    }

    const data = (await profileResponse.json()) as { id?: string; email?: string; name?: string };

    if (!data.id || data.id !== debugData.user_id) {
      logger.warn('Facebook authentication rejected because profile and token user IDs differed');
      throw new UnauthorizedError('Facebook authentication failed: Profile identity mismatch');
    }

    if (!data.email) {
      throw new UnauthorizedError('Facebook authentication failed: Email permission is required');
    }

    fbId = data.id;
    fbEmail = data.email.toLowerCase();
    fbName = data.name;
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Facebook authentication failed');
  }

  let user = await prisma.user.findUnique({ where: { facebookId: fbId } });

  if (!user) {
    const emailUser = await prisma.user.findUnique({ where: { email: fbEmail } });

    if (emailUser) {
      if (emailUser.status === UserStatus.BANNED) {
        throw new UnauthorizedError('Your account has been banned');
      }

      if (emailUser.role === UserRole.ADMIN || emailUser.role === UserRole.LANDLORD) {
        logger.warn(
          `Blocked unsafe Facebook email-link attempt for privileged user ${emailUser.id}`,
        );
        throw new ConflictError(
          'This account must use its existing sign-in method or explicitly link Facebook while authenticated.',
        );
      }

      if (
        emailUser.facebookId ||
        (emailUser.provider !== AuthProvider.LOCAL && emailUser.provider !== AuthProvider.FACEBOOK)
      ) {
        throw new ConflictError('This email is already associated with another sign-in method');
      }

      user = await prisma.user.update({
        where: { id: emailUser.id },
        data: { facebookId: fbId },
      });
    }
  }

  if (user) {
    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedError('Your account has been banned');
    }
  } else {
    user = await prisma.user.create({
      data: {
        email: fbEmail,
        name: fbName || 'Facebook User',
        facebookId: fbId,
        provider: AuthProvider.FACEBOOK,
        role: UserRole.TENANT,
        status: UserStatus.ACTIVE,
      },
    });
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
  googleLogin,
  facebookLogin,
  getMe,
};
