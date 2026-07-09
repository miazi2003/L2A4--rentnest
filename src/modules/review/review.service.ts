import { prisma } from '../../config/db';
import { NotFoundError, BadRequestError, ConflictError } from '../../errors/appError';
import { ICreateReviewInput } from './review.interface';
import { IReviewQuery } from './review.validation';

/**
 * Create a review for a property. Only tenants with a COMPLETED rental request can submit reviews.
 */
const createReview = async (tenantId: string, payload: ICreateReviewInput) => {
  const { propertyId, rating, comment } = payload;

  // 1. Verify property exists
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // 2. Validate tenant has a COMPLETED rental request for the property
  const completedRental = await prisma.rentalRequest.findFirst({
    where: {
      propertyId,
      tenantId,
      status: 'COMPLETED',
    },
  });

  if (!completedRental) {
    throw new BadRequestError(
      'You can only submit reviews for properties where you have a completed rental request',
    );
  }

  // 3. Prevent duplicate reviews (one review per tenant per property)
  const existingReview = await prisma.review.findUnique({
    where: {
      propertyId_tenantId: {
        propertyId,
        tenantId,
      },
    },
  });

  if (existingReview) {
    throw new ConflictError('You have already reviewed this property');
  }

  // 4. Save review in database
  return prisma.review.create({
    data: {
      propertyId,
      tenantId,
      rating,
      comment,
    },
  });
};

/**
 * Retrieve reviews for a property with pagination, sorting by newest, and aggregate calculations.
 */
const getPropertyReviews = async (propertyId: string, query: IReviewQuery) => {
  const { page, limit } = query;

  // 1. Verify property exists
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // 2. Calculate aggregates
  const aggregate = await prisma.review.aggregate({
    where: { propertyId },
    _count: true,
    _avg: {
      rating: true,
    },
  });

  const totalReviews = aggregate._count;
  const averageRating = aggregate._avg.rating ? parseFloat(aggregate._avg.rating.toFixed(2)) : 0;

  // 3. Get paginated review listings
  const skip = (page - 1) * limit;
  const take = limit;

  const reviews = await prisma.review.findMany({
    where: { propertyId },
    skip,
    take,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      tenant: {
        select: {
          name: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(totalReviews / limit);

  return {
    meta: {
      page,
      limit,
      total: totalReviews,
      totalPages,
      averageRating,
      totalReviews,
    },
    data: reviews,
  };
};

export const ReviewService = {
  createReview,
  getPropertyReviews,
};
