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

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group) private groupRepository: typeof Group,
    private readonly uploadedService: UploadedService,
    private readonly watchedService: WatchedService,
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

  async getAll(category_id: number, user_id?: number, type?: string): Promise<object> {
    try {
      // category_id = category_id == 0 ? undefined : +category_id
      let category: any = {}
      if (category_id != 0) {
        category = { where: { category_id } }
      }
      const filters: any = {
        order: [['title', 'ASC']],
        include: [{ model: User }, {
          model: Course, attributes: [], ...category,
        }],
        attributes: {
          include: [
            // category_id != 0 ? [
            //   Sequelize.literal(
            //     `COALESCE((SELECT COUNT(*) FROM "course" WHERE "course"."category_id" = :category_id)::int, 0)`,
            //   ),
            //   'courses_by_category',
            // ] : undefined,
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM "course" WHERE "course"."group_id" = "Group"."id")::int`,
              ),
              'courses_count',
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM "subscriptions" WHERE "course"."group_id" = "Group"."id" AND "course"."id" = "subscriptions"."course_id")::int`,
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
          ],
        },
        replacements: { category_id },
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
      let category: any = {}
      if (category_id != 0) {
        category = { where: { category_id } }
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
                `(SELECT COUNT(*) FROM "watched" WHERE "watched"."group_id" = "Group"."id")::int`,
              ),
              'watched_count',
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM "likes"
                  JOIN "lesson" AS "l" ON "likes"."lesson_id" = "l"."id"
                  JOIN "course" AS "c" ON "l"."course_id" = "c"."id"
                  JOIN "group" AS "g" ON "c"."group_id" = "g"."id"
                  WHERE g."user_id" = :user_id)::int`
              ),
              'likes_count',
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM "subscriptions" WHERE "course"."group_id" = "Group"."id" AND "course"."id" = "subscriptions"."course_id")::int`,
              ),
              'users_count',
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
                `(SELECT COUNT(*) FROM "watched" WHERE "watched"."group_id" = "Group"."id" AND "Group"."user_id" = :user_id)::int`
              ),
              'watched_count',
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM "likes"
                  JOIN "lesson" AS "l" ON "likes"."lesson_id" = "l"."id"
                  JOIN "course" AS "c" ON "l"."course_id" = "c"."id"
                  JOIN "group" AS "g" ON "c"."group_id" = "g"."id"
                  WHERE g."user_id" = :user_id)::int`
              ),
              'likes_count',
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM "subscriptions" WHERE "course"."group_id" = "Group"."id" AND "course"."id" = "subscriptions"."course_id")::int`,
              ),
              'users_count',
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
      return {
        statusCode: HttpStatus.OK,
        data: groups,
      };
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
      const groupes = await this.groupRepository.findByPk(id);
      if (!groupes) {
        throw new NotFoundException('Group not found');
      }
      if (groupes.user_id != user_id) {
        throw new ForbiddenException("You don't have an access");
      }
      const file_type: string = 'image';
      let file_data: any;
      let image_url: string;
      if (cover) {
        file_data = await this.uploadedService.create(cover, file_type);
        cover = file_data.data.url;
      }
      const update = await this.groupRepository.update(
        { ...groupDto, cover: cover || groupes.cover },
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
      const groupes = await this.groupRepository.findByPk(id);
      if (!groupes) {
        throw new NotFoundException('Group not found');
      }
      groupes.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
