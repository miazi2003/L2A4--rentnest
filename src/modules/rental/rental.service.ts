import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from '../../errors/appError';
import { ICreateRentalInput } from './rental.interface';
import { IRentalQuery, ILandlordRentalQuery, IUpdateRentalStatusInput } from './rental.validation';

/**
 * Create a new rental request for a property by an authenticated tenant.
 */
const createRentalRequest = async (tenantId: string, payload: ICreateRentalInput) => {
  // 1. Verify property exists
  const property = await prisma.property.findUnique({
    where: { id: payload.propertyId },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // 2. Verify property availability
  if (property.availability !== 'AVAILABLE') {
    throw new BadRequestError('This property is not currently available for rent');
  }

  // 3. Verify tenant is not the owner landlord
  if (property.landlordId === tenantId) {
    throw new BadRequestError('You cannot rent or submit requests for your own property');
  }

  // 4. Prevent duplicate active/pending requests
  const existingRequest = await prisma.rentalRequest.findFirst({
    where: {
      propertyId: payload.propertyId,
      tenantId,
      status: {
        in: ['PENDING', 'APPROVED', 'ACTIVE'],
      },
    },
  });

  if (existingRequest) {
    throw new ConflictError(
      'You already have a pending, approved, or active rental request for this property',
    );
  }

  // 5. Calculate total price based on duration in days
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.ceil(
    Math.abs((payload.endDate.getTime() - payload.startDate.getTime()) / oneDay),
  );
  const durationDays = diffDays > 0 ? diffDays : 1;
  const dailyPrice = Number(property.price);
  const totalPrice = dailyPrice * durationDays;

  // 6. Create rental request
  return prisma.rentalRequest.create({
    data: {
      propertyId: payload.propertyId,
      tenantId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      totalPrice,
      status: 'PENDING',
    },
  });
};

/**
 * Get all rental requests of the authenticated tenant with pagination and filters.
 */
const getMyRentalRequests = async (tenantId: string, query: IRentalQuery) => {
  const { page, limit, status } = query;

  const where: Prisma.RentalRequestWhereInput = {
    tenantId,
  };

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;
  const take = limit;

  // Query database in parallel
const total = await prisma.rentalRequest.count({
  where,
});

const rentals = await prisma.rentalRequest.findMany({
  where,
  skip,
  take,
  orderBy: {
    createdAt: 'desc',
  },
  include: {
    property: {
      include: {
        category: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    },
    payments: {
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
      select: {
        status: true,
      },
    },
  },
});

  const totalPages = Math.ceil(total / limit);

  // Map result to inject derived paymentStatus
  const mappedRentals = rentals.map((rental) => {
    const paymentStatus = rental.payments[0]?.status || 'PENDING';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { payments, property, ...rentalData } = rental;
    const { landlord, category, ...propertyData } = property;

    return {
      ...rentalData,
      paymentStatus,
      property: {
        ...propertyData,
        category,
        landlord,
      },
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: mappedRentals,
  };
};

/**
 * Retrieve detailed view of a rental request. Must belong to the requesting tenant.
 */
const getRentalRequestDetails = async (id: string, tenantId: string) => {
  const rental = await prisma.rentalRequest.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          category: true,
          landlord: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      },
      payments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!rental) {
    throw new NotFoundError('Rental request not found');
  }

  if (rental.tenantId !== tenantId) {
    throw new ForbiddenError('You do not have permission to access this rental request');
  }

  const paymentStatus = rental.payments[0]?.status || 'PENDING';

  return {
    ...rental,
    paymentStatus,
  };
};

/**
 * Retrieve all rental requests submitted for properties owned by the authenticated landlord.
 */
const getLandlordRentalRequests = async (landlordId: string, query: ILandlordRentalQuery) => {
  const { page, limit, status } = query;

  const where: Prisma.RentalRequestWhereInput = {
    property: {
      landlordId,
    },
  };

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;
  const take = limit;

 const total = await prisma.rentalRequest.count({
  where,
});

const requests = await prisma.rentalRequest.findMany({
  where,
  skip,
  take,
  orderBy: {
    createdAt: 'desc',
  },
  include: {
    tenant: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    },
    property: {
      include: {
        category: true,
      },
    },
    payments: {
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
      select: {
        status: true,
      },
    },
  },
});

  const totalPages = Math.ceil(total / limit);

  const mappedRequests = requests.map((request) => {
    const paymentStatus = request.payments[0]?.status || 'PENDING';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { payments, property, ...requestData } = request;
    const { category, ...propertyData } = property;

    return {
      ...requestData,
      paymentStatus,
      property: {
        ...propertyData,
        category,
      },
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: mappedRequests,
  };
};

/**
 * Approve or reject a pending rental request by its property owner landlord.
 */
const updateRentalRequestStatus = async (
  id: string,
  landlordId: string,
  payload: IUpdateRentalStatusInput,
) => {
  const rental = await prisma.rentalRequest.findUnique({
    where: { id },
    include: {
      property: true,
    },
  });

  if (!rental) {
    throw new NotFoundError('Rental request not found');
  }

  // Prevent landlords from modifying requests belonging to other landlords
  if (rental.property.landlordId !== landlordId) {
    throw new ForbiddenError('You do not have permission to manage requests for this property');
  }

  // Only PENDING requests can be approved or rejected
  if (rental.status !== 'PENDING') {
    throw new BadRequestError('Only pending rental requests can be approved or rejected');
  }

  return prisma.rentalRequest.update({
    where: { id },
    data: {
      status: payload.status,
    },
  });
};

export const RentalService = {
  createRentalRequest,
  getMyRentalRequests,
  getRentalRequestDetails,
  getLandlordRentalRequests,
  updateRentalRequestStatus,
};
