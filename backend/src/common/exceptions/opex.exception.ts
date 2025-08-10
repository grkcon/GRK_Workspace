import { HttpException, HttpStatus } from '@nestjs/common';

export class OpexNotFoundException extends HttpException {
  constructor(year?: number, month?: number) {
    const message =
      year && month
        ? `OPEX data for ${year}/${month} not found`
        : year
          ? `OPEX data for year ${year} not found`
          : 'OPEX data not found';

    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'OPEX_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class OpexValidationException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'OPEX_VALIDATION_ERROR',
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class OpexConflictException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message,
        error: 'OPEX_CONFLICT',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class OpexOperationException extends HttpException {
  constructor(operation: string, message: string) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to ${operation}: ${message}`,
        error: 'OPEX_OPERATION_FAILED',
        operation,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class OpexItemNotFoundException extends HttpException {
  constructor(id: number) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `OpexItem with ID ${id} not found`,
        error: 'OPEX_ITEM_NOT_FOUND',
        itemId: id,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class OpexConfirmationException extends HttpException {
  constructor(year: number, month: number, reason: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Cannot confirm ${year}/${month}: ${reason}`,
        error: 'OPEX_CONFIRMATION_ERROR',
        year,
        month,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
