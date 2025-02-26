import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PhoneDto } from './dto/phone.dto';
import { VerifyOtpDto } from './dto/verifyOtp.dto';
import { NewTokenDto } from './dto/newToken.dto';

@ApiTags('Otp')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @ApiOperation({ summary: 'Send OTP' })
  @Post('sendOtp')
  sendOtp(@Body() phoneDto: PhoneDto) {
    return this.otpService.sendOTP(phoneDto);
  }

  @ApiOperation({ summary: 'Verify OTP' })
  @Post('verifyOtp')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.otpService.verifyOtp(verifyOtpDto);
  }

  @ApiOperation({ summary: 'Get new token for SMS service' })
  @Post('getNewToken')
  newToken() {
    return this.otpService.newToken();
  }
}
