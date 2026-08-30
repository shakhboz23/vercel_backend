import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscribeActive, Subscriptions } from './models/subscriptions.models';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { SubscriptionsDto } from './dto/subscriptions.dto';
import { Tests } from '../test/models/test.models';
import { Uploaded } from '../uploaded/models/uploaded.models';
import { UserService } from '../user/user.service';
import { Course } from '../course/models/course.models';
import { Group } from '../group/models/group.models';
import { UploadedService } from '../uploaded/uploaded.service';
import { CreateSubscriptionsDto } from './dto/create_subscriptions.dto';
import { CopySubscriptionsDto } from './dto/copy_subscriptions.dto';
import { Response } from 'express';
import { BotService } from '../bot/bot.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscriptions)
    private subscriptionsRepository: typeof Subscriptions,
    @InjectModel(Course)
    private courseRepository: typeof Course,
    private readonly userService: UserService,
    private uploadedService: UploadedService,
    @Inject(forwardRef(() => BotService))
    private readonly botService: BotService,
  ) { }

  async create(
    subscriptionsDto: SubscriptionsDto,
    user_id: number,
  ): Promise<object> {
    try {
      const { course_id, subgroup_id } = subscriptionsDto;
      const exist = await this.subscriptionsRepository.findOne({
        where: { user_id, course_id },
      });
      if (exist) {
        return this.delete(user_id, subscriptionsDto.course_id);
      }
      return this.subscriptionsRepository.create({ course_id, user_id, subgroup_id, is_active: SubscribeActive.requested, start_date: subscriptionsDto.start_date });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createSubscription(
    creaetSubscriptionsDto: CreateSubscriptionsDto,
    user_id: number,
  ): Promise<object> {
    try {
      const { course_ids, role, subgroups } = creaetSubscriptionsDto;
      user_id = creaetSubscriptionsDto?.user_id;
      // Map of course_id -> subgroup_id, for courses split into weekday
      // subgroups. Courses missing from the map (or when the field is
      // omitted entirely) are enrolled with no subgroup.
      let subgroupByCourse: Record<number, number> = {};
      if (subgroups) {
        try {
          subgroupByCourse = JSON.parse(subgroups);
        } catch {
          throw new BadRequestException(
            'subgroups must be a JSON object, for example {"3":12,"5":14}',
          );
        }
      }
      let subcription: any;
      let i: any;
      for (i of course_ids) {
        const exist = await this.subscriptionsRepository.findOne({
          where: { user_id, course_id: i },
        });
        if (exist) {
          await this.deleteSubscription(exist.id, i, user_id)
        }
        subcription = await this.subscriptionsRepository.create({
          course_id: i,
          user_id,
          role,
          subgroup_id: subgroupByCourse[i] || null,
          is_active: SubscribeActive.pending,
          start_date: creaetSubscriptionsDto.start_date,
        });

        if (!exist) {
          const course = await this.courseRepository.findByPk(i);
          if (course) {
            this.botService
              .notifySubscriptionAdded(user_id, course.title)
              .catch((error) => console.log(error));
          }
        }
      }
      return subcription;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteSubscription(
    id: number,
    course_id: number,
    user_id: number,
  ): Promise<object> {
    try {
      const exist = await this.subscriptionsRepository.findOne({
        where: { user_id, course_id },
      });
      if (!exist) {
        throw new BadRequestException('User not found');
      }

      await exist.destroy()
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Bulk-enrolls every student already subscribed to `from_course_id` (or
  // just the given `user_ids`, when provided) into `to_course_id` in one
  // shot, so a teacher/admin can reuse a roster instead of re-adding each
  // student one by one. Students already enrolled in the target course are
  // silently skipped rather than duplicated.
  async copyFromCourse(
    copySubscriptionsDto: CopySubscriptionsDto,
  ): Promise<object> {
    try {
      const { from_course_id, to_course_id, start_date, user_ids, subgroup_id } =
        copySubscriptionsDto;

      if (+from_course_id === +to_course_id) {
        throw new BadRequestException(
          "Manba va maqsad kurslar bir xil bo'lishi mumkin emas",
        );
      }

      const toCourse = await this.courseRepository.findByPk(to_course_id);
      if (!toCourse) {
        throw new NotFoundException('Maqsad kurs topilmadi');
      }

      const sourceWhere: any = { course_id: from_course_id };
      if (user_ids?.length) {
        sourceWhere.user_id = { [Op.in]: user_ids };
      }
      const sourceSubscriptions = await this.subscriptionsRepository.findAll({
        where: sourceWhere,
      });
      if (!sourceSubscriptions.length) {
        return {
          statusCode: HttpStatus.OK,
          message: "Manba kursda o'quvchi topilmadi",
          added_count: 0,
          skipped_user_ids: [],
        };
      }

      const existingSubscriptions = await this.subscriptionsRepository.findAll({
        where: {
          course_id: to_course_id,
          user_id: { [Op.in]: sourceSubscriptions.map((s) => s.user_id) },
        },
      });
      const alreadyEnrolledIds = new Set(
        existingSubscriptions.map((s) => s.user_id),
      );

      const toCreate = sourceSubscriptions.filter(
        (s) => !alreadyEnrolledIds.has(s.user_id),
      );

      const created = await this.subscriptionsRepository.bulkCreate(
        toCreate.map((s) => ({
          course_id: to_course_id,
          user_id: s.user_id,
          role: s.role,
          subgroup_id: subgroup_id || null,
          is_active: SubscribeActive.pending,
          start_date: start_date || new Date(),
        })),
      );

      for (const s of toCreate) {
        this.botService
          .notifySubscriptionAdded(s.user_id, toCourse.title)
          .catch((error) => console.log(error));
      }

      return {
        statusCode: HttpStatus.OK,
        message: `${created.length} ta o'quvchi muvaffaqiyatli qo'shildi`,
        added_count: created.length,
        skipped_user_ids: Array.from(alreadyEnrolledIds),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllForBilling(): Promise<Subscriptions[]> {
    return this.subscriptionsRepository.findAll({
      include: [{ model: Course }],
    });
  }

  async getAll(): Promise<object> {
    try {
      const subscriptionss: any = await this.subscriptionsRepository.findAll({
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

  async getByUserId(user_id): Promise<object> {
    try {
      const subscriptionss: any = await this.subscriptionsRepository.findAll({
        where: {
          user_id,
        },
        include: [{ model: Course, include: [{ model: Group, required: false }] }],
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
      const subscriptions = await this.subscriptionsRepository.findOne({
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
      const subscriptionss = await this.subscriptionsRepository.findAll({
        offset,
        limit,
      });
      const total_count = await this.subscriptionsRepository.count();
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

  async update(
    id: number,
    subscriptionsDto: SubscriptionsDto,
  ): Promise<object> {
    try {
      const subscriptions = await this.subscriptionsRepository.findByPk(id);
      if (!subscriptions) {
        throw new NotFoundException('Subscriptions not found');
      }
      const update = await this.subscriptionsRepository.update(
        subscriptionsDto,
        {
          where: { id },
          returning: true,
        },
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          subscriptions: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(user_id: number, course_id: number): Promise<object> {
    try {
      const subscriptions = await this.subscriptionsRepository.findOne({
        where: { user_id, course_id }
      });
      if (!subscriptions) {
        throw new NotFoundException('Subscriptions not found');
      }
      await subscriptions.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
