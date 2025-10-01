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

@Injectable()
export class ReytingService {
  constructor(
    @InjectModel(Reyting) private reytingRepository: typeof Reyting,
    @Inject(forwardRef(() => TestsService))
    private readonly testsService: TestsService,
  ) { }

  async create(reytingDto: ReytingDto, user_id: number): Promise<object> {
    try {
      const is_reyting = await this.reytingRepository.findOne({
        where: {
          user_id,
          lesson_id: reytingDto.lesson_id,
        },
      });
      if (!is_reyting) {
        const reyting = await this.reytingRepository.create({
          ...reytingDto,
          user_id,
          is_finished: true,
        });
        return {
          statusCode: HttpStatus.OK,
          message: 'Successfully added!',
          data: reyting,
        };
      } else {
        const reyting = await this.reytingRepository.update({
          ...reytingDto,
          user_id,
        }, {
          where: { id: is_reyting.id },
          returning: true,
        });
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
