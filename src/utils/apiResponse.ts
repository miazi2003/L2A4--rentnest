import { Response } from 'express';

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: unknown;
  errors?: unknown;
}

export class ApiResponse {
  /**
   * Send a successful API response.
   */
  static success<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    meta?: unknown,
  ): Response {
    const payload: ApiResponsePayload<T> = {
      success: true,
      message,
    };
    if (data !== undefined) payload.data = data;
    if (meta !== undefined) payload.meta = meta;

    return res.status(statusCode).json(payload);
  }

  /**
   * Send an error API response.
   */
  static error(res: Response, statusCode: number, message: string, errors?: unknown): Response {
    const payload: ApiResponsePayload = {
      success: false,
      message,
    };
    if (errors !== undefined) payload.errors = errors;

    return res.status(statusCode).json(payload);
  }
}
