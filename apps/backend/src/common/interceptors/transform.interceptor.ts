import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const response = context.switchToHttp().getResponse<Response>();

        return next.handle().pipe(
            map((data) => {
                // If data is already in ServiceResponse format, just pass it through and set status
                if (data && typeof data === 'object' && 'success' in data && 'statusCode' in data) {
                    if (
                        typeof data.statusCode === 'number' &&
                        data.statusCode >= 100 &&
                        data.statusCode < 600
                    ) {
                        response.status(data.statusCode);
                    }
                    return data;
                }

                // Otherwise, wrap it in a success response
                const statusCode = response.statusCode || 200;
                return {
                    success: true,
                    statusCode,
                    message: 'Request successful',
                    data: data,
                };
            }),
        );
    }
}
