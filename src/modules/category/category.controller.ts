import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { ApiResponse } from '../../utils/apiResponse';

/**
 * Controller retrieving all categories.
 */
const getAllCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await CategoryService.getAllCategories();
    ApiResponse.success(res, 200, 'Categories retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling category creation.
 */
const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await CategoryService.createCategory(req.body);
    ApiResponse.success(res, 201, 'Category created successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling category update by ID.
 */
const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await CategoryService.updateCategory(id, req.body);
    ApiResponse.success(res, 200, 'Category updated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling category deletion by ID.
 */
const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await CategoryService.deleteCategory(id);
    ApiResponse.success(res, 200, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const CategoryController = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
