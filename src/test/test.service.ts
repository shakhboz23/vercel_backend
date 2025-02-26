import { LessonService } from './../lesson/lesson.service';
import { Test_settingsService } from './../test_settings/test_settings.service';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActionType, Tests } from './models/test.models';
import { InjectModel } from '@nestjs/sequelize';
import { QuestionDto, TestsDto } from './dto/test.dto';
import { Sequelize } from 'sequelize-typescript';
import { CheckDto } from './dto/check.dto';
import { ReytingService } from '../reyting/reyting.service';
import { ReytingDto } from '../reyting/dto/reyting.dto';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Course } from 'src/course/models/course.models';
import { Category } from 'src/category/models/category.models';
import { FilesService } from 'src/files/files.service';
import { Test_settings } from 'src/test_settings/models/test_settings.models';

@Injectable()
export class TestsService {
  constructor(
    @InjectModel(Tests) private testsRepository: typeof Tests,
    private readonly reytingService: ReytingService,
    private readonly lessonService: LessonService,
    private readonly test_settingsService: Test_settingsService,
    private readonly fileService: FilesService,
  ) { }

  async create(testsDto: TestsDto, user_id: number): Promise<object> {
    try {
      const {
        test,
        lesson_id,
        start_date,
        end_date,
        sort_level,
        period,
        mix,
      } = testsDto;
      const lesson: any = await this.lessonService.getById(lesson_id);
      if (lesson.course?.user_id != user_id) {
        throw new BadRequestException("You have not access");
      }
      let variants: string[];
      if (start_date || end_date || sort_level || period) {
        await this.test_settingsService.create({
          lesson_id,
          start_date,
          end_date,
          sort_level,
          period,
          mix,
        });
      }
      for (let i = 0; i < test.length; i++) {
        variants = Object.values(test[i].variants);
        console.log(test[i].is_action, '2303');
        if (test[i].is_action == ActionType.edited && test[i].id) {
          await this.update(test[i].id, test[i])
        } else if(test[i].is_action != ActionType.old) {
          await this.testsRepository.create({
            lesson_id,
            question: test[i].question,
            variants,
            type: test[i].type,
            true_answer: test[i].true_answer,
          });
        }
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Created successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async create_url(file: any) {
    try {
      console.log('object');
      if (file) {
        file = await this.fileService.createFile(file, 'image');
        console.log(file);
        if (file != 'error') {
          return { statusCode: HttpStatus.OK, data: file };
        } else {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Error while uploading a file',
          };
        }
      }
    } catch (error) {
      return { statusCode: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async getAll(class_name: number): Promise<object> {
    try {
      const tests = await this.testsRepository.findAll({
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM "lesson" WHERE "lesson"."id" = "Tests"."lesson_id" and "lesson"."class" = ${class_name})`,
              ),
              'lessonsCount',
            ],
            [
              Sequelize.literal(`(
                SELECT SUM("uploaded"."duration")
                FROM "lesson"
                INNER JOIN "video_lesson" ON "lesson"."id" = "video_lesson"."lesson_id"
                INNER JOIN "uploaded" ON "video_lesson"."video_id" = "uploaded"."id"  
                WHERE "lesson"."id" = "Tests"."lesson_id"
                AND "lesson"."class" = '${class_name}'
              )`),
              'totalDuration',
            ],
          ],
        },
      });
      return {
        statusCode: HttpStatus.OK,
        data: tests,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getTests(): Promise<object> {
    try {
      const testss = await this.testsRepository.findAll();
      return {
        statusCode: HttpStatus.OK,
        data: testss,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(lesson_id: number, user_id: number): Promise<object> {
    console.log(user_id);
    const lesson: any = this.lessonService.getById(lesson_id);

    try {
      // const test_settings: any =
      //   await this.test_settingsService.getByLessonId(id);
      // console.log(test_settings);
      // console.log(
      //   new Date(test_settings?.data?.end_date).getTime(),
      //   'test2303',
      // );
      if (
        false
        // new Date(test_settings?.data?.start_date).getTime() >
        // new Date().getTime()
      ) {
        throw new BadRequestException('start date is invalid');
      } else if (
        // new Date(test_settings?.data?.end_date).getTime() < new Date().getTime()
        false
      ) {
        throw new BadRequestException('end date is invalid');
      }

      const tests = await this.testsRepository.findAll({
        where: {
          lesson_id,
        },
        include: [{ model: Lesson, include: [{ model: Course, include: [{ model: Category }] }] }]
      });

      if (!tests) {
        throw new NotFoundException('Tests not found');
      }

      const lesson: any = await this.lessonService.getById(lesson_id);
      const category: any = await this.testsRepository.findOne({
        where: {
          lesson_id,
        },
        include: [{ model: Lesson, attributes: ['course_id', 'id'], include: [{ model: Course, attributes: ['category_id'], include: [{ model: Category, attributes: ['id'] }] }] }]
      });
      const test_settings: any = await this.test_settingsService.getByLessonId(lesson_id);
      let randomizedVariants: any;
      console.log(lesson.course?.user_id, user_id)
      if (lesson.course.user_id != user_id) {
        randomizedVariants = this.shuffle(tests).map((variant) => {
          const randomizedOptions = this.shuffle(variant.get('variants'));
          return {
            ...variant.toJSON(),
            variants: randomizedOptions,
          };
        });
      }
      return {
        user_id: lesson?.course.get('user_id'),
        category_id: category?.lesson?.course?.category?.id,
        lesson_id: category?.lesson?.id,
        test: randomizedVariants || tests,
        test_settings,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async checkById(id: number, answer: string): Promise<object> {
    try {
      const test = await this.testsRepository.findByPk(id);
      if (!test) {
        throw new NotFoundException('Tests not found');
      }
      console.log(answer);
      console.log(test.variants[test.true_answer[0]]);
      if (test.variants[test.true_answer[0]] == answer) {
        return [id, true];
      }
      return [id, false];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async checkAnswers(
    user_id: number,
    lesson_id: number,
    checkDto: CheckDto,
  ): Promise<object> {
    const { answers } = checkDto;
    let message: string;
    try {
      const results = {};
      let student: any;
      let res: object, id: number, answer: string;
      for (let i of answers) {
        id = +i[0];
        answer = i[1];
        res = await this.checkById(id, answer);
        results[res[0]] = res[1];
      }
      let ball = 0;
      for (let i in results) {
        if (results[i]) {
          ball += 1;
        }
      }
      const percentage = (ball / Object.keys(results)?.length) * 100;
      console.log(percentage);
      // if (percentage >= 70) {
      const data: ReytingDto = {
        // role_id,
        ball,
        lesson_id,
      };
      const reyting_data: any = await this.reytingService.create(
        data,
        user_id,
      );
      // await this.userStepService.create({ lesson_id, role_id });
      message = 'Your reyting has been created!'
      if (reyting_data.message == 'Already added!') {
        message = 'Already added!';
      }
      // }

      return {
        results,
        ball: [percentage, ball],
        student,
        message,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async getByTitle(title: string): Promise<object> {
  //   try {
  //     const tests = await this.testsRepository.findOne({
  //       where: { title },
  //     });
  //     if (!tests) {
  //       throw new NotFoundException('Tests not found');
  //     }
  //     return {
  //       statusCode: HttpStatus.OK,
  //       data: tests,
  //     };
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const testss = await this.testsRepository.findAll({ offset, limit });
      const total_count = await this.testsRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: testss,
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

  async update(id: number, questionDto: QuestionDto): Promise<object> {
    try {
      const tests = await this.testsRepository.findByPk(id);
      if (!tests) {
        throw new NotFoundException('Tests not found');
      }
      const update = await this.testsRepository.update(questionDto, {
        where: { id },
        returning: true,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          tests: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const tests = await this.testsRepository.findByPk(id);
      if (!tests) {
        throw new NotFoundException('Tests not found');
      }
      tests.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Function to shuffle an array
  private shuffle(array: any[]): any[] {
    const shuffledArray = [...array];
    const data = [];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  }
}
