export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  totalCount?: number;
  error?: any;
}

/** Success response */
export function successResponse<T>(
  message: string,
  data?: T,
  statusCode = 200,
): ServiceResponse<T> {
  return {
    success: true,
    message,
    statusCode,
    data,
  };
}

/** Error response */
export function errorResponse(
  message: string,
  error?: any,
  statusCode = 400,
): ServiceResponse<null> {
  let finalStatusCode = statusCode;

  if (error) {
    if (typeof error.getStatus === 'function') {
      finalStatusCode = error.getStatus();
    } else if (typeof error.status === 'number') {
      finalStatusCode = error.status;
    } else if (typeof error.statusCode === 'number') {
      finalStatusCode = error.statusCode;
    } else if (error.response && typeof error.response.statusCode === 'number') {
      finalStatusCode = error.response.statusCode;
    }
  }

  return {
    success: false,
    message,
    statusCode: finalStatusCode,
    error,
  };
}
