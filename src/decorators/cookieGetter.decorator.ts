import {
  ExecutionContext,
  HttpStatus,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

export const CookieGetter = createParamDecorator(
  async (data: string, context: ExecutionContext): Promise<string> => {
    const request = context.switchToHttp().getRequest();
    const refresh_token = request.cookies[data];
    if (!refresh_token) {
      throw new UnauthorizedException(HttpStatus.UNAUTHORIZED, "Ruxsat yo'q!");
    }
    return refresh_token;
  },
);
