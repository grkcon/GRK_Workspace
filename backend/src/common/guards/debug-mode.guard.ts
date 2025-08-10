import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class DebugModeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      throw new ForbiddenException(
        'Debug endpoints are not available in production environment',
      );
    }

    return true;
  }
}
