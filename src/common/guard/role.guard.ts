import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const role = request.userId.role;
    const handler = context.getHandler();
    const classHandler = context.getClass();
    const rolesKey = this.reflector.getAllAndMerge('roles', [
      handler,
      classHandler,
    ]);
    if (!rolesKey.includes(role))
      throw new ForbiddenException('Forbidden resource');

    return true;
  }
}
