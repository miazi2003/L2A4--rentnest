import { Request, Response, NextFunction } from 'express';
import { RentalService } from './rental.service';
import { ApiResponse } from '../../utils/apiResponse';
// import { IRentalQuery, ILandlordRentalQuery, IUpdateRentalStatusInput } from './rental.validation';
import {
  rentalQuerySchema,
  landlordRentalQuerySchema,
  IUpdateRentalStatusInput,
} from './rental.validation';

/**
 * Controller submitting a new rental request.
 */
const createRentalRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const result = await RentalService.createRentalRequest(tenantId, req.body);
    ApiResponse.success(res, 201, 'Rental request submitted successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving rental requests submitted by the authenticated tenant.
 */
const getMyRentalRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const parsed = rentalQuerySchema.parse(req.query);

    const result = await RentalService.getMyRentalRequests(tenantId, parsed);
    ApiResponse.success(
      res,
      200,
      'Rental requests retrieved successfully',
      result.data,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving details of a single rental request by ID.
 */
const getRentalRequestDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.id;
    const result = await RentalService.getRentalRequestDetails(id, tenantId);
    ApiResponse.success(res, 200, 'Rental request details retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving rental requests submitted for properties owned by the landlord.
 */
const getLandlordRentalRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const parsed = landlordRentalQuerySchema.parse(req.query);

    const result = await RentalService.getLandlordRentalRequests(landlordId, parsed);
    ApiResponse.success(
      res,
      200,
      'Landlord rental requests retrieved successfully',
      result.data,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling landlord decision (approval/rejection) on a rental request.
 */
const updateRentalRequestStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const landlordId = req.user!.id;
    const result = await RentalService.updateRentalRequestStatus(
      id,
      landlordId,
      req.body as IUpdateRentalStatusInput,
    );
    ApiResponse.success(res, 200, 'Rental request status updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const RentalController = {
  createRentalRequest,
  getMyRentalRequests,
  getRentalRequestDetails,
  getLandlordRentalRequests,
  updateRentalRequestStatus,
};
