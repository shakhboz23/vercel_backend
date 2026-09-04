import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Lesson } from './models/lesson.models';
import { InjectModel } from '@nestjs/sequelize';
import { LessonDto } from './dto/lesson.dto';
import { Course } from '../course/models/course.models';
import { UploadedService } from '../uploaded/uploaded.service';
import { Sequelize } from 'sequelize-typescript';
import { CourseService } from 'src/course/course.service';
import { WatchedService } from 'src/watched/watched.service';
import { FilesService } from 'src/files/files.service';
import { Reyting } from 'src/reyting/models/reyting.models';
import { CommentService } from 'src/comment/comment.service';
import { Op } from 'sequelize';
import { SubCategory } from 'src/subcategory/models/subcategory.models';
import { Category } from 'src/category/models/category.models';
import { Tests } from 'src/test/models/test.models';
import { Subscriptions } from 'src/subscriptions/models/subscriptions.models';
import { BotService } from 'src/bot/bot.service';

@Injectable()
export class LessonService {
  constructor(
    @InjectModel(Lesson) private lessonRepository: typeof Lesson,
    @InjectModel(Reyting) private reytingRepository: typeof Reyting,
    @InjectModel(Tests) private testsRepository: typeof Tests,
    @InjectModel(Subscriptions)
    private subscriptionsRepository: typeof Subscriptions,
    @InjectModel(Course) private courseRepository: typeof Course,
    private readonly courseService: CourseService,
    private uploadedService: UploadedService,
    private readonly watchedService: WatchedService,
    private readonly filesService: FilesService,
    private readonly commentService: CommentService,
    @Inject(forwardRef(() => BotService))
    private readonly botService: BotService,
  ) {}

  // A nested "vazifa" lesson is created from a /lesson/:lesson_id page (no
  // course_id in the route), so the frontend falls back to sending the
  // *parent lesson's* id as course_id - it's only reliable at the root of
  // the tree, where a module/test was created directly from the course page
  // with the real course_id. Walk lesson_id up to that root to recover it.
  private async resolveCourseId(lesson: Lesson): Promise<number | null> {
    let current: any = lesson;
    const seen = new Set<number>();
    while (current?.lesson_id && !seen.has(current.id)) {
      seen.add(current.id);
      current = await this.lessonRepository.findByPk(current.lesson_id);
    }
    return current?.course_id || null;
  }

  // Called by TestsService once a lesson's question set is created, to send
  // the same "yangi test qo'shildi" push the 'vazifa' path sends from
  // create() below - kept here since this is where resolveCourseId and the
  // subscribed-students fan-out already live.
  async announceNewContent(
    lesson_id: number,
    kind: 'vazifa' | 'test',
  ): Promise<void> {
    const lesson = await this.lessonRepository.findByPk(lesson_id);
    if (!lesson) return;
    const course_id = await this.resolveCourseId(lesson);
    if (!course_id) return;
    await this.notifyAllSubscribed(course_id, kind, lesson.title);
  }

  // Every subscribed student gets a fire-and-forget bot push - a failed
  // Telegram send should never fail the lesson/test creation that's already
  // committed to the DB.
  private async notifyAllSubscribed(
    course_id: number,
    kind: 'vazifa' | 'test',
    lessonTitle: string,
  ): Promise<void> {
    try {
      const course = await this.courseRepository.findByPk(course_id);
      if (!course) return;
      const subscriptions = await this.subscriptionsRepository.findAll({
        where: { course_id },
        attributes: ['user_id'],
      });
      for (const sub of subscriptions) {
        this.botService
          .notifyContentAdded(sub.user_id, course.title, lessonTitle, kind)
          .catch((error) => console.log(error));
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Runs twice a day (~12:30 and ~20:00, see schedules/schedule.service.ts):
  // for every published task/test lesson, reminds every subscribed student
  // who still has no Reyting row for it - i.e. never submitted anything -
  // and their linked parent(s). Once a student submits (a Reyting row
  // appears, whatever its is_finished/ball state), the reminder stops.
  async sendUnsubmittedReminders(): Promise<void> {
    const lessons = await this.lessonRepository.findAll({
      where: { type: 'lesson', published: true },
    });

    for (const lesson of lessons) {
      try {
        const course_id = await this.resolveCourseId(lesson);
        if (!course_id) continue;

        const subscriptions = await this.subscriptionsRepository.findAll({
          where: { course_id },
          attributes: ['user_id'],
        });
        const studentIds = subscriptions.map((s) => s.user_id);
        if (!studentIds.length) continue;

        const submitted = await this.reytingRepository.findAll({
          where: { lesson_id: lesson.id, user_id: { [Op.in]: studentIds } },
          attributes: ['user_id'],
        });
        const submittedIds = new Set(submitted.map((r) => r.user_id));
        const unsubmittedIds = studentIds.filter((id) => !submittedIds.has(id));
        if (!unsubmittedIds.length) continue;

        const testsCount = await this.testsRepository.count({
          where: { lesson_id: lesson.id },
        });
        const kind: 'vazifa' | 'test' = testsCount > 0 ? 'test' : 'vazifa';

        const course = await this.courseRepository.findByPk(course_id);
        if (!course) continue;

        for (const user_id of unsubmittedIds) {
          this.botService
            .notifyUnsubmitted(user_id, course.title, lesson.title, kind)
            .catch((error) => console.log(error));
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  async create(lessonDto: LessonDto, video: any): Promise<object> {
    try {
      const { title, content, youtube } = lessonDto;
      let duration: number;
      if (lessonDto.type == 'lesson') {
        let file_type: string;
        let file_data: any;
        if (youtube && youtube != undefined) {
          duration = await this.uploadedService.getVideoDuration(youtube);
          video = youtube;
        } else if (video) {
          file_type = 'video';
          file_data = await this.uploadedService.create(video, file_type);
          video = file_data;
        }
        lessonDto.lesson_id = +lessonDto.lesson_id || null;
        let video_lesson: any = await this.lessonRepository.create({
          ...lessonDto,
          duration: duration || null,
          video,
        });
        video_lesson = await this.lessonRepository.update(
          {
            position: video_lesson.id,
          },
          {
            where: { id: video_lesson.id },
            returning: true,
          },
        );
        const created = video_lesson[1][0];

        if (created.published) {
          this.resolveCourseId(created).then((course_id) => {
            if (course_id) {
              this.notifyAllSubscribed(course_id, 'vazifa', created.title);
            }
          });
        }

        return created;
      } else {
        const lesson: any = await this.lessonRepository.create({
          title: lessonDto.title,
          published: lessonDto.published,
          course_id: lessonDto.course_id,
          lesson_id: lessonDto.lesson_id,
          type: lessonDto.type,
        });
        return lesson;
      }
    } catch (error) {
      console.error(error);
      throw new BadRequestException(error.message);
    }
  }

  async getAll(subcategory_id: string, category_id: number): Promise<object> {
    try {
      subcategory_id = JSON.parse(subcategory_id || '[]');
      let category: any = {};
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
        category = {
          where: {
            subcategory_id: {
              [Op.in]: subcategory_id,
            },
          },
        };
      }

      const lessons: any = await this.lessonRepository.findAll({
        where: { type: 'lesson' },
        include: [
          { model: Lesson },
          {
            model: Course,
            attributes: [],
            ...category,
            ...categoryInclude,
            required: true,
          },
        ],
        attributes: {
          include: [
            [
              Sequelize.literal(`
                COALESCE((
                  SELECT COUNT(*) FROM "likes"
                  WHERE "likes"."lesson_id" = "Lesson"."id"
                )::int, 0)
              `),
              'likes_count',
            ],
          ],
        },
        order: [['id', 'ASC']],
      });
      return lessons;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getReyting(lesson_id: number): Promise<object> {
    try {
      const reyting: any = await this.lessonRepository.findAll({
        include: [{ model: Reyting }],
      });
      return reyting;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getByCourse(
    course_id: number,
    user_id: number,
    date?: string,
    search?: string,
    status?: string,
  ): Promise<Object> {
    try {
      user_id = user_id || null;
      const lessons: any = await this.lessonRepository.findAll({
        where: {
          course_id,
          lesson_id: null,
        },
        include: [
          {
            model: Course,
            attributes: ['group_id'],
          },
          {
            model: Lesson,
            include: [
              {
                model: Lesson,
                include: [
                  {
                    model: Lesson,
                    attributes: {
                      include: [
                        [
                          Sequelize.literal(
                            `(CASE WHEN EXISTS (SELECT 1 FROM "reyting" WHERE "reyting"."lesson_id" = "Lesson"."id" AND "reyting"."user_id" = :user_id AND "reyting"."is_finished" = true) THEN true ELSE false END)`,
                          ),
                          'is_finished',
                        ],
                      ],
                    },
                  },
                ],
                attributes: {
                  include: [
                    [
                      Sequelize.literal(
                        `(CASE WHEN EXISTS (SELECT 1 FROM "reyting" WHERE "reyting"."lesson_id" = "Lesson"."id" AND "reyting"."user_id" = :user_id AND "reyting"."is_finished" = true) THEN true ELSE false END)`,
                      ),
                      'is_finished',
                    ],
                  ],
                },
              },
            ],
            attributes: {
              include: [
                [
                  Sequelize.literal(
                    `(CASE WHEN EXISTS (SELECT 1 FROM "reyting" WHERE "reyting"."lesson_id" = "Lesson"."id" AND "reyting"."user_id" = :user_id AND "reyting"."is_finished" = true) THEN true ELSE false END)`,
                  ),
                  'is_finished',
                ],
              ],
            },
          },
        ],
        order: [['position', 'ASC']],
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(CASE WHEN EXISTS (SELECT 1 FROM "reyting" WHERE "reyting"."lesson_id" = "Lesson"."id" AND "reyting"."user_id" = :user_id AND "reyting"."is_finished" = true) THEN true ELSE false END)`,
              ),
              'is_finished',
            ],
          ],
        },
        replacements: { user_id },
      });
      const course = await this.courseService.getById(
        course_id,
        user_id,
        date,
        search,
        status,
      );
      await this.watchedService.create({ course_id }, user_id);

      return { lessons, course: course };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number, user_id?: number): Promise<object> {
    try {
      user_id = user_id || null;
      let lesson: any = await this.lessonRepository.findOne({
        where: { id },
        include: [
          {
            model: Reyting,
          },
          {
            model: Course,
            attributes: {
              include: [
                [
                  Sequelize.literal(
                    `(SELECT "user"."id" FROM "user" JOIN "group" ON "group"."id" = "course"."group_id" WHERE "course"."id" = "Lesson"."course_id" AND "course"."user_id" = "user"."id" LIMIT 1)::int`,
                  ),
                  'user_id',
                ],
                [
                  Sequelize.literal(
                    `COALESCE((SELECT COUNT(*) FROM "lesson" WHERE "lesson"."course_id" = "Lesson"."course_id" 
                     AND "lesson"."type" = 'lesson')::int, 0)`,
                  ),
                  'lesson_count',
                ],
                [
                  Sequelize.literal(
                    `COALESCE((SELECT COUNT(*) FROM "tests" WHERE "tests"."lesson_id" = "Lesson"."id")::int, 0)`,
                  ),
                  'test_count',
                ],
                [
                  Sequelize.literal(`
                    COALESCE((
                      SELECT COUNT(*) FROM "likes"
                      WHERE "likes"."lesson_id" = "Lesson"."id"
                    )::int, 0)
                  `),
                  'likes_count',
                ],
                [
                  Sequelize.literal(`
                    COALESCE((
                      SELECT COUNT(*) FROM "subscriptions"
                      WHERE "subscriptions"."course_id" = "Lesson"."course_id"
                    )::int, 0)
                  `),
                  'subscriptions_count',
                ],
              ],
            },
          },
        ],
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(CASE 
                  WHEN EXISTS (
                    SELECT 1 FROM "likes" 
                    WHERE "likes"."lesson_id" = "Lesson"."id" 
                    AND "likes"."user_id" = :user_id
                  ) THEN true 
                  ELSE false 
                END)`,
              ),
              'is_liked',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT COUNT(*) FROM "tests" WHERE "tests"."lesson_id" = "Lesson"."id" )::int, 0)`,
              ),
              'tests_count',
            ],
            [
              Sequelize.literal(
                `(CASE WHEN EXISTS (SELECT 1 FROM "reyting" WHERE "reyting"."lesson_id" = "Lesson"."id" AND "reyting"."user_id" = :user_id AND "reyting"."is_finished" IS TRUE) THEN true ELSE false END)`,
              ),
              'is_finished',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT COUNT(*) FROM "lesson" WHERE "lesson"."course_id" = "Lesson"."course_id" 
                     AND LENGTH("lesson"."content") > 0)::int, 0)`,
              ),
              'lecture_count',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT COALESCE(SUM("lesson"."duration"), 0) FROM "lesson" WHERE "lesson"."course_id" = "Lesson"."course_id")::int, 0)`,
              ),
              'total_duration',
            ],
            [
              Sequelize.literal(
                `(CASE WHEN EXISTS (SELECT 1 FROM "subscriptions" WHERE "subscriptions"."course_id" = "Lesson"."course_id" AND "subscriptions"."user_id" = :user_id) THEN true ELSE false END)`,
              ),
              'is_subscribed',
            ],
          ],
        },
        replacements: { user_id },
      });
      lesson = lesson.get({ plain: true });
      const comments = await this.commentService.pagination(1, id);
      lesson.comments = comments;
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }
      await this.watchedService.create({ lesson_id: id }, user_id);

      return lesson;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const lessons = await this.lessonRepository.findAll({ offset, limit });
      const total_count = await this.lessonRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: lessons,
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

  async update(id: number, lessonDto: LessonDto, video: any): Promise<object> {
    try {
      const { title, content, youtube } = lessonDto;
      let duration: number;
      const lesson = await this.lessonRepository.findByPk(id);
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }
      let update: any;
      if (lesson.type == 'lesson') {
        let file_type: string;
        let file_data: any;
        if (youtube) {
          duration = await this.uploadedService.getVideoDuration(youtube);
          video = youtube;
          return;
        } else if (video) {
          file_type = 'video';
          await this.filesService.deleteFile(lesson.video);
          file_data = await this.uploadedService.create(video, file_type);
          video = file_data;
        }
        lessonDto.lesson_id = +lessonDto.lesson_id || null;
        lessonDto.course_id = lesson.course_id;

        update = await this.lessonRepository.update(
          {
            ...lessonDto,
            duration: duration || null,
            video,
            course_id: lesson.course_id,
          },
          {
            where: { id },
            returning: true,
          },
        );
      } else {
        const exist = await this.lessonRepository.findOne({
          where: { title },
        });
        if (exist) {
          throw new BadRequestException('Already created');
        }
        update = await this.lessonRepository.update(
          {
            title: lessonDto.title,
            published: lessonDto.published,
            type: lessonDto.type,
          },
          {
            where: { id },
            returning: true,
          },
        );
      }
      return update[1][0];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const lesson = await this.lessonRepository.findByPk(id);
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }
      if (lesson.video) {
        await this.filesService.deleteFile(lesson.video);
      }
      await lesson.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
