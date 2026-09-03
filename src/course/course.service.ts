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
import { Lesson, lessonType } from 'src/lesson/models/lesson.models';
import { SubCategory } from 'src/subcategory/models/subcategory.models';
import { Category } from 'src/category/models/category.models';
import { GroupService } from 'src/group/group.service';
import { Attendance } from 'src/attendance/models/attendance.models';
import { FinishedType, Reyting } from 'src/reyting/models/reyting.models';
import {
  AttendanceDay,
  CourseSchedule,
} from 'src/course_schedule/models/course_schedule.models';
import { CourseScheduleService } from 'src/course_schedule/course_schedule.service';
import { Payment } from 'src/payment/models/payment.models';
import { CourseSubgroup } from 'src/course_subgroup/models/course_subgroup.models';
import {
  CourseSubgroupInput,
  CourseSubgroupService,
} from 'src/course_subgroup/course_subgroup.service';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course) private courseRepository: typeof Course,
    private readonly courseScheduleService: CourseScheduleService,
    private readonly courseSubgroupService: CourseSubgroupService,
    private readonly userService: UserService,
    private readonly groupService: GroupService,
    private readonly chatGroupService: ChatGroupService,
    private readonly uploadedService: UploadedService,
    private readonly watchedService: WatchedService,
    private readonly filesService: FilesService,
  ) {}

  private parseAttendanceDays(
    attendanceDays?: string,
  ): AttendanceDay[] | undefined {
    if (
      attendanceDays === undefined ||
      attendanceDays === null ||
      attendanceDays === ''
    ) {
      return undefined;
    }

    let days: unknown;
    try {
      days = Array.isArray(attendanceDays)
        ? attendanceDays
        : JSON.parse(attendanceDays);
    } catch {
      throw new BadRequestException(
        'attendance_days must be a JSON array, for example ["Mon", "Tue", "Wed"]',
      );
    }

    if (!Array.isArray(days)) {
      throw new BadRequestException('attendance_days must be a JSON array');
    }

    const aliases: Record<string, AttendanceDay> = {
      mon: AttendanceDay.mon,
      tue: AttendanceDay.tue,
      wed: AttendanceDay.wed,
      wen: AttendanceDay.wed,
      thu: AttendanceDay.thu,
      fri: AttendanceDay.fri,
      sat: AttendanceDay.sat,
      sun: AttendanceDay.sun,
    };
    const normalizedDays = days.map(
      (day) => aliases[String(day).trim().toLowerCase()],
    );

    if (normalizedDays.some((day) => !day)) {
      throw new BadRequestException(
        'attendance_days may only contain Mon, Tue, Wed, Thu, Fri, Sat, or Sun',
      );
    }

    return [...new Set(normalizedDays)];
  }

  private parseSubgroups(
    subgroupsRaw?: string,
  ): CourseSubgroupInput[] | undefined {
    if (
      subgroupsRaw === undefined ||
      subgroupsRaw === null ||
      subgroupsRaw === ''
    ) {
      return undefined;
    }

    let parsed: unknown;
    try {
      parsed = Array.isArray(subgroupsRaw)
        ? subgroupsRaw
        : JSON.parse(subgroupsRaw);
    } catch {
      throw new BadRequestException(
        'subgroups must be a JSON array, for example [{"name":"1-guruh","attendance_days":["Mon","Wed","Fri"]}]',
      );
    }

    if (!Array.isArray(parsed) || !parsed.length) {
      throw new BadRequestException('subgroups must be a non-empty JSON array');
    }

    return parsed.map((item: any) => {
      const name = typeof item?.name === 'string' ? item.name.trim() : '';
      if (!name) {
        throw new BadRequestException('Each subgroup requires a name');
      }

      const attendanceDays = this.parseAttendanceDays(
        Array.isArray(item?.attendance_days)
          ? JSON.stringify(item.attendance_days)
          : item?.attendance_days,
      );
      if (!attendanceDays?.length) {
        throw new BadRequestException(
          `"${name}" subgroup requires at least one attendance day`,
        );
      }

      return {
        id: item?.id ? Number(item.id) : undefined,
        name,
        attendance_days: attendanceDays,
      };
    });
  }

  async create(
    courseDto: CourseDto,
    cover: any,
    user_id: number,
  ): Promise<object> {
    try {
      const { title, attendance_days, subgroups, ...courseData } = courseDto;
      const attendanceDays = this.parseAttendanceDays(attendance_days);
      const parsedSubgroups = this.parseSubgroups(subgroups);
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
        ...courseData,
        group_id: +courseData.group_id,
        user_id,
        cover,
        title,
      });
      if (parsedSubgroups?.length) {
        await this.courseSubgroupService.sync(course.id, parsedSubgroups);
      } else if (attendanceDays?.length) {
        await this.courseScheduleService.create(course.id, attendanceDays);
      }
      await this.chatGroupService.create({
        course_id: course.id,
        chat_type: ChatGroupType.group,
        group_id: courseDto.group_id,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Created successfully',
        data: course,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(
    subcategory_id: string,
    user_id: number,
    category_id: number,
  ): Promise<object> {
    try {
      subcategory_id = JSON.parse(subcategory_id || '[]');
      let subcategory: any = {};
      let categoryInclude: any = {};
      if (!subcategory_id?.length && +category_id) {
        categoryInclude = {
          include: [
            {
              model: SubCategory,
              include: [
                {
                  model: Category,
                  where: {
                    id: category_id,
                  },
                  required: true,
                },
              ],
              required: true,
            },
          ],
        };
      } else if (subcategory_id?.length) {
        subcategory = {
          where: {
            subcategory_id: {
              [Op.in]: subcategory_id,
            },
          },
        };
      }
      const courses: any = await this.courseRepository.findAll({
        ...subcategory,
        ...categoryInclude,
        include: [
          {
            model: CourseSchedule,
            as: 'attendance_days',
            separate: true,
            limit: 1,
            order: [['createdAt', 'DESC']],
          },
          {
            model: CourseSubgroup,
            as: 'subgroups',
            include: [
              {
                model: CourseSchedule,
                as: 'schedules',
                separate: true,
                limit: 1,
                order: [['createdAt', 'DESC']],
              },
            ],
            required: false,
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
          ],
        },
        order: [['id', 'ASC']],
      });
      if (!courses.length) {
        throw new NotFoundException('Courses not found');
      }
      return courses;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllLessons(course_id: number): Promise<object> {
    try {
      const courses: any = await this.courseRepository.findOne({
        where: {
          id: course_id,
        },
        include: [
          { model: Lesson, as: 'lessons', where: { type: lessonType.lesson } },
        ],
      });
      if (!courses) {
        throw new NotFoundException('Courses not found');
      }
      return courses;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getByCourse(
    group_id: number,
    subcategory_id: string,
    user_id: number,
  ): Promise<Object> {
    try {
      subcategory_id = JSON.parse(subcategory_id || '[]');

      const subcategory: any = {
        where: {
          group_id,
        },
      };

      if (subcategory_id?.length) {
        subcategory.where.subcategory_id = {
          [Op.in]: subcategory_id,
        };
      }

      const group: any = await this.groupService.getById(group_id, user_id);

      const courses: any = await this.courseRepository.findAll({
        ...subcategory,
        order: [['title', 'ASC']],
        include: [
          {
            model: Subscriptions,
            attributes: ['user_id'],
          },
          {
            model: CourseSchedule,
            as: 'attendance_days',
            separate: true,
            limit: 1,
            order: [['createdAt', 'DESC']],
          },
          {
            model: CourseSubgroup,
            as: 'subgroups',
            include: [
              {
                model: CourseSchedule,
                as: 'schedules',
                separate: true,
                limit: 1,
                order: [['createdAt', 'DESC']],
              },
            ],
            required: false,
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
          ],
        },
        replacements: {
          user_id,
        },
      });
      await this.watchedService.create({ group_id }, user_id);
      return { courses, group };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getUsersByGroupId(
    group_id: number,
    date: Date,
    user_id: number,
    course_id: number,
    page: string,
    lesson_id?: number,
  ): Promise<object> {
    try {
      course_id = +course_id || null;
      lesson_id = +lesson_id || null;
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)); // Kun boshidan
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)); // Kun oxirigacha
      const attendanceWhere: any = {
        date: { [Op.between]: [startOfDay, endOfDay] },
      };
      if (course_id) {
        attendanceWhere.course_id = course_id;
      }

      const userInclude: any[] = [
        {
          model: Attendance,
          where: attendanceWhere,
          required: false,
        },
      ];

      // Only join task (vazifa) status for a specific lesson - otherwise a
      // student would show one Reyting row per task-graded lesson in the
      // course, which the per-lesson "submitted/not submitted" table can't use.
      if (lesson_id) {
        userInclude.push({
          model: Reyting,
          as: 'reyting',
          where: { lesson_id, finished_type: FinishedType.task },
          required: false,
        });
      }

      const user: any = await this.courseRepository.findAll({
        where: { group_id },
        include: [
          {
            model: Subscriptions,
            include: [
              {
                model: User,
                required: false,
                include: userInclude,
              },
              { model: Course },
            ],
          },
          {
            model: CourseSchedule,
            as: 'attendance_days',
            separate: true,
            limit: 1,
            order: [['createdAt', 'DESC']],
          },
          {
            model: CourseSubgroup,
            as: 'subgroups',
            required: false,
            include: [
              {
                model: CourseSchedule,
                as: 'schedules',
                separate: true,
                limit: 1,
                order: [['createdAt', 'DESC']],
              },
            ],
          },
        ],
      });

      return user;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(
    id: number,
    user_id: number,
    date?: any,
    search?: string,
    status?: string,
  ): Promise<object> {
    try {
      let startOfMonth: any = null;
      let endOfMonth: any = null;
      if (date && date != 'null') {
        date = new Date(date);
        startOfMonth = new Date(date?.getFullYear(), date.getMonth(), 1);
        endOfMonth = new Date(date?.getFullYear(), date?.getMonth() + 1, 1);
      } else {
        const now = new Date();
        startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      const paymentWhere: any = { course_id: id };
      if (startOfMonth && endOfMonth) {
        // generateDuePayments always sets due_date to midnight on the 1st of
        // a month, i.e. exactly startOfMonth - Op.gt excluded that exact
        // timestamp, so a student's payment for the current month never
        // matched and the row silently vanished from this endpoint.
        paymentWhere.due_date = {
          [Op.gte]: startOfMonth,
          [Op.lt]: endOfMonth,
        };
      }

      const userWhere: any = {};
      if (search) {
        userWhere[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { surname: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const course: any = await this.courseRepository.findOne({
        where: { id },
        include: [
          { model: CourseSchedule, as: 'attendance_days' },
          {
            model: CourseSubgroup,
            as: 'subgroups',
            include: [
              {
                model: CourseSchedule,
                as: 'schedules',
                separate: true,
                limit: 1,
                order: [['createdAt', 'DESC']],
              },
            ],
            required: false,
          },
          { model: User, as: 'teacher' },
          {
            model: Subscriptions,
            include: [
              {
                model: User,
                where: search ? userWhere : undefined,
                required: !!search,
                include: [
                  {
                    model: Payment,
                    where: paymentWhere,
                    required: false,
                    order: [['due_date', 'DESC']],
                  },
                ],
              },
            ],
          },
        ],
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
              'payment',
            ],
            [
              Sequelize.literal(
                `(SELECT "group"."user_id" FROM "group" WHERE "group"."id" = "Course"."group_id" AND "Course"."id" = :id)::int`,
              ),
              'user_id',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT COALESCE(SUM("lesson"."duration"), 0) FROM "lesson" WHERE "lesson"."course_id" = :id)::int, 0)`,
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

      // Debt is a sum across every unpaid-month Payment row (see
      // generateDuePayments), so it can't be expressed as a single-row SQL
      // where clause on Payment - filter the already-loaded subscriptions
      // in JS instead, using the same rows the "Qolgan"/"Oylik to'lov"
      // columns are built from.
      if (course && status && status !== 'Barchasi') {
        const subscriptions = (course.subscriptions || []).filter((sub: any) => {
          const payments = sub.user?.payments || [];
          const debt = payments.reduce(
            (sum: number, payment: any) => sum + Number(payment?.debt || 0),
            0,
          );
          return status === 'Qarzdorlar' ? debt > 0 : debt <= 0;
        });
        course.setDataValue('subscriptions', subscriptions);
      }

      await this.watchedService.create({ course_id: id }, user_id);
      return course;
    } catch (error: any) {
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
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async update(
    id: number,
    courseDto: CourseDto,
    cover: any,
    user_id: number,
  ): Promise<object> {
    try {
      const course = await this.courseRepository.findByPk(id);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      if (course.user_id != user_id) {
        throw new ForbiddenException("You don't have an access");
      }
      const { attendance_days, subgroups, ...courseData } = courseDto;
      const attendanceDays = this.parseAttendanceDays(attendance_days);
      const parsedSubgroups = this.parseSubgroups(subgroups);
      const file_type: string = 'image';
      if (cover) {
        if (course.cover) {
          await this.filesService.deleteFile(course.cover);
        }
        cover = await this.uploadedService.create(cover, file_type);
      }
      const update = await this.courseRepository.update(
        { ...courseData, cover: cover || course.cover },
        {
          where: { id },
          returning: true,
        },
      );
      if (parsedSubgroups) {
        await this.courseSubgroupService.sync(id, parsedSubgroups);
      } else if (attendanceDays !== undefined) {
        const hasSameAttendanceDays =
          await this.courseScheduleService.hasSameAttendanceDays(
            id,
            attendanceDays,
          );

        if (!hasSameAttendanceDays) {
          await this.courseScheduleService.create(id, attendanceDays);
        }
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          course: update[1][0],
        },
      };
    } catch (error: any) {
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
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
