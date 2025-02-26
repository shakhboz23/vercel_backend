import { ResetpasswordService } from '../resetpassword/resetpassword.service';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { generateToken, writeToCookie } from '../utils/token';
import { Op } from 'sequelize';
import { NotificationService } from '../notification/notification.service';
import { NotificationDto } from '../notification/dto/notification.dto';
import { RoleService } from '../role/role.service';
import { RoleDto } from '../role/dto/role.dto';
import { Role } from '../role/models/role.models';
import { CheckDto } from '../role/dto/check.dto';
import { MailService } from '../mail/mail.service';
import { compareSync, hash } from 'bcryptjs';
import * as uuid from 'uuid';
import { Sequelize } from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { UpdateDto } from './dto/update.dto';
import { Reyting } from 'src/reyting/models/reyting.models';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Course } from 'src/course/models/course.models';
import { SubscriptionActivity, SubscriptionActivityStatus } from './models/subscription_activity.models';
import { SubscriptionActivityDto } from './dto/subscription_activity.dto';

@Injectable()
export class Subscription_activityService {
  constructor(
    @InjectModel(SubscriptionActivity) private subscription_activityRepository: typeof SubscriptionActivity,
    private readonly jwtService: JwtService,
  ) { }

  async create(
    subscriptionActivityDto: SubscriptionActivityDto,
    // user_id: number,
  ): Promise<object> {
    try {
      const { subscription_id, course_id, status, date } = subscriptionActivityDto
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)); // Kun boshidan
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)); // Kun oxirigacha

      const exist = await this.subscription_activityRepository.findOne({
        where: {
          course_id,
          subscription_id, createdAt: {
            [Op.between]: [startOfDay, endOfDay], // Sana oralig'i
          },
        },
      });
      if (exist && status !== 'none') {
        return this.update(exist.id, status)
      } else if (status !== 'none') {
        return await this.subscription_activityRepository.create({ ...subscriptionActivityDto, createdAt: date || new Date() })
      } else {
        return this.delete(exist.id)
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(
    id: number,
    status: SubscriptionActivityStatus,
  ): Promise<object> {
    try {
      const updatedUser = await this.subscription_activityRepository.update({ status }, {
        where: { id },
        returning: true,
      });
      return updatedUser[1][0];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(): Promise<object> {
    try {
      // const user_data: any = await this.userService.getById(user_id);
      // if (!user_data) {
      //   new BadRequestException('User not found!');
      // }

      const subscriptionss: any = await this.subscription_activityRepository.findAll({
        order: [['id', 'ASC']],
      });
      if (!subscriptionss.length) {
        throw new NotFoundException('Subscriptionss not found');
      }
      return subscriptionss;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number): Promise<object> {
    try {
      const subscriptions = await this.subscription_activityRepository.findOne({
        where: { id },
        include: [{ model: Course }],
      });
      if (!subscriptions) {
        throw new NotFoundException('Subscriptions not found');
      }
      return subscriptions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const subscriptionss = await this.subscription_activityRepository.findAll({
        offset,
        limit,
      });
      const total_count = await this.subscription_activityRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: subscriptionss,
          pagination: {
            currentPage: page,
            total_pages,
            total_count,
          },
        },
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async update(
  //   id: number,
  //   subscriptionsDto: SubscriptionsDto,
  // ): Promise<object> {
  //   try {
  //     const subscriptions = await this.subscription_activityRepository.findByPk(id);
  //     if (!subscriptions) {
  //       throw new NotFoundException('Subscriptions not found');
  //     }
  //     const update = await this.subscription_activityRepository.update(
  //       subscriptionsDto,
  //       {
  //         where: { id },
  //         returning: true,
  //       },
  //     );
  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: 'Updated successfully',
  //       data: {
  //         subscriptions: update[1][0],
  //       },
  //     };
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async delete(id: number): Promise<object> {
    try {
      const subscriptions = await this.subscription_activityRepository.findByPk(id);
      if (!subscriptions) {
        throw new NotFoundException('Subscriptions not found');
      }
      subscriptions.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
