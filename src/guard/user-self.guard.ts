import { JwtService } from '@nestjs/jwt/dist';
import {
  Injectable,
  ExecutionContext,
  CanActivate,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class UserSelfGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    if (String(req.user.id) !== req.params.id) {
      throw new UnauthorizedException({
        message: 'Ruxsat etilmagan foydalanuvchi',
      });
    }
    return true;
  }
}
