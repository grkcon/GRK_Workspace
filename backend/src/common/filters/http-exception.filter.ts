import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'INTERNAL_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || 'ERROR';
        details = (exceptionResponse as any).details || null;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      
      // TypeORM 관련 에러 처리
      if (exception.name === 'QueryFailedError') {
        status = HttpStatus.BAD_REQUEST;
        error = 'DATABASE_ERROR';
        
        // PostgreSQL 에러 코드 처리
        const pgError = exception as any;
        if (pgError.code === '23505') {
          message = 'Duplicate entry found';
          error = 'DUPLICATE_ENTRY';
        } else if (pgError.code === '23503') {
          message = 'Foreign key constraint violation';
          error = 'FOREIGN_KEY_VIOLATION';
        }
      }
    }

    // 에러 로깅
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : 'No stack trace',
    );

    // 개발 환경에서는 상세 정보 포함
    const isDevelopment = process.env.NODE_ENV === 'development';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
      ...(details && { details }),
      ...(isDevelopment && exception instanceof Error && {
        stack: exception.stack,
      }),
    });
  }
}