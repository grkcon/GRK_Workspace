import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * 유효한 월 범위 검증 (1-12)
 */
@ValidatorConstraint({ name: 'isValidMonth', async: false })
export class IsValidMonthConstraint implements ValidatorConstraintInterface {
  validate(month: number, args: ValidationArguments) {
    return month >= 1 && month <= 12;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Month must be between 1 and 12';
  }
}

export function IsValidMonth(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidMonthConstraint,
    });
  };
}

/**
 * 유효한 연도 범위 검증 (2000-2100)
 */
@ValidatorConstraint({ name: 'isValidYear', async: false })
export class IsValidYearConstraint implements ValidatorConstraintInterface {
  validate(year: number, args: ValidationArguments) {
    return year >= 2000 && year <= 2100;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Year must be between 2000 and 2100';
  }
}

export function IsValidYear(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidYearConstraint,
    });
  };
}

/**
 * 양수 금액 검증
 */
@ValidatorConstraint({ name: 'isPositiveAmount', async: false })
export class IsPositiveAmountConstraint
  implements ValidatorConstraintInterface
{
  validate(amount: number, args: ValidationArguments) {
    return amount >= 0;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Amount must be a positive number';
  }
}

export function IsPositiveAmount(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPositiveAmountConstraint,
    });
  };
}
