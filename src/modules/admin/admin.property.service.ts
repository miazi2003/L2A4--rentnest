import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { NotFoundError } from '../../errors/appError';
import { IAdminPropertyQuery } from './admin.property.validation';

/**
 * Retrieve all properties with filters, search and sorting for administrators.
 */
const getAllProperties = async (query: IAdminPropertyQuery) => {
  const { page, limit, search, categoryId, landlordId, availability, sortBy, sortOrder } = query;

  const where: Prisma.PropertyWhereInput = {};

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        address: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (landlordId) {
    where.landlordId = landlordId;
  }

  if (availability) {
    where.availability = availability;
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const orderBy: Prisma.PropertyOrderByWithRelationInput = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder || 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }

const total = await prisma.property.count({
  where,
});

const properties = await prisma.property.findMany({
  where,
  skip,
  take,
  orderBy,
  include: {
    landlord: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    },
    category: true,
    reviews: {
      select: {
        rating: true,
      },
    },
  },
});

  const totalPages = Math.ceil(total / limit);

  const mappedProperties = properties.map((property) => {
    const totalReviews = property.reviews.length;
    const avgRating =
      totalReviews > 0
        ? property.reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
        : 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { reviews, ...propertyData } = property;

    return {
      ...propertyData,
      avgRating: parseFloat(avgRating.toFixed(2)),
      totalReviews,
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: mappedProperties,
  };
};

/**
 * Retrieve full property information including reviews and rental metrics/statistics.
 */
const getPropertyById = async (id: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
      category: true,
      reviews: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      rentalRequests: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  const totalReviews = property.reviews.length;
  const avgRating =
    totalReviews > 0
      ? property.reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
      : 0;

  // Calculate rental stats
  const totalRequests = property.rentalRequests.length;
  const pendingRequests = property.rentalRequests.filter((r) => r.status === 'PENDING').length;
  const approvedRequests = property.rentalRequests.filter((r) => r.status === 'APPROVED').length;
  const activeRequests = property.rentalRequests.filter((r) => r.status === 'ACTIVE').length;
  const completedRequests = property.rentalRequests.filter((r) => r.status === 'COMPLETED').length;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rentalRequests, ...propertyData } = property;

  return {
    ...propertyData,
    avgRating: parseFloat(avgRating.toFixed(2)),
    totalReviews,
    rentalStats: {
      total: totalRequests,
      pending: pendingRequests,
      approved: approvedRequests,
      active: activeRequests,
      completed: completedRequests,
    },
  };
};

export const AdminPropertyService = {
  getAllProperties,
  getPropertyById,
};
