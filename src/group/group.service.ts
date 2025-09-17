import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Group } from './models/group.models';
import { InjectModel } from '@nestjs/sequelize';
import { GroupDto } from './dto/group.dto';
import { UploadedService } from '../uploaded/uploaded.service';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../user/models/user.models';
import { Course } from 'src/course/models/course.models';
import { WatchedService } from 'src/watched/watched.service';
import { Lesson } from 'src/lesson/models/lesson.models';
import { FilesService } from 'src/files/files.service';
import { GroupSearchDto } from './dto/search.dto';
import { Op } from 'sequelize';
import { SubCategory } from 'src/subcategory/models/subcategory.models';
import { Category } from 'src/category/models/category.models';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group) private groupRepository: typeof Group,
    private readonly uploadedService: UploadedService,
    private readonly watchedService: WatchedService,
    private readonly filesService: FilesService,
  ) { }

  async create(
    groupDto: GroupDto,
    user_id: number,
    cover: any,
  ): Promise<object> {
    console.log(cover);
    try {
      console.log('Hi');
      const { title } = groupDto;
      const exist = await this.groupRepository.findOne({
        where: { title },
      });
      if (exist) {
        throw new BadRequestException('Already created');
      }
      const file_type: string = 'image';
      let image_url: any;
      if (cover) {
        image_url = await this.uploadedService.create(cover, file_type);
      }
      console.log(image_url)
      const group = await this.groupRepository.create({
        ...groupDto,
        user_id,
        cover: image_url,
      });

      return group;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll({ groupSearchDto, user_id, type }: { groupSearchDto?: GroupSearchDto, user_id?: number, type?: string }): Promise<object> {
    try {
      let { title, subcategory_id, category_id, createdAt, price } = groupSearchDto || {};
      let subcategories: any = JSON.parse(subcategory_id || "[]");
      let createdAtDates: any = JSON.parse(createdAt || "[]");
      price = JSON.parse(price || "[]");

      let whereClause: any = {};

      // 1. Title yoki description bilan filter
      if (title) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${title}%` } },
          { description: { [Op.iLike]: `%${title}%` } }
        ];
      }

      // 2. subcategory_id (IN)
      let subcategoryInclude: any = {};
      let categoryInclude: any = {};

      if (+category_id) {
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
      } else if (Array.isArray(subcategories) && subcategories.length > 0) {
        subcategoryInclude = {
          where: {
            subcategory_id: {
              [Op.in]: subcategories
            }
          }
        };
      }

      // 3. createdAt: Date[] = [start, end]
      if (Array.isArray(createdAtDates) && createdAtDates.length === 2) {
        whereClause.createdAt = {
          [Op.between]: [new Date(createdAtDates[0]), new Date(createdAtDates[1])]
        };
      }

      // 4. price: number[] = [min, max]
      console.log(price)
      if (Array.isArray(price) && price.length === 2) {
        subcategoryInclude.where = subcategoryInclude.where ? subcategoryInclude.where : {};
        subcategoryInclude.where.price = {
          [Op.between]: [price[0], price[1]]
        };
      }

      console.log(subcategoryInclude, 22223);


      const filters: any = {
        where: whereClause,
        order: [['title', 'ASC']],
        include: [{ model: User }, {
          model: Course, attributes: [],
          ...subcategoryInclude,
          ...categoryInclude,
          required: true,
        }],
        attributes: {
          include: [
            [
              Sequelize.literal(
                `COALESCE((SELECT COUNT(*) FROM "course" WHERE "course"."group_id" = "Group"."id")::int, 0)`,
              ),
              'courses_count',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT COUNT(*) FROM "subscriptions" WHERE "course"."group_id" = "Group"."id" AND "course"."id" = "subscriptions"."course_id")::int, 0)`,
              ),
              'users_count',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT MIN("course"."price") FROM "course" WHERE "course"."group_id" = "Group"."id")::int, 0)`,
              ),
              'low_price',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT MAX("course"."price") FROM "course" WHERE "course"."group_id" = "Group"."id")::int, 0)`,
              ),
              'high_price',
            ],
            [
              Sequelize.literal(`
                COALESCE((
                  SELECT COUNT(*) FROM "likes"
                  WHERE "likes"."lesson_id" IN (
                    SELECT "id" FROM "lesson"
                    WHERE "lesson"."course_id" IN (
                      SELECT "id" FROM "course"
                      WHERE "course"."group_id" = "Group"."id"
                    )
                  )
                )::int, 0)
              `),
              'likes_count',
            ],
          ],
        },
      };

      const groups = await this.groupRepository.findAll({
        ...filters,
      });
      let my_groups = [];
      if (user_id) {
        my_groups = await this.groupRepository.findAll({
          where: { user_id },
          ...filters,
        });
      }

      return {
        groups,
        my_groups,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllAnalytics(category_id: number, user_id?: number): Promise<object> {
    try {
      let category: any = {
        where: { user_id }
      }
      if (category_id != 0) {
        category = { where: { category_id, user_id } }
      }
      const filters: any = {
        order: [['title', 'ASC']],
        ...category,
        include: [{ model: User }, {
          model: Course, attributes: [],
        }],
        attributes: {
          include: [
            [
              Sequelize.literal(
                `COALESCE((SELECT COUNT(*) FROM "watched" WHERE "watched"."group_id" = "Group"."id")::int, 0)`,
              ),
              'watched_count',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT COUNT(*) FROM "likes"
                  JOIN "lesson" AS "l" ON "likes"."lesson_id" = "l"."id"
                  JOIN "course" AS "c" ON "l"."course_id" = "c"."id"
                  JOIN "group" AS "g" ON "c"."group_id" = "g"."id"
                  WHERE g."user_id" = :user_id)::int, 0)`
              ),
              'likes_count',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT COUNT(*) FROM "subscriptions" WHERE "course"."group_id" = "Group"."id" AND "course"."id" = "subscriptions"."course_id")::int, 0)`,
              ),
              'users_count',
            ],
            [
              Sequelize.literal(
                `EXTRACT(EPOCH FROM "Group"."createdAt")::int`
              ),
              'createdAt',
            ],
          ],
        },
        replacements: { category_id, user_id },
      };

      const filters2: any = {
        ...category,
        include: [{ model: User }, {
          model: Course, attributes: [],
        }],
        attributes: {
          include: [
            [
              Sequelize.literal(
                `COALESCE((SELECT COUNT(*) FROM "watched" WHERE "watched"."group_id" = "Group"."id" AND "Group"."user_id" = :user_id)::int, 0)`
              ),
              'watched_count',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT COUNT(*) FROM "likes"
                  JOIN "lesson" AS "l" ON "likes"."lesson_id" = "l"."id"
                  JOIN "course" AS "c" ON "l"."course_id" = "c"."id"
                  JOIN "group" AS "g" ON "c"."group_id" = "g"."id"
                  WHERE g."user_id" = :user_id)::int, 0)`
              ),
              'likes_count',
            ],
            [
              Sequelize.literal(
                `COALESCE((SELECT COUNT(*) FROM "subscriptions" WHERE "course"."group_id" = "Group"."id" AND "course"."id" = "subscriptions"."course_id")::int, 0)`,
              ),
              'users_count',
            ],
            [
              Sequelize.literal(
                `EXTRACT(EPOCH FROM "Group"."createdAt")::int`
              ),
              'createdAt',
            ],
          ],
        },
        replacements: { user_id },
      };

      const groups = await this.groupRepository.findAll({
        ...filters,
      });

      const summary = await this.groupRepository.findAll({
        ...filters2,
      });
      let my_groups = [];
      if (user_id) {
        my_groups = await this.groupRepository.findAll({
          where: { user_id },
          ...filters,
        });
      }

      return {
        groups,
        my_groups,
        summary,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number, user_id: number): Promise<object> {
    try {
      const groups = await this.groupRepository.findOne({
        where: { id },
      });
      console.log(groups);
      if (!groups) {
        throw new NotFoundException('Group not found');
      }
      await this.watchedService.create({ group_id: id }, user_id);
      return groups;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const groups = await this.groupRepository.findAll({ offset, limit });
      const total_count = await this.groupRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: groups,
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
    groupDto: GroupDto,
    cover: any,
    user_id: number,
  ): Promise<object> {
    try {
      const group = await this.groupRepository.findByPk(id);
      if (!group) {
        throw new NotFoundException('Group not found');
      }
      if (group.user_id != user_id) {
        throw new ForbiddenException("You don't have an access");
      }
      const file_type: string = 'image';
      let file_data: any;
      let image_url: string;
      console.log(cover, '2303');
      if (cover) {
        if (group.cover) {
          await this.filesService.deleteFile(group.cover);
        }
        cover = await this.uploadedService.create(cover, file_type);
      }
      const update = await this.groupRepository.update(
        { ...groupDto, cover: cover || group.cover },
        {
          where: { id },
          returning: true,
        },
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          group: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const group = await this.groupRepository.findByPk(id);
      if (!group) {
        throw new NotFoundException('Group not found');
      }
      await this.filesService.deleteFile(group.cover);
      group.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
