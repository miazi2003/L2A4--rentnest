import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../errors/appError';
import { ICreatePropertyInput, IUpdatePropertyInput } from './property.interface';
import { IPropertyQuery } from './property.validation';

/**
 * Get all available properties with filters, search, sorting, and pagination.
 */
const getAvailableProperties = async (query: IPropertyQuery) => {
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    availability,
    landlordId,
    page,
    limit,
    sortBy,
    sortOrder,
  } = query;

  // Build dynamic filter conditions
  const where: Prisma.PropertyWhereInput = {
    availability: availability || 'AVAILABLE',
  };

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

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const orderBy: Prisma.PropertyOrderByWithRelationInput = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder || 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }

  // Fetch count and paginated properties concurrently
  const [total, properties] = await prisma.$transaction([
    prisma.property.count({ where }),
    prisma.property.findMany({
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
    }),
  ]);

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
 * Get a single property by ID. Must be available to be accessed publicly.
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
    },
  });

  if (!property || property.availability !== 'AVAILABLE') {
    throw new NotFoundError('Property not found');
  }

  const totalReviews = property.reviews.length;
  const avgRating =
    totalReviews > 0
      ? property.reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
      : 0;

  return {
    ...property,
    avgRating: parseFloat(avgRating.toFixed(2)),
    totalReviews,
  };
};

/**
 * Create a new property belonging to the authenticated landlord.
 */
const createProperty = async (landlordId: string, payload: ICreatePropertyInput) => {
  // Validate category existence
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new BadRequestError('The specified category does not exist');
  }

  return prisma.property.create({
    data: {
      title: payload.title,
      description: payload.description,
      price: payload.price,
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
      images: payload.images,
      landlordId,
      categoryId: payload.categoryId,
    },
  });
};

/**
 * Update an existing property by ID. Must belong to the authenticated landlord.
 */
const updateProperty = async (id: string, landlordId: string, payload: IUpdatePropertyInput) => {
  const property = await prisma.property.findUnique({
    where: { id },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  if (property.landlordId !== landlordId) {
    throw new ForbiddenError('You do not have permission to update this property');
  }

  // Validate category if updating it
  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new BadRequestError('The specified category does not exist');
    }
  }

  return prisma.property.update({
    where: { id },
    data: payload,
  });
};

/**
 * Delete a property. Must belong to the landlord and have no active/approved bookings.
 */
const deleteProperty = async (id: string, landlordId: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  if (property.landlordId !== landlordId) {
    throw new ForbiddenError('You do not have permission to delete this property');
  }

  // Prevent deletion if active or approved rental requests exist
  const activeOrApprovedBookings = await prisma.rentalRequest.count({
    where: {
      propertyId: id,
      status: {
        in: ['ACTIVE', 'APPROVED'],
      },
    },
  });

  if (activeOrApprovedBookings > 0) {
    throw new BadRequestError(
      'Cannot delete property because it has active or approved rental requests',
    );
  }

  return prisma.property.delete({
    where: { id },
  });
};

/**
 * Retrieve all properties created by the authenticated landlord.
 */
const getMyProperties = async (landlordId: string) => {
  const properties = await prisma.property.findMany({
    where: { landlordId },
    include: {
      category: true,
      _count: {
        select: {
          rentalRequests: true,
          reviews: true,
        },
      },
    },
  });

  return properties.map((property) => {
    const { _count, ...propertyData } = property;
    return {
      ...propertyData,
      rentalRequestCount: _count.rentalRequests,
      reviewCount: _count.reviews,
    };
  });
};

export const PropertyService = {
  getAvailableProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
};
