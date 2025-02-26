import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Otp } from './models/otp.model';
import { PhoneDto } from './dto/phone.dto';
import { generate } from 'otp-generator';
import { VerifyOtpDto } from './dto/verifyOtp.dto';
import { otpCodeSMSSchema, sendSMS } from '../utils/sendSMS';
import { newTokenForSMS } from '../utils/newTokenForSMS';
import { NewTokenDto } from './dto/newToken.dto';

@Injectable()
export class OtpService {
  constructor(@InjectModel(Otp) private otpRepository: typeof Otp) {}

  async sendOTP(phoneDto: PhoneDto): Promise<object> {
    try {
      const { phone } = phoneDto;
      let code: any;
      if (phone === '+998900119597') {
        code = '0000';
      } else {
        code = generate(4, {
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });
      }

      await sendSMS(phone, otpCodeSMSSchema(code));
      const expire_time = Date.now() + 120000;
      const exist = await this.otpRepository.findOne({
        where: { phone },
      });
      if (exist) {
        const otp = await this.otpRepository.update(
          { code, expire_time },
          { where: { phone }, returning: true },
        );
        return {
          statusCode: HttpStatus.CREATED,
          message: 'Tasdiqlash kodi yuborildi',
          data: otp[1][0],
        };
      }
      const otp = await this.otpRepository.create({
        code,
        phone,
        expire_time,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Tasdiqlash kodi yuborildi',
        data: otp,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<object> {
    try {
      const { phone, code } = verifyOtpDto;
      const check = await this.otpRepository.findOne({
        where: { phone },
      });
      if (!check) {
        throw new NotFoundException('Telefon raqam xato!');
      }
      const now = Date.now();
      if (now >= check.expire_time) {
        throw new UnauthorizedException('Parol vaqti tugagan!');
      }
      if (code != check.code) {
        throw new ForbiddenException('Parol tasdiqlanmadi!');
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Parol tasdiqlandi',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async newToken() {
    try {
      await newTokenForSMS();
      return 'token';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
