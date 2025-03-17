import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Lesson, lessonType } from './models/lesson.models';
import { InjectModel } from '@nestjs/sequelize';
import { LessonDto } from './dto/lesson.dto';
import { Tests } from '../test/models/test.models';
import { Uploaded } from '../uploaded/models/uploaded.models';
import { UserService } from '../user/user.service';
import { Course } from '../course/models/course.models';
import { UploadedService } from '../uploaded/uploaded.service';
import { Sequelize } from 'sequelize-typescript';
import { Subscriptions } from 'src/subscriptions/models/subscriptions.models';
import { User } from 'src/user/models/user.models';
import { Role } from 'src/role/models/role.models';
import { Op } from 'sequelize';
import { Reyting } from 'src/reyting/models/reyting.models';
import { CourseService } from 'src/course/course.service';
import { Group } from 'src/group/models/group.models';
import { WatchedService } from 'src/watched/watched.service';
import { Like } from 'src/likes/models/like.models';

@Injectable()
export class LessonService {
  constructor(
    @InjectModel(Lesson) private lessonRepository: typeof Lesson,
    private readonly courseService: CourseService,
    // private readonly userService: UserService,
    private uploadedService: UploadedService,
    private readonly watchedService: WatchedService,
  ) { }

  async create(lessonDto: LessonDto, video: any): Promise<object> {
    try {
      console.log(lessonDto);
      console.log(video);
      const { title, content, youtube } = lessonDto;
      let duration: number;
      if (lessonDto.type == 'lesson') {
        let file_type: string;
        let file_data: any;
        if (!content) {
          throw new BadRequestException(
            'Please enter a content',
          );
        }
        console.log(youtube, '23033');
        if (youtube && youtube != undefined) {
          duration = await this.uploadedService.getVideoDuration(youtube);
          video = youtube;
        } else if (video) {
          file_type = 'video';
          file_data = await this.uploadedService.create(video, file_type);
          video = file_data;
        }
        console.log(video,)
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
        return video_lesson[1][0];
      } else {
        const exist = await this.lessonRepository.findOne({
          where: { title },
        });
        if (exist) {
          throw new BadRequestException('Already created');
        }
        const lesson: any = await this.lessonRepository.create({
          title: lessonDto.title,
          published: lessonDto.published,
          course_id: lessonDto.course_id,
          type: lessonDto.type,
        });
        return lesson;
      }
    } catch (error) {
      console.error(error);
      throw new BadRequestException(error.message);
    }
  }

  async getAll(category_id: number): Promise<object> {
    try {
      // const user_data: any = await this.userService.getById(user_id);
      // if (!user_data) {
      //   new BadRequestException('User not found!');
      // }
      let category: any = {}
      if (+category_id) {
        category = { where: { category_id } }
      }
      const lessons: any = await this.lessonRepository.findAll({
        where: { type: 'lesson' },
        include: [{ model: Lesson }, {
          model: Course, attributes: [], ...category,
        }],
        order: [['id', 'ASC']],
      });
      // if (!lessons.length) {
      //   throw new NotFoundException('Lessons not found');
      // }
      return lessons;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getByCourse(course_id: number, user_id: number): Promise<Object> {
    try {

      console.log(user_id);
      user_id = user_id || null;
      console.log(this.lessonRepository.associations);

      // if (user_id == undefined) {

      // }
      const lessons: any = await this.lessonRepository.findAll({
        where: {
          course_id,
          lesson_id: null,
        },
        include: [
          {
            model: Lesson,
            attributes: {
              include: [
                [
                  Sequelize.literal(
                    `(CASE WHEN EXISTS (SELECT 1 FROM "reyting" WHERE "reyting"."lesson_id" = "lessons"."id" AND "reyting"."user_id" = :user_id AND "reyting"."ball" >= (SELECT COUNT(*) FROM "tests" WHERE "lesson_id" = "lessons"."id") * 70 / 100) THEN true ELSE false END)`,
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
                `(CASE WHEN EXISTS (SELECT 1 FROM "reyting" WHERE "reyting"."lesson_id" = "lessons"."id" AND "reyting"."user_id" = :user_id AND "reyting"."ball" >= (SELECT COUNT(*) FROM "tests" WHERE "tests"."lesson_id" = "lessons"."id") * 70 / 100) THEN true ELSE false END)`,
              ),
              'is_finished',
            ],
          ],
        },
        replacements: { user_id },
      });
      if (!lessons.length) {
        // throw new NotFoundException('Lessons not found');
      }
      console.log(user_id);
      const course = await this.courseService.getById(course_id, user_id);
      // const course: any = await this.lessonRepository.findOne({
      //   where: {
      //     course_id,
      //   },
      //   include: [
      //     {
      //       model: Course,
      //       attributes: {
      //         include: [
      //           [
      //             Sequelize.literal(
      //               `(SELECT COUNT(*) FROM "lesson" WHERE "lesson"."course_id" = :course_id AND "lesson"."type" = 'lesson')::int`,
      //             ),
      //             'lessons_count',
      //           ],
      //           [
      //             Sequelize.literal(
      //               `(SELECT COUNT(*) FROM "reyting" WHERE "reyting"."lesson_id" = "Lesson"."id" AND "reyting"."user_id" = :user_id AND "reyting"."ball" > 70)::int`,
      //             ),
      //             'finished_count',
      //           ],
      //         ],
      //       },
      //     },
      //   ],
      //   order: [['id', 'ASC']],
      //   replacements: {
      //     course_id,
      //     user_id,
      //   },
      // });
      await this.watchedService.create({ course_id }, user_id);

      return { lessons, course: course };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number, user_id?: number): Promise<object> {
    try {
      user_id = user_id || null;
      const lesson = await this.lessonRepository.findOne({
        where: { id },
        include: [
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
                    `(SELECT COUNT(*) FROM "lesson" WHERE "lesson"."course_id" = "Lesson"."course_id" 
                     AND "lesson"."type" = 'lesson')::int`,
                  ),
                  'lesson_count',
                ],
                // [
                //   Sequelize.literal(
                //     `(SELECT * FROM "lesson" WHERE "lesson"."course_id" = "Lesson"."course_id" 
                //      AND "lesson"."type" = 'lesson')::int`,
                //   ),
                //   'is_liked',
                // ],
                [
                  Sequelize.literal(
                    `(SELECT COUNT(*) FROM "lesson" WHERE "lesson"."course_id" = "Lesson"."course_id" 
                     AND LENGTH("lesson"."content") > 0)::int`,
                  ),
                  'lecture_count',
                ],
                [
                  Sequelize.literal(
                    `(SELECT COALESCE(SUM("lesson"."duration"), 0) FROM "lesson" WHERE "lesson"."course_id" = "Lesson"."course_id")::int`
                  ),
                  'total_duration',
                ],
                [
                  Sequelize.literal(
                    `(CASE WHEN EXISTS (SELECT 1 FROM "subscriptions" WHERE "subscriptions"."course_id" = "Lesson"."course_id" AND "subscriptions"."user_id" = :user_id) THEN true ELSE false END)`,
                  ),
                  'is_subscribed',
                ],
                [
                  Sequelize.literal(
                    `(SELECT COUNT(*) FROM "tests" WHERE "tests"."lesson_id" = "Lesson"."id")::int`,
                  ),
                  'test_count',
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
          ]
        },
        replacements: { user_id },
      });
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
      console.log(video);
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
        if (!content) {
          throw new BadRequestException(
            'Please enter a content',
          );
        };
        if (youtube) {
          duration = await this.uploadedService.getVideoDuration(youtube);
          video = youtube;
          return;
        } else if (video) {
          file_type = 'video';
          file_data = await this.uploadedService.create(video, file_type);
          console.log(file_data);
          video = file_data;
        }
        lessonDto.lesson_id = +lessonDto.lesson_id || null;
        lessonDto.course_id = lesson.course_id;
        console.log(lessonDto, '=========')

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
            // course_id: lesson.course_id,
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
      lesson.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}