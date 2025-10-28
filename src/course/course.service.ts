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
import { WatchedService } from 'src/watched/watched.service';
import { FilesService } from 'src/files/files.service';
import { lessonType } from 'src/lesson/models/lesson.models';
import { SubCategory } from 'src/subcategory/models/subcategory.models';
import { Category } from 'src/category/models/category.models';
import { GroupService } from 'src/group/group.service';
import { group } from 'console';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course) private courseRepository: typeof Course,
    private readonly userService: UserService,
    private readonly groupService: GroupService,
    private readonly chatGroupService: ChatGroupService,
    private readonly uploadedService: UploadedService,
    private readonly watchedService: WatchedService,
    private readonly filesService: FilesService,
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

  async getAll(subcategory_id: string, user_id: number, category_id: number): Promise<object> {
    try {
      subcategory_id = JSON.parse(subcategory_id || "[]");
      let subcategory: any = {};
      let categoryInclude: any = {};
      if (!subcategory_id?.length && +category_id) {
        categoryInclude = {
          include: [{
            model: SubCategory,
            include: [{
              model: Category,
              where: {
                id: category_id
              },
              required: true,
            },
            ],
            required: true,
          }]
        }
      } else if (subcategory_id?.length) {
        subcategory = {
          where: {
            subcategory_id: {
              [Op.in]: subcategory_id
            }
          }
        }
      }
      const courses: any = await this.courseRepository.findAll({
        ...subcategory,
        ...categoryInclude,
        attributes: {
          include: [
            [
              Sequelize.literal(`
                COALESCE((
                  SELECT COUNT(*) FROM "reyting"
                  WHERE
                    "reyting"."lesson_id" IN (
                      SELECT "id" FROM "lesson" WHERE "lesson"."course_id" = "Course"."id"
                    )
                    AND "reyting"."user_id" = ${user_id}
                    AND "reyting"."ball" > (
                      SELECT COUNT(*) * 0.7 FROM "tests" WHERE "tests"."lesson_id" = "reyting"."lesson_id"
                    )
                )::int, 0)
              `),
              'finished_count',
            ],
            [
              Sequelize.literal(`
                COALESCE((
                  SELECT COUNT(*) FROM "lesson"
                  WHERE "lesson"."course_id" = "Course"."id" and "lesson"."type" = '${lessonType.lesson}'
                )::int, 0)
              `),
              'lessons_count',
            ],
            [
              Sequelize.literal(`
                COALESCE((
                  SELECT COUNT(*) FROM "likes"
                  WHERE "likes"."lesson_id" IN (
                    SELECT "id" FROM "lesson" WHERE "lesson"."course_id" = "Course"."id"
                  )
                )::int, 0)
              `),
              'likes_count',
            ],
          ]
        },
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

  async getByCourse(group_id: number, subcategory_id: string, user_id: number): Promise<Object> {
    try {
      subcategory_id = JSON.parse(subcategory_id || "[]");

      let subcategory: any = {
        where: {
          group_id,
        }
      }

      console.log(subcategory_id, 2303);
      
      if (subcategory_id?.length) {
        subcategory.where.subcategory_id = {
          [Op.in]: subcategory_id
        }
      }

      console.log(subcategory);
      

      const group: any = await this.groupService.getById(group_id, user_id);

      const courses: any = await this.courseRepository.findAll({
        ...subcategory,
        order: [['title', 'ASC']],
        include: [
          {
            model: Subscriptions,
            attributes: ['user_id'],
            include: [{ model: User, include: [{ model: Role }] }],
          },
        ],
        attributes: {
          include: [
            [
              Sequelize.literal(`
                COALESCE((
                  SELECT COUNT(*) FROM "reyting"
                  WHERE
                    "reyting"."lesson_id" IN (
                      SELECT "id" FROM "lesson" WHERE "lesson"."course_id" = "Course"."id"
                    )
                    AND "reyting"."user_id" = ${user_id}
                    AND "reyting"."ball" > (
                      SELECT COUNT(*) * 0.7 FROM "tests" WHERE "tests"."lesson_id" = "reyting"."lesson_id"
                    )
                )::int, 0)
              `),
              'finished_count',
            ],
            [
              Sequelize.literal(`
                COALESCE((
                  SELECT COUNT(*) FROM "lesson"
                  WHERE "lesson"."course_id" = "Course"."id" and "lesson"."type" = '${lessonType.lesson}'
                )::int, 0)
              `),
              'lessons_count',
            ],
            [
              Sequelize.literal(`
                COALESCE((
                  SELECT COUNT(*) FROM "likes"
                  WHERE "likes"."lesson_id" IN (
                    SELECT "id" FROM "lesson" WHERE "lesson"."course_id" = "Course"."id"
                  )
                )::int, 0)
              `),
              'likes_count',
            ],
          ]
        },
        replacements: {
          user_id,
        },
      });
      await this.watchedService.create({ group_id }, user_id);
      // if (!courses.length) {
      //   throw new NotFoundException('Courses not found');
      // }
      return { courses, group };
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
              Sequelize.literal(`
                (
                  SELECT row_to_json(s) FROM (
                    SELECT "id", "amount", "status", "createdAt"
                    FROM "stripe"
                    WHERE
                      "stripe"."user_id" = :user_id AND
                      "stripe"."course_id" = :id AND
                      ("stripe"."createdAt" + interval '1 month') > NOW()
                    ORDER BY "createdAt" DESC
                    LIMIT 1
                  ) s
                )
              `),
              'payment'
            ],
            [
              Sequelize.literal(
                `(SELECT "group"."user_id" FROM "group" WHERE "group"."id" = "Course"."group_id" AND "Course"."id" = :id)::int`,
              ),
              'user_id',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT COALESCE(SUM("lesson"."duration"), 0) FROM "lesson" WHERE "lesson"."course_id" = :id)::int, 0)`
              ),
              'total_duration',
            ],
            [
              Sequelize.literal(`
                COALESCE((
                  SELECT COUNT(*) FROM "likes"
                  WHERE "likes"."lesson_id" IN (
                    SELECT "id" FROM "lesson" WHERE "lesson"."course_id" = :id
                  )
                )::int, 0)
              `),
              'likes_count',
            ],
            [
              Sequelize.literal(`
                COALESCE((
                  SELECT COUNT(*) FROM "subscriptions"
                  WHERE "subscriptions"."course_id" = :id
                )::int, 0)
              `),
              'subscriptions_count',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT COUNT(*) FROM "lesson" WHERE "lesson"."course_id" = :id AND "lesson"."type" = 'lesson')::int, 0)`,
              ),
              'lessons_count',
            ],
            [
              Sequelize.literal(`
                COALESCE((
                  SELECT COUNT(*) FROM "reyting"
                  WHERE
                    "reyting"."lesson_id" IN (
                      SELECT "id" FROM "lesson" WHERE "lesson"."course_id" = :id
                    )
                    AND "reyting"."user_id" = :user_id
                    AND "reyting"."ball" > (
                      SELECT COUNT(*) * 0.7 FROM "tests" WHERE "tests"."lesson_id" = "reyting"."lesson_id"
                    )
                )::int, 0)
              `),
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
      await this.watchedService.create({ course_id: id }, user_id);
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
      if (cover) {
        await this.filesService.deleteFile(course.cover);
        cover = await this.uploadedService.create(cover, file_type);
        console.log(cover)
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
      const course = await this.courseRepository.findByPk(id);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      await this.filesService.deleteFile(course.cover);
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
