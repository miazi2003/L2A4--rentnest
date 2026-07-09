import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { NotFoundError } from '../../errors/appError';
import { IAdminRentalQuery } from './admin.rental.validation';

/**
 * Retrieve every rental request with filters, pagination and sorting.
 */
const getAllRentals = async (query: IAdminRentalQuery) => {
  const { page, limit, status, paymentStatus } = query;

  const where: Prisma.RentalRequestWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (paymentStatus) {
    where.payments = {
      some: {
        status: paymentStatus,
      },
    };
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const [total, rentals] = await prisma.$transaction([
    prisma.rentalRequest.count({ where }),
    prisma.rentalRequest.findMany({
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
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const mappedRentals = rentals.map((rental) => {
    const latestPayment = rental.payments[0] || null;
    const derivedPaymentStatus = latestPayment ? latestPayment.status : 'PENDING';
    return {
      ...rental,
      paymentStatus: derivedPaymentStatus,
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
 * Retrieve complete rental request details including payment history. Returns 404 if not found.
 */
const getRentalById = async (id: string) => {
  const rental = await prisma.rentalRequest.findUnique({
    where: { id },
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

  const latestPayment = rental.payments[0] || null;
  const derivedPaymentStatus = latestPayment ? latestPayment.status : 'PENDING';

  return {
    ...rental,
    paymentStatus: derivedPaymentStatus,
  };
};

export const AdminRentalService = {
  getAllRentals,
  getRentalById,
};
