import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let token = request.headers['authorization']?.split(' ')[1];

    if (!token) {
      token = request.cookies.token;
    }
    console.log(token);
    try {
      console.log(token.token, "tok");
      const { id, role } = await this.jwtService.verifyAsync(token.token);
      console.log(role, id, "id va rol");
      request.userId = { id, role };

      return true;
    } catch (error) {
      throw new ForbiddenException('Token invalid');
    }
  }
}
