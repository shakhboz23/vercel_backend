import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Course } from './models/course.models';
import { InjectModel } from '@nestjs/sequelize';
import { CourseDto } from './dto/course.dto';
import { Tests } from '../test/models/test.models';
import { UserService } from '../user/user.service';
import { UploadedService } from '../uploaded/uploaded.service';
import { Subscriptions } from 'src/subscriptions/models/subscriptions.models';
import { User } from 'src/user/models/user.models';
import { Role } from 'src/role/models/role.models';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { SubscriptionActivity } from 'src/subscription_activity/models/subscription_activity.models';
import { Group } from 'src/group/models/group.models';
import { ChatGroupService } from 'src/chat_group/chat_group.service';
import { ChatGroupType } from 'src/chat_group/dto/chat_group.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course) private courseRepository: typeof Course,
    private readonly userService: UserService,
    private readonly chatGroupService: ChatGroupService,
    private readonly uploadedService: UploadedService,
  ) { }

  async create(courseDto: CourseDto, cover: any, user_id: number): Promise<object> {
    try {
      const { title } = courseDto;
      const exist = await this.courseRepository.findOne({
        where: { title },
      });
      if (exist) {
        throw new BadRequestException('Already created');
      }
      const file_type: string = 'image';
      let file_data: any;
      let image_url: string; 
      if (cover) {
        file_data = await this.uploadedService.create(cover, file_type);
        cover = file_data;
      }
      const course: any = await this.courseRepository.create({
        ...courseDto,
        group_id: +courseDto.group_id,
        user_id,
        cover,
      });
      await this.chatGroupService.create({ course_id: course.id, chat_type: ChatGroupType.group, group_id: courseDto.group_id })
      return {
        statusCode: HttpStatus.OK,
        message: 'Created successfully',
        data: course,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(category_id: number): Promise<object> {
    try {
      let category: any = {}
      if (+category_id) {
        category = { where: { category_id } }
      }
      const courses: any = await this.courseRepository.findAll({
        ...category,
        order: [['id', 'ASC']],
      });
      if (!courses.length) {
        throw new NotFoundException('Courses not found');
      }
      return courses;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getByCourse(group_id: number, category_id: number): Promise<Object> {
    try {
      let category: any = {
        where: {
          group_id,
        }
      }
      if (+category_id) {
        category = {
          where: {
            category_id, group_id
          }
        }
      }
      const courses: any = await this.courseRepository.findAll({
        ...category,
        order: [['title', 'ASC']],
        include: [
          {
            model: Subscriptions,
            attributes: ['user_id'],
            include: [{ model: User, include: [{ model: Role }] }],
          },
        ],
      });
      // if (!courses.length) {
      //   throw new NotFoundException('Courses not found');
      // }
      return courses;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getUsersByGroupId(group_id: number, date: Date, user_id: number, course_id: number, page: string): Promise<object> {
    try {
      course_id = +course_id || null;
      let id: any;
      course_id ? id = { id: course_id } : {};
      // let id = {};
      console.log(id);
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)); // Kun boshidan
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)); // Kun oxirigacha
      console.log(startOfDay, endOfDay);
      let users: any = await this.courseRepository.findAll({
        where: { group_id },
        include: [{
          model: Subscriptions, include: [{ model: User }, {
            model: SubscriptionActivity, where: {
              course_id,
              createdAt: {
                [Op.between]: [startOfDay, endOfDay], // Sana oralig'i
              },
            },
            required: false
          }, { model: Course, where: { ...id } }]
        }],
        order: [[{ model: Subscriptions, as: 'subscriptions' }, { model: User, as: 'user' }, 'name', 'ASC']],
      });
      console.log(users, '23033')
      let user: any = await this.courseRepository.findAll({
        where: { group_id },
        include: [{
          model: Subscriptions, where: { user_id }
        }, //{ model: Group, where: { user_id }, required: false }
        ],
      });
      console.log(user, '2222');
      if (!users) {
        throw new NotFoundException('Users not found');
      }
      if (page == 'activity') {
        users = users.reduce((acc, item) => acc.concat(item.subscriptions), []);
      } else {

        const groupedUsers = users.reduce((acc: any, courseItem: any) => {
          courseItem.subscriptions.forEach((subscription: any) => {
            const userId = subscription.user_id;

            if (!acc[userId]) {
              acc[userId] = {
                user: subscription.user,
                courses: [],
              };
            }

            acc[userId].courses.push({
              course: subscription.course,
              subscription: {
                id: subscription.id,
                role: subscription.role,
                is_active: subscription.is_active,
                createdAt: subscription.createdAt,
                updatedAt: subscription.updatedAt,
              },
            });
          });
          return acc;
        }, {});

        // Objectni massivga aylantirish
        users = Object.values(groupedUsers);
      }

      return { users, user };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number, user_id: number): Promise<object> {
    try {
      const course = await this.courseRepository.findOne({
        where: { id },
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT "group"."user_id" FROM "group" WHERE "group"."id" = "Course"."group_id" AND "Course"."id" = :id)::int`,
              ),
              'user_id',
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM "lesson" WHERE "lesson"."course_id" = :id AND "lesson"."type" = 'lesson')::int`,
              ),
              'lessons_count',
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM "reyting" WHERE "reyting"."lesson_id" IN (SELECT "id" FROM "lesson" WHERE "lesson"."course_id" = :id) AND "reyting"."user_id" = :user_id AND "reyting"."ball" > 70)::int`,
              ),
              'finished_count',
            ],
            [
              Sequelize.literal(
                `(CASE WHEN EXISTS (SELECT 1 FROM "subscriptions" WHERE "subscriptions"."course_id" = "Course"."id" AND "subscriptions"."user_id" = :user_id) THEN true ELSE false END)`,
              ),
              'is_subscribed',
            ],
          ],
        },
        replacements: {
          id,
          user_id,
        },
      });
      // if (!course) {
      //   throw new NotFoundException('Course not found');
      // }
      return course;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const courses = await this.courseRepository.findAll({ offset, limit });
      const total_count = await this.courseRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: courses,
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

  async update(id: number, courseDto: CourseDto, cover: any, user_id: number): Promise<object> {
    try {
      console.log(courseDto.price)
      const course = await this.courseRepository.findByPk(id);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      if (course.user_id != user_id) {
        throw new ForbiddenException("You don't have an access");
      }
      const file_type: string = 'image';
      let file_data: any;
      let image_url: string;
      if (cover) {
        file_data = await this.uploadedService.create({ file_type }, cover);
        cover = file_data.data.url;
      }
      const update = await this.courseRepository.update({ ...courseDto, cover: cover || course.cover }, {
        where: { id },
        returning: true,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          course: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      console.log(id);
      const course = await this.courseRepository.findByPk(id);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      course.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
