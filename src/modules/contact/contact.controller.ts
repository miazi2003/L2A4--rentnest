import { Request, Response, NextFunction } from 'express';
import { ContactService } from './contact.service';
import { ApiResponse } from '../../utils/apiResponse';

/**
 * Controller processing public contact form submission.
 */
const submitContactForm = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await ContactService.createContactMessage(req.body);
    ApiResponse.success(res, 201, 'Message submitted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const ContactController = {
  submitContactForm,
};
