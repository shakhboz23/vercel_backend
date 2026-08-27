import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinishedType, Reyting } from './models/reyting.models';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ReytingDto } from './dto/reyting.dto';
import { Sequelize } from 'sequelize-typescript';
import { User } from 'src/user/models/user.models';
import { TestsService } from 'src/test/test.service';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Course } from 'src/course/models/course.models';
import { BotService } from 'src/bot/bot.service';

const RATING_REASON_LABELS: Partial<Record<FinishedType, string>> = {
  [FinishedType.test]: 'Test natijasi',
  [FinishedType.task]: 'Vazifa natijasi',
  [FinishedType.attendance]: 'Davomat balli',
  [FinishedType.manual]: "Qo'lda belgilandi",
};

@Injectable()
export class ReytingService {
  constructor(
    @InjectModel(Reyting) private reytingRepository: typeof Reyting,
    @InjectModel(Lesson) private lessonRepository: typeof Lesson,
    @InjectModel(Course) private courseRepository: typeof Course,
    @Inject(forwardRef(() => TestsService))
    private readonly testsService: TestsService,
    @Inject(forwardRef(() => BotService))
    private readonly botService: BotService,
  ) { }

  // Looks up display info for a rating-change notification: the course
  // title (via the lesson if the reyting is lesson-based, or directly if
  // it's a course-level entry like attendance ball) and the lesson title.
  private async resolveRatingContext(
    lesson_id?: number | null,
    course_id?: number | null,
  ): Promise<{ courseTitle: string; lessonTitle?: string }> {
    let lessonTitle: string | undefined;
    let resolvedCourseId = course_id ?? null;

    if (lesson_id) {
      const lesson = await this.lessonRepository.findByPk(lesson_id, {
        attributes: ['title', 'course_id'],
      });
      lessonTitle = lesson?.title;
      resolvedCourseId = resolvedCourseId ?? lesson?.course_id ?? null;
    }

    const course = resolvedCourseId
      ? await this.courseRepository.findByPk(resolvedCourseId, {
          attributes: ['title'],
        })
      : null;

    return { courseTitle: course?.title || '', lessonTitle };
  }

  // Notifies the student's and their parents' bots whenever a reyting
  // write actually changes the stored ball, with the reason (test/task/
  // attendance/manual) and the course/lesson it happened in.
  private notifyRatingChange(
    user_id: number,
    lesson_id: number | null | undefined,
    course_id: number | null | undefined,
    finished_type: FinishedType | undefined,
    oldBall: number | null,
    newBall: number | null,
  ): void {
    if (newBall == null || newBall === (oldBall ?? 0)) {
      return;
    }

    this.resolveRatingContext(lesson_id, course_id)
      .then(({ courseTitle, lessonTitle }) => {
        const reason = (finished_type && RATING_REASON_LABELS[finished_type]) || 'Yangilandi';
        const reasonText = lessonTitle ? `${reason} — "${lessonTitle}"` : reason;
        return this.botService.notifyRatingChanged(
          user_id,
          courseTitle,
          reasonText,
          newBall,
          newBall - (oldBall ?? 0),
        );
      })
      .catch((error) => console.log(error));
  }

  async create(reytingDto: ReytingDto, user_id: number): Promise<object> {
    try {
      console.log('goo');
      
      let is_reyting: any;

      if (reytingDto.finished_type === FinishedType.attendance) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        is_reyting = await this.reytingRepository.findOne({
          where: {
            user_id,
            finished_type: FinishedType.attendance,
            course_id: reytingDto.course_id,
            createdAt: { [Op.between]: [todayStart, todayEnd] },
          },
        });
      } else {
        is_reyting = await this.reytingRepository.findOne({
          where: {
            user_id,
            lesson_id: reytingDto.lesson_id ?? null,
          },
        });
      }
      console.log(is_reyting, '====');
      
      if (!is_reyting) {
        const reyting = await this.reytingRepository.create({
          ...reytingDto,
          user_id,
          is_finished: true,
        });
        this.notifyRatingChange(
          user_id,
          reyting.lesson_id,
          reyting.course_id,
          reyting.finished_type,
          null,
          reyting.ball,
        );
        return {
          statusCode: HttpStatus.OK,
          message: 'Successfully added!',
          data: reyting,
        };
      } else {
        console.log('------------------');

        const oldBall = is_reyting.ball;
        const reyting = await this.reytingRepository.update({
          ...reytingDto,
          user_id,
        }, {
          where: { id: is_reyting.id },
          returning: true,
        });
        const updated = reyting[1][0];
        this.notifyRatingChange(
          user_id,
          updated.lesson_id,
          updated.course_id,
          updated.finished_type,
          oldBall,
          updated.ball,
        );
        return {
          statusCode: HttpStatus.OK,
          message: 'Successfully updated!',
          data: reyting,
        };
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Already added!',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async exists(lesson_id: number, user_id: number): Promise<boolean> {
    const reyting = await this.reytingRepository.findOne({
      where: { lesson_id, user_id },
    });
    return !!reyting;
  }

  async getTaskStatus(user_id: number, lesson_id: number): Promise<Reyting | null> {
    return this.reytingRepository.findOne({
      where: { user_id, lesson_id, finished_type: FinishedType.task },
    });
  }

  async markTaskPending(
    user_id: number,
    lesson_id: number,
    course_id: number,
  ): Promise<void> {
    const existing = await this.reytingRepository.findOne({
      where: { user_id, lesson_id, finished_type: FinishedType.task },
    });

    if (existing) {
      await this.reytingRepository.update(
        {
          course_id,
          is_finished: false,
          ball: null,
        },
        { where: { id: existing.id } },
      );
    } else {
      await this.reytingRepository.create({
        user_id,
        lesson_id,
        course_id,
        finished_type: FinishedType.task,
        is_finished: false,
        ball: null,
      } as any);
    }
  }

  async setTaskResult(
    user_id: number,
    lesson_id: number,
    course_id: number,
    ball: number,
  ): Promise<void> {
    const existing = await this.reytingRepository.findOne({
      where: { user_id, lesson_id, finished_type: FinishedType.task },
    });
    const oldBall = existing?.ball ?? null;

    if (existing) {
      await this.reytingRepository.update(
        {
          ball,
          course_id,
          is_finished: true,
        },
        { where: { id: existing.id } },
      );
    } else {
      await this.reytingRepository.create({
        user_id,
        lesson_id,
        course_id,
        ball,
        finished_type: FinishedType.task,
        is_finished: true,
      } as any);
    }

    this.notifyRatingChange(
      user_id,
      lesson_id,
      course_id,
      FinishedType.task,
      oldBall,
      ball,
    );
  }

  async markAsRead(user_id: number, lesson_id: number) {
    const testsCount = await this.testsService.getLessonTestsCount(lesson_id);

    if (testsCount > 0) {
      throw new BadRequestException('Bu darsda test bor, faqat test orqali tugatish mumkin.');
    }

    const reyting = await this.reytingRepository.update({
      is_finished: true,
      finished_type: FinishedType.manual,
    }, {
      where: { lesson_id, user_id },
      returning: true,
    });

    return reyting[1][0];
  }

  async getAll(
    subject_id: number,
    group_id: number,
    user_id: number,
  ): Promise<object> {
    try {
      const filter: any = [];
      if (subject_id != 0) {
        filter.push(
          Sequelize.literal(`
            "test_id" IN (
              SELECT "id" FROM "tests"
              WHERE "id" = "Reyting"."test_id"
              AND "lesson_id" IN (
                SELECT "id" FROM "lesson"
                WHERE "id" = "tests"."lesson_id"
                AND "subject_id" = ${subject_id}
              )
            )
          `),
        );
      }
      const reytings = await this.reytingRepository.findAll({
        where: {
          [Op.and]: [
            ...filter,
            {
              id: {
                [Op.in]: Sequelize.literal(`(
                  SELECT "Reyting"."id"
                  FROM "group" 
                  INNER JOIN "course" ON "course"."group_id" = :group_id 
                  INNER JOIN "lesson" ON "lesson"."course_id" = "course"."id"
                  WHERE "lesson"."id" = "Reyting"."lesson_id"
                )`),
              },
            },
          ],
        },
        order: [['ball', 'ASC']],
        replacements: { group_id },
        include: [{ model: User }],
      });
      return reytings;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getLessonsReyting(
    lesson_id: number,
    user_id: number,
  ): Promise<object> {
    try {
      const reytings = await this.reytingRepository.findAll({
        where: { lesson_id },
        order: [['ball' as 'TotalReyting', 'ASC']],
        include: [{ model: User }],
      });
      return reytings;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number, limit: number): Promise<object> {
    try {
      const offset = (page - 1) * limit;
      const reytings = await this.reytingRepository.findAll({ offset, limit });
      const total_count = await this.reytingRepository.count();
      const total_pages = Math.ceil(total_count / limit);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: reytings,
          pagination: {
            currentPage: Number(page),
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

  async delete(id: number): Promise<object> {
    try {
      const reyting = await this.reytingRepository.findByPk(id);
      if (!reyting) {
        throw new NotFoundException('Reyting not found');
      }
      reyting.destroy();
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
