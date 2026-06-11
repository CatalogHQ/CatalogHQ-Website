import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorResponseBody = {
  statusCode: number;
  message: string;
  error?: string;
  code?: string;
  path: string;
  timestamp: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message = this.extractMessage(exceptionResponse, exception.message);
      const error =
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'error' in exceptionResponse
          ? String((exceptionResponse as { error?: string }).error)
          : HttpStatus[status];
      const code =
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'code' in exceptionResponse
          ? String((exceptionResponse as { code?: string }).code)
          : undefined;

      response
        .status(status)
        .json(this.buildBody(status, message, request.url, error, code));
      return;
    }

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      this.buildBody(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        request.url,
        'Internal Server Error',
      ),
    );
  }

  private extractMessage(
    exceptionResponse: string | object,
    fallback: string,
  ): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    const message = (exceptionResponse as { message?: string | string[] }).message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }

    return message ?? fallback;
  }

  private buildBody(
    statusCode: number,
    message: string,
    path: string,
    error?: string,
    code?: string,
  ): ErrorResponseBody {
    return {
      statusCode,
      message,
      error,
      code,
      path,
      timestamp: new Date().toISOString(),
    };
  }
}
