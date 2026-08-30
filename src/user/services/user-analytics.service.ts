import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../models/user.models';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes } from 'sequelize';
import { Role } from '../../role/models/role.models';
import { Sequelize } from 'sequelize-typescript';
import { Reyting } from 'src/reyting/models/reyting.models';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Course } from 'src/course/models/course.models';
import { Test_settings } from 'src/test_settings/models/test_settings.models';
import { Subscriptions } from 'src/subscriptions/models/subscriptions.models';
import { CourseSchedule } from 'src/course_schedule/models/course_schedule.models';

// Reyting (leaderboard) queries and the per-user analytics dashboard
// (attendance calendar, weekly activity, rating position/ball trend,
// upcoming tests). Extracted out of UserService, which keeps thin
// delegating wrappers so callers (bot services, controllers) don't change.
@Injectable()
export class UserAnalyticsService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    private readonly sequelize: Sequelize,
  ) { }

  private static readonly WEEK_DAY_INDEX: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  // A course can be split into subgroups meeting on different weekdays
  // (e.g. "1-guruh" Mon/Wed/Fri vs "2-guruh" Tue/Thu/Sat because one
  // classroom can't fit everyone). Narrows a course's full schedule history
  // down to the version history of the subgroup this subscription belongs
  // to, so attendance/analytics only count the days that actually apply to
  // this student rather than merging both subgroups' schedules together.
  private schedulesForSubgroup(
    schedules: CourseSchedule[],
    subgroup_id?: number | null,
  ): CourseSchedule[] {
    const target = subgroup_id ?? null;
    return (schedules || []).filter(
      (schedule: any) => (schedule.subgroup_id ?? null) === target,
    );
  }

  private sortScheduleHistory(schedules: CourseSchedule[]): CourseSchedule[] {
    return (schedules || [])
      .filter((schedule) => Array.isArray(schedule.attendance_day))
      .sort(
        (left, right) =>
          new Date(left.createdAt).getTime() -
            new Date(right.createdAt).getTime() || left.id - right.id,
      );
  }

  // A schedule change applies from its calendar date and remains active
  // until the next version, so we resolve whichever version was in effect
  // on the given date rather than always using the latest one.
  private getActiveWeekdays(
    scheduleHistory: CourseSchedule[],
    date: Date,
  ): Set<number> {
    const activeSchedule = scheduleHistory.reduce<CourseSchedule | undefined>(
      (active, schedule) =>
        new Date(schedule.createdAt).setHours(0, 0, 0, 0) <= date.getTime()
          ? schedule
          : active,
      undefined,
    );
    return new Set(
      (activeSchedule?.attendance_day || [])
        .map((day) => UserAnalyticsService.WEEK_DAY_INDEX[day])
        .filter((day): day is number => day !== undefined),
    );
  }

  private countScheduledClasses(
    subscriptionDate: Date | string,
    schedules: CourseSchedule[],
  ): number {
    const startDate = new Date(subscriptionDate);
    if (Number.isNaN(startDate.getTime()) || !schedules.length) {
      return 0;
    }

    const scheduleHistory = this.sortScheduleHistory(schedules);
    const date = new Date(startDate);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let scheduledClasses = 0;
    while (date <= today) {
      if (this.getActiveWeekdays(scheduleHistory, date).has(date.getDay())) {
        scheduledClasses += 1;
      }
      date.setDate(date.getDate() + 1);
    }

    return scheduledClasses;
  }

  // Builds the current-month attendance calendar for the given schedule
  // histories (one per subscribed course), merged with the user's actual
  // attendance records for that month.
  private buildMonthlyAttendance(
    scheduleHistories: CourseSchedule[][],
    attendanceByDate: Map<string, number>,
  ) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendar: Array<{
      day: number;
      date: string;
      status: 'present' | 'late' | 'absent' | 'upcoming' | 'none';
    }> = [];
    let present = 0;
    let late = 0;
    let absent = 0;
    let scheduledClasses = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const isScheduled = scheduleHistories.some((history) =>
        this.getActiveWeekdays(history, date).has(date.getDay()),
      );
      const key = this.formatDateKey(date);
      let status: 'present' | 'late' | 'absent' | 'upcoming' | 'none' = 'none';

      if (isScheduled) {
        if (date > today) {
          status = 'upcoming';
        } else {
          scheduledClasses += 1;
          const rawStatus = attendanceByDate.get(key);
          if (rawStatus === 2) {
            status = 'present';
            present += 1;
          } else if (rawStatus === 1) {
            status = 'late';
            late += 1;
          } else {
            status = 'absent';
            absent += 1;
          }
        }
      }

      calendar.push({ day, date: key, status });
    }

    const percentage = scheduledClasses
      ? Number((((present + late) / scheduledClasses) * 100).toFixed(2))
      : 0;

    return {
      year,
      month: month + 1,
      percentage,
      present,
      late,
      absent,
      scheduledClasses,
      calendar,
    };
  }

  // Builds the current week's activity (Mon..Sun), scoped to the days the
  // subscribed courses actually meet on (their attendance_days schedule).
  private buildWeeklyActivity(
    scheduleHistories: CourseSchedule[][],
    attendanceByDate: Map<string, number>,
  ) {
    const dayLabels = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const days: Array<{
      label: string;
      date: string;
      scheduled: boolean;
      status: 'present' | 'late' | 'absent' | 'upcoming' | 'none';
      intensity: number;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const isScheduled = scheduleHistories.some((history) =>
        this.getActiveWeekdays(history, date).has(date.getDay()),
      );
      const key = this.formatDateKey(date);
      let status: 'present' | 'late' | 'absent' | 'upcoming' | 'none' = 'none';
      let intensity = 0;

      if (isScheduled) {
        if (date > today) {
          status = 'upcoming';
          intensity = 0;
        } else {
          const rawStatus = attendanceByDate.get(key);
          if (rawStatus === 2) {
            status = 'present';
            intensity = 100;
          } else if (rawStatus === 1) {
            status = 'late';
            intensity = 55;
          } else {
            status = 'absent';
            intensity = 20;
          }
        }
      }

      days.push({ label: dayLabels[i], date: key, scheduled: isScheduled, status, intensity });
    }

    return days;
  }

  // Uses local date components (not toISOString, which converts to UTC and
  // would shift the date for timezones ahead of UTC) so the key matches the
  // calendar day the date objects were built from.
  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getReyting(group_id: number, course_id: number) {
    course_id = +course_id;
    try {
      const whereConditions: string[] = [];
      const replacements: Record<string, any> = {};

      if (group_id != 0) {
        whereConditions.push(`"Course"."group_id" = :group_id`);
        replacements.group_id = group_id;
      }

      if (course_id) {
        whereConditions.push(`"Course"."id" = :course_id`);
        replacements.course_id = course_id;
      }

      const users = await this.userRepository.findAll({
        where: {
          id: {
            [Op.in]: Sequelize.literal(`(
              SELECT DISTINCT "Reyting"."user_id"
              FROM "reyting" AS "Reyting"
              LEFT JOIN "lesson" AS "Lesson" ON "Lesson"."id" = "Reyting"."lesson_id"
              INNER JOIN "course" AS "Course" ON "Course"."id" = COALESCE("Lesson"."course_id", "Reyting"."course_id")
              ${whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : ''}
            )`),
          },
        },
        attributes: {
          include: [
            [
              Sequelize.literal(`(
                SELECT SUM("reyting"."ball")
                FROM "reyting"
                LEFT JOIN "lesson" ON "lesson"."id" = "reyting"."lesson_id"
                INNER JOIN "course" ON "course"."id" = COALESCE("lesson"."course_id", "reyting"."course_id")
                WHERE "reyting"."user_id" = "User"."id"
                ${group_id != 0 ? ' AND "course"."group_id" = :group_id' : ''}
                ${course_id ? ' AND "course"."id" = :course_id' : ''}
              )::int`),
              'totalReyting',
            ],
          ],
        },
        replacements: { group_id, course_id },
        order: [['totalReyting', 'DESC']],
      });
      return users;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getLessonReyting(lesson_id: number) {
    try {
      const users = await this.userRepository.findAll({
        where: {
          id: {
            [Op.in]: Sequelize.literal(`(
              SELECT DISTINCT "Reyting"."user_id"
              FROM "reyting" AS "Reyting" WHERE "Reyting"."lesson_id" = ${lesson_id}
              AND "Reyting"."user_id" = "User"."id"
            )`),
          },
        },
        attributes: {
          include: [
            [
              Sequelize.literal(`(
                SELECT SUM("reyting"."ball")
                FROM "reyting" WHERE "reyting"."lesson_id" = ${lesson_id}
                AND "reyting"."user_id" = "User"."id"
              )::int`),
              'totalReyting',
            ],
          ],
        },
        order: [['totalReyting', 'DESC']],
      });
      return users;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getUserAnalytics(user_id: number, group_id: number): Promise<any> {
    try {
      if (!user_id) {
        throw new NotFoundException('User not found!');
      }
      const user = await this.userRepository.findOne({
        where: { id: user_id },
        include: [
          {
            model: Role,
          },
          {
            model: Subscriptions,
            include: [
              {
                model: Course,
                where: {
                  group_id,
                },
                include: [
                  {
                    model: CourseSchedule,
                    as: 'attendance_days',
                    required: false,
                  },
                  {
                    model: Lesson,
                    as: 'lessons',
                    include: [
                      {
                        model: Reyting,
                        required: false,
                      },
                      {
                        model: Test_settings,
                        where: {
                          start_date: {
                            [Op.gt]: new Date(),
                          },
                        },
                        required: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!user) {
        throw new NotFoundException('User not found!');
      }

      const [result]: any = await this.sequelize.query(
        `
  WITH ranked AS (
    SELECT
      r.user_id,
      ROW_NUMBER() OVER (ORDER BY SUM(r.ball) DESC) AS position
    FROM reyting r
    LEFT JOIN lesson l ON l.id = r.lesson_id
    JOIN course c ON c.id = COALESCE(l.course_id, r.course_id)
    WHERE c.group_id = :groupId
    GROUP BY r.user_id
  )
  SELECT position
  FROM ranked
  WHERE user_id = :userId
  `,
        {
          replacements: {
            groupId: group_id,
            userId: user_id,
          },
          type: QueryTypes.SELECT,
        },
      );

      const userPosition = result?.position || 0;

      const rankings = await this.sequelize.query(
        `
  WITH ranked AS (
    SELECT
      r.user_id,
      SUM(r.ball) AS ball,
      u.id AS "user.id",
      u.name AS "user.name",
      u.surname AS "user.surname",
      u.image AS "user.image",
      ROW_NUMBER() OVER (ORDER BY SUM(r.ball) DESC) AS position
    FROM reyting r
    LEFT JOIN lesson l ON l.id = r.lesson_id
    JOIN course c ON c.id = COALESCE(l.course_id, r.course_id)
    JOIN "user" u ON u.id = r.user_id
    WHERE c.group_id = :groupId
    GROUP BY r.user_id, u.id, u.name, u.surname, u.image
  )
  SELECT *
  FROM ranked
  WHERE position BETWEEN :userPosition - 2
                     AND :userPosition + 2
  ORDER BY position
  `,
        {
          replacements: {
            groupId: group_id,
            userPosition,
          },
          type: QueryTypes.SELECT,
          nest: true,
          raw: true,
        },
      );

      // =========== reyting position ============ //
      // 1. Joriy va o'tgan oyning sanalarini aniqlaymiz (agar bazada timestamp bo'yicha ajratish kerak bo'lsa)
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // 2. SQL so'rovni bitta o'tishda ham joriy, ham o'tgan oydagi o'rinni hisoblaydigan qilamiz
      const positions: any = await this.sequelize.query(
        `
  WITH current_month_ranked AS (
    SELECT
      r.user_id,
      ROW_NUMBER() OVER (ORDER BY SUM(r.ball) DESC) AS position
    FROM reyting r
    LEFT JOIN lesson l ON l.id = r.lesson_id
    JOIN course c ON c.id = COALESCE(l.course_id, r.course_id)
    WHERE c.group_id = :groupId
      AND EXTRACT(MONTH FROM r."createdAt") = :currentMonth
      AND EXTRACT(YEAR FROM r."createdAt") = :currentYear
    GROUP BY r.user_id
  ),
  last_month_ranked AS (
    SELECT
      r.user_id,
      ROW_NUMBER() OVER (ORDER BY SUM(r.ball) DESC) AS position
    FROM reyting r
    LEFT JOIN lesson l ON l.id = r.lesson_id
    JOIN course c ON c.id = COALESCE(l.course_id, r.course_id)
    WHERE c.group_id = :groupId
      AND EXTRACT(MONTH FROM r."createdAt") = :lastMonth
      AND EXTRACT(YEAR FROM r."createdAt") = :lastMonthYear
    GROUP BY r.user_id
  )
  SELECT
    coalesce(cm.position, 0) as "currentPosition",
    coalesce(lm.position, 0) as "lastPosition"
  FROM "user" u
  LEFT JOIN current_month_ranked cm ON cm.user_id = u.id
  LEFT JOIN last_month_ranked lm ON lm.user_id = u.id
  WHERE u.id = :userId
  `,
        {
          replacements: {
            groupId: group_id,
            userId: user_id,
            currentMonth,
            currentYear,
            lastMonth,
            lastMonthYear
          },
          type: QueryTypes.SELECT,
          plain: true // Obvekt ko'rinishida olish uchun
        }
      );

      const currentPosition = positions?.currentPosition || 0;
      const lastPosition = positions?.lastPosition || 0;

      // 3. O'rinlar farqini (dinamikani) hisoblaymiz
      let rankStatus = "o'zgarishsiz";
      let rankDifference = 0;

      if (lastPosition === 0 && currentPosition > 0) {
        rankStatus = "yangi"; // O'tgan oyda reytingi bo'lmagan
      } else if (currentPosition > 0 && lastPosition > 0) {
        rankDifference = lastPosition - currentPosition;
        if (rankDifference > 0) {
          rankStatus = "ko'tarildi";
        } else if (rankDifference < 0) {
          rankStatus = "tushdi";
          rankDifference = Math.abs(rankDifference); // musbat songa o'tkazish
        }
      }

      const userJSON = user.get({ plain: true });

      // Scoped to this group so it doesn't pull in attendance from the
      // user's other groups.
      const attendanceRows = await this.sequelize.query<{
        course_id: number;
        date: Date;
        status: number;
      }>(
        `
          SELECT a."course_id" AS course_id, a."date" AS date, a."attendance" AS status
          FROM "attendance" a
          JOIN "course" c ON c.id = a."course_id"
          WHERE a."user_id" = :userId AND c."group_id" = :groupId
        `,
        {
          replacements: { userId: user_id, groupId: group_id },
          type: QueryTypes.SELECT,
        },
      );

      // attendance status: 2 = present, 1 = late, 0 = absent (see Activity/Main.vue).
      // Present and late both count as "attended" for percentage purposes.
      const attendanceByCourse = new Map<number, number>();
      const attendanceByDate = new Map<string, number>();
      for (const row of attendanceRows) {
        const status = Number(row.status) || 0;
        if (status > 0) {
          attendanceByCourse.set(
            row.course_id,
            (attendanceByCourse.get(row.course_id) || 0) + 1,
          );
        }
        const dateKey = this.formatDateKey(new Date(row.date));
        const prevStatus = attendanceByDate.get(dateKey);
        if (prevStatus === undefined || status > prevStatus) {
          attendanceByDate.set(dateKey, status);
        }
      }

      const scheduleHistories = userJSON.subscriptions
        .map((subscription: any) =>
          this.sortScheduleHistory(
            this.schedulesForSubgroup(
              subscription.course?.attendance_days || [],
              subscription.subgroup_id,
            ),
          ),
        )
        .filter((history) => history.length);

      userJSON.subscriptions = userJSON.subscriptions.map((subscription: any) => {
        const scheduledClasses = this.countScheduledClasses(
          subscription.start_date,
          this.schedulesForSubgroup(
            subscription.course?.attendance_days || [],
            subscription.subgroup_id,
          ),
        );
        const attendedClasses = attendanceByCourse.get(subscription.course_id) || 0;
        const percentage = scheduledClasses
          ? Number(((attendedClasses / scheduledClasses) * 100).toFixed(2))
          : 0;

        return {
          ...subscription,
          attendance: {
            attended_classes: attendedClasses,
            scheduled_classes: scheduledClasses,
            percentage,
          },
        };
      });

      const monthlyAttendance = this.buildMonthlyAttendance(
        scheduleHistories,
        attendanceByDate,
      );
      const weeklyActivity = this.buildWeeklyActivity(
        scheduleHistories,
        attendanceByDate,
      );

      const upcomingTests = userJSON.subscriptions
        .flatMap((subscription: any) =>
          (subscription.course?.lessons || []).flatMap((lesson: any) =>
            (lesson.test_settings || []).map((setting: any) => ({
              id: setting.id,
              lesson_id: lesson.id,
              lesson_title: lesson.title,
              course_id: subscription.course_id,
              course_title: subscription.course?.title,
              test_type: setting.test_type,
              start_date: setting.start_date,
              end_date: setting.end_date,
              duration: lesson.duration,
              question_count: 0,
            })),
          ),
        )
        .sort(
          (left: any, right: any) =>
            new Date(left.start_date).getTime() - new Date(right.start_date).getTime(),
        );

      const upcomingLessonIds = [
        ...new Set(upcomingTests.map((test: any) => test.lesson_id)),
      ];
      if (upcomingLessonIds.length) {
        const questionCountRows: any = await this.sequelize.query(
          `
            SELECT "lesson_id", COUNT(*)::int AS count
            FROM "tests"
            WHERE "lesson_id" IN (:lessonIds) AND "type" != 'deleted'
            GROUP BY "lesson_id"
          `,
          {
            replacements: { lessonIds: upcomingLessonIds },
            type: QueryTypes.SELECT,
          },
        );
        const questionCounts = new Map(
          questionCountRows.map((row: any) => [row.lesson_id, row.count]),
        );
        upcomingTests.forEach((test: any) => {
          test.question_count = questionCounts.get(test.lesson_id) || 0;
        });
      }

      // ========== reyting ball ================== //


      const positionsBall: any = await this.sequelize.query(
        `
  WITH current_month_ranked AS (
    SELECT
      r.user_id,
      SUM(r.ball) AS total_ball,
      ROW_NUMBER() OVER (ORDER BY SUM(r.ball) DESC) AS position
    FROM reyting r
    LEFT JOIN lesson l ON l.id = r.lesson_id
    JOIN course c ON c.id = COALESCE(l.course_id, r.course_id)
    WHERE c.group_id = :groupId
      AND EXTRACT(MONTH FROM r."createdAt") = :currentMonth
      AND EXTRACT(YEAR FROM r."createdAt") = :currentYear
    GROUP BY r.user_id
  ),
  last_month_ranked AS (
    SELECT
      r.user_id,
      SUM(r.ball) AS total_ball,
      ROW_NUMBER() OVER (ORDER BY SUM(r.ball) DESC) AS position
    FROM reyting r
    LEFT JOIN lesson l ON l.id = r.lesson_id
    JOIN course c ON c.id = COALESCE(l.course_id, r.course_id)
    WHERE c.group_id = :groupId
      AND EXTRACT(MONTH FROM r."createdAt") = :lastMonth
      AND EXTRACT(YEAR FROM r."createdAt") = :lastMonthYear
    GROUP BY r.user_id
  )
  SELECT
    COALESCE(cm.position, 0) as "currentPosition",
    COALESCE(lm.position, 0) as "lastPosition",
    COALESCE(cm.total_ball, 0) as "currentBall",
    COALESCE(lm.total_ball, 0) as "lastBall"
  FROM "user" u
  LEFT JOIN current_month_ranked cm ON cm.user_id = u.id
  LEFT JOIN last_month_ranked lm ON lm.user_id = u.id
  WHERE u.id = :userId
  `,
        {
          replacements: {
            groupId: group_id,
            userId: user_id,
            currentMonth,
            currentYear,
            lastMonth,
            lastMonthYear
          },
          type: QueryTypes.SELECT,
          plain: true
        }
      );

      // Qiymatlarni o'zgaruvchilarga olamiz
      const currentBall = Number(positionsBall?.currentBall) || 0;
      const lastBall = Number(positionsBall?.lastBall) || 0;

      // Ball o'zgarishi mantiqi
      let ballStatus = "o'zgarishsiz";
      let ballDifference = currentBall - lastBall; // Joriy balldan o'tgan oynikini ayiramiz

      if (ballDifference > 0) {
        ballStatus = "oshdi";
      } else if (ballDifference < 0) {
        ballStatus = "kamaydi";
        ballDifference = Math.abs(ballDifference); // Musbat son ko'rinishiga o'tkazish
      }

      return {
        ...userJSON, rankings, ratingStats: {
          currentPosition,
          difference: rankDifference,
          status: rankStatus,
        }, ratingBallStats: {
          currentBall,
          difference: ballDifference,
          status: ballStatus,
        },
        attendanceStats: monthlyAttendance,
        weeklyActivity,
        upcomingTests,
        newTestsCount: upcomingTests.length,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
