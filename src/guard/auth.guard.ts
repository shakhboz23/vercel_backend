import {
  Injectable,
  ExecutionContext,
  CanActivate,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const auth_header = req.headers.authorization;
    if (!auth_header) {
      throw new UnauthorizedException({
        message: 'Token topilmadi!',
      });
    }
    const bearer = auth_header.split(' ')[0];
    const token = auth_header.split(' ')[1];
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException({
        message: 'Token topilmadi!',
      });
    }
    let user: any;
    try {
      user = this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_KEY,
      });
      req.user = user;
      const date_now = +Date.now().toString().slice(0, 10);
      if (date_now >= req.user.exp) {
        const refresh_token = req.cookies.refresh_token;
        user = this.jwtService.verify(refresh_token, {
          secret: process.env.REFRESH_TOKEN_KEY,
        });
        if (date_now >= user.exp) {
          throw new UnauthorizedException({
            message: 'Token vaqti tugagan!',
          });
        } else {
          const jwt_payload = { id: req.user.id };
          const access_token = await this.jwtService.signAsync(jwt_payload, {
            secret: process.env.ACCESS_TOKEN_KEY,
            expiresIn: process.env.ACCESS_TOKEN_TIME,
          });
        }
      }
    } catch (error) {
      throw new UnauthorizedException({
        message: 'Token vaqti tugagan!',
      });
    }
    return true;
  }
}

export async function generateAccessToken(id: string, jwtService: any) {
  const access_token = await jwtService.signAsync(id, {
    secret: process.env.ACCESS_TOKEN_KEY,
    expiresIn: process.env.ACCESS_TOKEN_TIME,
  });
  return access_token;
}
