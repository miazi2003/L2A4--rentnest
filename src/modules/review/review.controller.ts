import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service';
import { ApiResponse } from '../../utils/apiResponse';
import {  reviewQuerySchema } from './review.validation';

/**
 * Controller creating a review for a property.
 */
const createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const result = await ReviewService.createReview(tenantId, req.body);
    ApiResponse.success(res, 201, 'Review submitted successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving reviews submitted for a specific property.
 */
const getPropertyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const propertyId = req.params.propertyId as string;
    // const result = await ReviewService.getPropertyReviews(
    //   propertyId,
    //   req.query as unknown as IReviewQuery,
    // );

     const parsed = reviewQuerySchema.parse(req.query);
    
    const result = await ReviewService.getPropertyReviews(
      propertyId,
      parsed,
    );
    ApiResponse.success(
      res,
      200,
      'Property reviews retrieved successfully',
      result.data,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

export const ReviewController = {
  createReview,
  getPropertyReviews,
};
