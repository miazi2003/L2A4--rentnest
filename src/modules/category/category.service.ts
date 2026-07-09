import { prisma } from '../../config/db';
import { ConflictError, NotFoundError, BadRequestError } from '../../errors/appError';
import { ICreateCategoryInput, IUpdateCategoryInput } from './category.interface';

/**
 * Fetch all categories sorted alphabetically.
 */
const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });
};

/**
 * Create a new category with duplicate case-insensitive checking.
 */
const createCategory = async (payload: ICreateCategoryInput) => {
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: payload.name,
        mode: 'insensitive',
      },
    },
  });

  if (existingCategory) {
    throw new ConflictError('Category already exists');
  }

  return prisma.category.create({
    data: {
      name: payload.name,
      description: payload.description,
    },
  });
};

/**
 * Update an existing category by ID with duplicate validation.
 */
const updateCategory = async (id: string, payload: IUpdateCategoryInput) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  const duplicateCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: payload.name,
        mode: 'insensitive',
      },
      id: {
        not: id,
      },
    },
  });

  if (duplicateCategory) {
    throw new ConflictError('Category with this name already exists');
  }

  return prisma.category.update({
    where: { id },
    data: {
      name: payload.name,
      description: payload.description,
    },
  });
};

/**
 * Delete a category by ID if it has no associated properties.
 */
const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Prevent deleting category if assigned to properties
  const propertyCount = await prisma.property.count({
    where: {
      categoryId: id,
    },
  });

  if (propertyCount > 0) {
    throw new BadRequestError(
      'Cannot delete category because it is currently assigned to one or more properties',
    );
  }

  return prisma.category.delete({
    where: { id },
  });
};

export const CategoryService = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
