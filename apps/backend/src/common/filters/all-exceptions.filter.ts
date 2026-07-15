import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = null;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                // Handle NestJS validation errors which return an array in 'message'
                const res = exceptionResponse as any;
                message = Array.isArray(res.message) ? res.message[0] : (res.message || exception.message);
                error = res.error || res;
            } else {
                message = exception.message;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            error = exception.name;
        }

        // Some custom exceptions might already have a 'response' object that follows ServiceResponse
        if (exception && exception.response && typeof exception.response === 'object' && 'success' in exception.response) {
            return response.status(status).json(exception.response);
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            message,
            error: error || undefined,
        });
    }
}
