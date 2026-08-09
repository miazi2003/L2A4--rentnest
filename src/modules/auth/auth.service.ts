import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { AuthProvider, User, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../errors/appError';
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

    if (!tokenPayload || !tokenPayload.email) {
      throw new UnauthorizedError('Invalid Google credential token payload');
    }

    googleEmail = tokenPayload.email.toLowerCase();
    googleSub = tokenPayload.sub;
    googleName = tokenPayload.name;
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Google authentication failed: Invalid or expired token');
  }

  // Find existing user by googleId or email for seamless account linking
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId: googleSub }, { email: googleEmail }],
    },
  });

  if (user) {
    // Check if banned
    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedError('Your account has been banned');
    }

    // Link googleId if missing
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleSub,
          provider: user.provider === AuthProvider.LOCAL ? AuthProvider.LOCAL : AuthProvider.GOOGLE,
        },
      });
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
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(payload.accessToken)}`,
    );

    if (!response.ok) {
      throw new UnauthorizedError('Facebook token verification failed');
    }

    const data = (await response.json()) as { id?: string; email?: string; name?: string };

    if (!data.id || !data.email) {
      throw new UnauthorizedError(
        'Facebook authentication failed: Unable to retrieve verified email',
      );
    }

    fbId = data.id;
    fbEmail = data.email.toLowerCase();
    fbName = data.name;
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Facebook authentication failed');
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ facebookId: fbId }, { email: fbEmail }],
    },
  });

  if (user) {
    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedError('Your account has been banned');
    }

    if (!user.facebookId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          facebookId: fbId,
        },
      });
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
