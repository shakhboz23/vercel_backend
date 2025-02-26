import { RoleReytingDto } from './dto/filter_reyting';
import { FilesService } from '../files/files.service';
import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Role } from './models/role.models';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RoleDto } from './dto/role.dto';
import { User } from '../user/models/user.models';
import { UpdateProfileDto } from './dto/update_profile.dto';
import { compare, hash } from 'bcryptjs';
import { CheckDto } from './dto/check.dto';
import { ActivityService } from '../activity/activity.service';
import { Sequelize } from 'sequelize-typescript';
import { UpdateDto } from './dto/update.dto';
import { SearchChildDto } from './dto/searchChild';
import { Reyting } from '../reyting/models/reyting.models';
import { Tests } from '../test/models/test.models';
import { Lesson } from '../lesson/models/lesson.models';
import { UserService } from '../user/user.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role) private roleRepository: typeof Role,
    private readonly fileService: FilesService,
    private readonly activityService: ActivityService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    // private readonly courseMemberService: CourseMemberService,
    // @Inject(forwardRef(() => CourseMemberService)) private readonly courseMemberService: CourseMemberService,
  ) {}

  async create(roleDto: RoleDto): Promise<object> {
    try {
      const role = await this.roleRepository.create(roleDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Successfully registered!',
        data: role,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async checkPassword(checkDto: CheckDto): Promise<object> {
    try {
      let message: string;
      const { user_id, role, password } = checkDto;
      const user = await this.roleRepository.findOne({
        where: { user_id, role },
      });
      if (!user) {
        throw new NotFoundException('User not found!');
      }
      if (user.hashed_password) {
        const is_match_pass = await compare(
          String(password),
          String(user.hashed_password),
        );
        if (!is_match_pass) {
          throw new ForbiddenException('Password did not match!');
        }
        message = 'true';
      } else {
        const hashed_password: string = await hash(password, 7);
        message = 'updated';
      }
      return {
        statusCode: HttpStatus.OK,
        message,
        data: {
          id: user_id,
          role,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async userAvailable(
    id: number,
    is_online: boolean,
    role: string,
  ): Promise<object> {
    try {
      let user: any = await this.roleRepository.findOne({
        where: {
          user_id: id,
          role,
        },
      });
      let last_activity: Date = new Date();
      let activity: string = String(
        new Date().getTime() - new Date(+user.last_activity).getTime(),
      );
      await this.activityService.create({
        activity,
        role: user.role,
        user_id: user.id,
      });
      if (user) {
        user = await this.roleRepository.update(
          {  },
          { where: { user_id: id, role }, returning: true },
        );
        return {
          statusCode: HttpStatus.OK,
          message: is_online ? 'You are online!' : 'You are offline!',
          data: user[1][0],
        };
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'User not found!',
      };
    } catch (error) {
      // throw new BadRequestException(error.message);
      console.log(error.message);
    }
  }

  // async login(loginRoleDto: LoginRoleDto): Promise<object> {
  //   try {
  //     const { phone, password } = loginRoleDto;
  //     const role = await this.roleRepository.findOne({ where: { phone } });
  //     if (!role) {
  //       throw new NotFoundException('Telefon raqam yoki parol xato!');
  //     }
  //     const is_match_pass = await compare(password, role.hashed_password);
  //     if (!is_match_pass) {
  //       throw new ForbiddenException('Login yoki parol xato!');
  //     }
  //     // return this.otpService.sendOTP({ phone });
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async getAll(role: string): Promise<object> {
    try {
      const roles = await this.roleRepository.findAll({
        where: {
          role,
        },
        include: {
          model: User,
        },
      });
      return {
        statusCode: HttpStatus.OK,
        data: roles,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllStudent(class_id: number): Promise<object> {
    try {
      // const class_data: any = await this.classService.getByOnlyId(class_id);
      const roles = await this.roleRepository.findAll({
        where: {
          // [Op.and]: [
          //   Sequelize.literal(
          //     `"class"::text = '${JSON.stringify([[class_data.data.class_number, class_data.data.name]])}'`,
          //   ),
          //   { role: 'student' },
          // ],
        },
        include: [{ model: User, attributes: ['phone'] }],
      });
      return {
        statusCode: HttpStatus.OK,
        data: roles,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getUserRoles(user_id: number, role: string): Promise<object> {
    try {
      const roles = await this.roleRepository.findAll({
        where: { user_id, role },
      });
      return {
        statusCode: HttpStatus.OK,
        data: roles,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getReyting(
    role: string,
    roleReytingDto: RoleReytingDto,
  ): Promise<object> {
    try {
      const { class: class_data, subject_id } = roleReytingDto;

      const filter = [];
      let data: any = {};
      for (let i in roleReytingDto) {
        if (roleReytingDto[i] && i != 'class' && i != 'subject_id') {
          data[i] = roleReytingDto[i];
        }
      }
      filter.push(data);
      if (class_data.length == 2) {
        filter.push(
          Sequelize.literal(
            `"Role"."class"::text LIKE '%${JSON.stringify([class_data])}%'`,
          ),
        );
      }
      const roles: any = await this.roleRepository.findAll({
        where: {
          [Op.and]: [...filter, { role }],
        },
        include: [
          {
            model: Reyting,
            attributes: [],
            include: [
              {
                model: Tests,
                attributes: [],
                include: [
                  { model: Lesson, attributes: [], where: { subject_id } },
                ],
              },
            ],
          },
        ],
        attributes: [
          'id',
          'role',
          'full_name',
          'image',
          'class',
          [
            Sequelize.literal(
              `(
                SELECT COALESCE(SUM("reyting"."ball"), 0) FROM "reyting"
                WHERE "reyting"."role_id" = "Role"."id"
                AND  (:subjectId = 0 OR EXISTS (
                    SELECT 1 FROM "tests"
                    INNER JOIN "lesson" ON "tests"."lesson_id" = "lesson"."id"
                    WHERE "reyting"."test_id" = "tests"."id"
                    AND "lesson"."subject_id" = :subjectId
                ))
              )`,
            ),
            'totalReyting',
          ],
        ],
        replacements: { subjectId: subject_id },
        order: [['totalReyting', 'DESC']],
      });

      return {
        statusCode: HttpStatus.OK,
        data: roles,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getTeacherReyting(
    subject_id: number,
    roleReytingDto: RoleReytingDto,
  ): Promise<object> {
    try {
      const { class: class_data } = roleReytingDto;

      const filter = [];
      for (let i in roleReytingDto) {
        if (roleReytingDto[i] && i != 'class' && i != 'subject_id') {
          filter[i] = roleReytingDto[i];
        }
      }
      if (class_data.length) {
        filter.push(
          Sequelize.literal(
            `"Role"."class"::text = '${JSON.stringify([class_data])}'`,
          ),
        );
      }
      const roles: any = await this.roleRepository.findAll({
        where: { role: 'teacher', ...filter },
      });
      let result: any = [];
      let data: any;
      for (let i = 0; i < roles?.length; i++) {
        let totalReyting: number = 0;
        const conditions = roles[i].class.map((role_class: any) => {
          return Sequelize.literal(
            `"Role"."class"::text = '${JSON.stringify([role_class])}'`,
          );
        });
        data = await this.roleRepository.findAll({
          where: {
            [Op.and]: [{ [Op.or]: conditions }, { role: 'student' }],
          },
          include: [
            {
              model: Reyting,
              attributes: [],
              include: [
                {
                  model: Tests,
                  attributes: [],
                  include: [
                    { model: Lesson, attributes: [], where: { subject_id } },
                  ],
                },
              ],
            },
          ],
          attributes: [
            'id',
            'role',
            'full_name',
            'image',
            [
              Sequelize.literal(
                `(
                  SELECT COALESCE(SUM("reyting"."ball"), 0) FROM "reyting"
                  WHERE "reyting"."role_id" = "Role"."id"
                  AND (:subjectId = 0 OR EXISTS (
                      SELECT 1 FROM "tests"
                      INNER JOIN "lesson" ON "tests"."lesson_id" = "lesson"."id"
                      WHERE "reyting"."test_id" = "tests"."id"
                      AND "lesson"."subject_id" = :subjectId
                  ))
                )`,
              ),
              'totalReyting',
            ],
          ],
          replacements: { subjectId: subject_id },
          order: [['totalReyting', 'DESC']],
        });
        for (let total of data) {
          totalReyting += +total.get('totalReyting');
        }
        result.push({ ...roles[i].toJSON(), totalReyting });
      }
      result.sort((a, b) => b.totalReyting - a.totalReyting);

      return {
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getByUserId(user_id: number, role: string): Promise<object> {
    try {
      const role_data = await this.roleRepository.findOne({
        where: {
          [Op.and]: [{ user_id }, { role }],
        },
        include: [
          {
            model: User,
          },
        ],
        // attributes: {
        //   include: [
        //     [
        //       Sequelize.literal(`COALESCE((
        //       SELECT *
        //       FROM "coursemember"
        //       WHERE "coursemember"."role_id" = "Role"."id"
        //     ))`),
        //       'coursemember',
        //     ],
        //   ],
        // },
      });
      // const membership = await this.courseMemberService.getByRoleId(
      //   role_data.id,
      // );
      if (!role_data) {
        throw new NotFoundException('Role topilmadi!');
      }
      return {
        statusCode: HttpStatus.OK,
        data: role_data,
        // membership,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number): Promise<object> {
    try {
      const role_data = await this.roleRepository.findByPk(id);
      if (!role_data) {
        throw new NotFoundException('Role topilmadi!');
      }
      return role_data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number, limit: number): Promise<object> {
    try {
      const offset = (page - 1) * limit;
      const roles = await this.roleRepository.findAll({ offset, limit });
      const total_count = await this.roleRepository.count();
      const total_pages = Math.ceil(total_count / limit);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: roles,
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

  async updateProfile(
    id: string,
    updateDto: UpdateDto,
  ): Promise<object> {
    try {
      let role: any = await this.roleRepository.findByPk(id, {
        include: { model: User },
      });
      if (!role) {
        throw new NotFoundException('Role not found');
      }
      await this.roleRepository.update(updateDto, {
        where: { id },
        returning: true,
      });
      // await this.userService.update(role.user?.id, updateDto);
      role = await this.roleRepository.findByPk(id, {
        include: { model: User },
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: role,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateDto): Promise<object> {
    try {
      const role = await this.roleRepository.findByPk(id);
      if (!role) {
        throw new NotFoundException('Role not found');
      }
      const update = await this.roleRepository.update(updateDto, {
        where: { id },
        returning: true,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: update[1][0],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async countUsers(users): Promise<object> {
    try {
      const total_users = await this.roleRepository.count();
      const user_data = {};
      for (let i of users) {
        user_data[i] = await this.roleRepository.count({
          where: {
            role: i,
          },
        });
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          total_users,
          user_data,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateStatus(id: number, role: string): Promise<object> {
    try {
      const user: any = await this.roleRepository.findByPk(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const update = await this.roleRepository.update(
        { ...user, user_status: 'solved' },
        {
          where: { id },
          returning: true,
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: update[1][0],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateParentId(searchChildDto: SearchChildDto): Promise<object> {
    try {
      const { class: classes, parent_id, user_id } = searchChildDto;
      console.log(classes, 'classes');
      const user: any = await this.roleRepository.findOne({
        where: {
          [Op.and]: [
            Sequelize.literal(`"class"::text = '${JSON.stringify(classes)}'`),
            { user_id },
            { role: 'student' },
          ],
        },
      });
      if (!user) {
        throw new NotFoundException('User not found2');
      }
      if (user.parent_id) {
        throw new NotFoundException('Already exists');
      }
      const update = await this.roleRepository.update(
        { ...user, parent_id },
        {
          where: {
            [Op.and]: [
              Sequelize.literal(`"class"::text = '${JSON.stringify(classes)}'`),
              { user_id },
              { role: 'student' },
            ],
          },
          returning: true,
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: update[1][0],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateProfileImage(
    user_id: number,
    role: string,
    image: any,
  ): Promise<object> {
    try {
      const user = await this.roleRepository.findOne({
        where: {
          user_id,
          role,
        },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (image) {
        image = await this.fileService.createFile(image, 'image');
        if (image == 'error') {
          return {
            status: HttpStatus.BAD_REQUEST,
            error: 'Error while uploading a file',
          };
        }
      }
      const update = await this.roleRepository.update(
        {  },
        {
          where: { user_id, role },
          returning: true,
        },
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: update[1][0],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const role = await this.roleRepository.findByPk(id);
      if (!role) {
        throw new NotFoundException('Role not found');
      }
      role.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
