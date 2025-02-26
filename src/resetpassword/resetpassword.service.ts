import { UploadedService } from '../uploaded/uploaded.service';
import { UserService } from '../user/user.service';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Resetpassword } from './models/resetpassword.models';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { ResetpasswordDto } from './dto/resetpassword.dto';
import * as uuid from 'uuid';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ResetpasswordService {
  constructor(
    @InjectModel(Resetpassword)
    private resetpasswordRepository: typeof Resetpassword,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async create(resetpasswordDto: ResetpasswordDto): Promise<object> {
    try {
      const { email } = resetpasswordDto;
      const is_user = await this.resetpasswordRepository.findOne({
        where: { email },
      });
      if (is_user) {
        throw new BadRequestException('Already sent a activate link');
      }
      const activate_link = uuid.v4();
      const resetpassword = await this.resetpasswordRepository.create({
        email,
        activate_link,
      });
      await this.mailService.sendUserActivationLink(activate_link, email);
      return {
        statusCode: HttpStatus.OK,
        message: 'Created successfully',
        data: resetpassword,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(): Promise<object> {
    try {
      const resetpasswords = await this.resetpasswordRepository.findAll();

      return {
        statusCode: HttpStatus.OK,
        data: resetpasswords,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number): Promise<object> {
    try {
      const resetpassword = await this.resetpasswordRepository.findByPk(id);
      if (!resetpassword) {
        throw new NotFoundException('Resetpassword not found');
      }
      return {
        statusCode: HttpStatus.OK,
        data: resetpassword,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async checkActivationLink(activate_link) {
    try {
      const is_aviable = await this.resetpasswordRepository.findOne({
        where: {
          activate_link,
        },
      });
      if (is_aviable) {
        return is_aviable.email;
      }
      throw new NotFoundException('Activation link not found');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const resetpassword = await this.resetpasswordRepository.findByPk(id);
      if (!resetpassword) {
        throw new NotFoundException('Resetpassword not found');
      }
      resetpassword.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
