import { IsNotEmpty } from 'class-validator';
import { BadGatewayException, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';

export async function generateToken(jwt_payload: object, jwtService: any) {
  try {
    const [access_token, refresh_token] = await Promise.all([
      jwtService.signAsync(jwt_payload, {
        secret: process.env.ACCESS_TOKEN_KEY,
        expiresIn: process.env.ACCESS_TOKEN_TIME,
      }),
      jwtService.signAsync(jwt_payload, {
        secret: process.env.REFRESH_TOKEN_KEY,
        expiresIn: process.env.REFRESH_TOKEN_TIME,
      }),
    ]);
    return { access_token, refresh_token };
  } catch (error) {
    throw new BadGatewayException(error.message);
  }
}

export async function writeToCookie(refresh_token: string, res: Response) {
  try {
    res.cookie('refresh_token', refresh_token, {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
  } catch (error) {
    throw new BadGatewayException(error.message);
  }
}

export function extractUserIdFromToken(
  headers: any,
  jwtService: any,
  is_optional?: boolean,
): number | null {
  const authHeader = headers['authorization'];
  const token = authHeader?.split(' ')[1];
  console.log(token, !token, 'token');
  if (!token || token == 'null') {
    console.log(is_optional);
    if (is_optional) return;
    throw new UnauthorizedException('Token not found');
  }

  try {
    const user = jwtService.verify(token, {
      secret: process.env.ACCESS_TOKEN_KEY,
    });
    console.log(token);
    console.log(user);
    return user?.id || null;
  } catch (error) {
    console.log(error);
    throw new UnauthorizedException('Invalid or expired token');
  }
}
