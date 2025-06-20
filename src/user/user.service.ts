import { ResetpasswordService } from './../resetpassword/resetpassword.service';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { RoleName, User } from './models/user.models';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { RegisterUserDto } from './dto/register.dto';
import { generateToken, writeToCookie } from '../utils/token';
import { LoginUserDto } from './dto/login.dto';
import { Op } from 'sequelize';
import { NotificationService } from '../notification/notification.service';
import { NotificationDto } from '../notification/dto/notification.dto';
import { RoleService } from '../role/role.service';
import { RoleDto } from '../role/dto/role.dto';
import { Role } from '../role/models/role.models';
import { CheckDto } from '../role/dto/check.dto';
import { MailService } from '../mail/mail.service';
import { compareSync, hash } from 'bcryptjs';
import * as uuid from 'uuid';
import { Sequelize } from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';
import { NewPasswordDto } from './dto/new-password.dto';
import { OAuth2Client } from 'google-auth-library';
import { UpdateDto } from './dto/update.dto';
import { Reyting } from 'src/reyting/models/reyting.models';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Course } from 'src/course/models/course.models';
import { FilesService } from 'src/files/files.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { EmailUserDto } from './dto/email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUserEmailDto } from './dto/change-email.dto';
import { OtpService } from 'src/otp/otp.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    private readonly jwtService: JwtService,
    private readonly roleService: RoleService,
    private readonly mailService: MailService,
    private readonly resetpasswordService: ResetpasswordService,
    private readonly filesService: FilesService,
    private readonly otpService: OtpService,

  ) { }
  async register(
    registerUserDto: RegisterUserDto,
    type?: string,
  ): Promise<object> {
    try {
      let is_new_role = false;
      console.log(registerUserDto);
      let { email, role, password } = registerUserDto;
      email = email || null;
      const hashed_password: string = await hash(password, 7);
      let user = await this.userRepository.findOne({
        where: { [Op.or]: { email } },
      });
      let is_role: any;
      if (user) {
        is_role = await this.roleService.getUserRoles(user.id, role);
        if (is_role.data?.length) {
          throw new BadRequestException('Already registered');
        } else {
          is_new_role = true;
        }
      }
      const current_role: string = registerUserDto.role;
      if (is_new_role) {
        const roleData: RoleDto = {
          ...registerUserDto,
          user_id: user.id,
        };
        await this.roleService.create(roleData);
        user = await this.userRepository.findByPk(user.id);
        await this.updateCurrentRole(user.id, current_role);
        const { access_token, refresh_token } = await generateToken(
          { id: user.id },
          this.jwtService,
        );

        // await writeToCookie(refresh_token, res);
        const user_data: any = await this.userRepository.findByPk(user.id, {
          include: { model: Role },
        });
        if (type != 'googleauth') {
          await this.mailService.sendUserConfirmation(user_data, access_token);
        }

        return {
          statusCode: HttpStatus.OK,
          message: 'Successfully registered1!',
          data: {
            user: user_data,
          },
          // token: access_token,
        };
      } else {
        user = await this.userRepository.create({
          ...registerUserDto,
          hashed_password,
        });
        const { access_token, refresh_token } = await generateToken(
          { id: user.id, is_active: user.is_active },
          this.jwtService,
        );
        const hashed_refresh_token = await hash(refresh_token, 7);

        const uniqueKey: string = uuid.v4();

        const updateuser = await this.userRepository.update(
          {
            hashed_refresh_token: hashed_refresh_token,
            activation_link: uniqueKey,
          },
          { where: { id: user.id }, returning: true },
        );

        if (type != 'googleauth') {
          await this.mailService.sendUserConfirmation(updateuser[1][0], uniqueKey);
        }

        const roleData: RoleDto = {
          ...registerUserDto,
          user_id: user.id,
        };
        await this.roleService.create(roleData);
        // if (role == 'student') {
        //   const data: NotificationDto = {
        //     type: 'student',
        //     user_id: user.id,
        //   };
        //   this.notificationService.create(data);
        // }
        await this.updateCurrentRole(user.id, current_role);

        const user_data: any = await this.userRepository.findByPk(user.id, {
          include: { model: Role },
          attributes: { exclude: ['activation_link', 'hashed_password', 'is_active', 'hashed_refresh_token', ''] },
        });

        // await this.mailService.sendUserConfirmation(user_data);
        return {
          statusCode: HttpStatus.OK,
          message: 'Verification code sended successfully',
          data: {
            user: user_data,
          },
        };
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createUsers(names: any[]) {
    let user_list: any = [];
    const users = names.map(async (name) => {
      const password = this.generateRandomPassword();
      console.log(name);
      name = name.split(' ');
      user_list.push({ login: name[0] + password.slice(0, 2) + '@gmail.com', password, user: name.join(' ') });
      await this.register({
        name: name[0],
        surname: name[1],
        email: name[0] + password.slice(0, 2) + '@gmail.com',
        password,
        role: RoleName.student,
      })
    });
    return user_list;
  }

  private generateRandomPassword(): string {
    const chars = '0123456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }
    return password;
  }

  async activateLink(activation_link: string) {
    if (!activation_link) {
      throw new BadRequestException('Activation link not found');
    }
    const user = await this.userRepository.findOne({
      where: { activation_link },
    });
    if (!user) {
      throw new BadRequestException('Activation link not found');
    } else if (user?.is_active) {
      throw new BadRequestException('User already activated');
    }
    const updateduser = await this.userRepository.update(
      { is_active: true, activation_link: "" },
      { where: { activation_link }, returning: true },
    );
    const { access_token, refresh_token } = await generateToken(
      { id: user.id },
      this.jwtService,
    );
    return {
      message: 'User activated successfully',
      user: updateduser[1][0],
      token: access_token,
    };
  }

  async login(
    loginUserDto: LoginUserDto,
    type?: string,
  ): Promise<object> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: loginUserDto.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (type != 'googleauth') {
        const isMatchPass = await bcrypt.compare(
          loginUserDto.password,
          user.hashed_password,
        );
        if (!isMatchPass) {
          throw new BadRequestException('Password did not match!');
        }
      }

      console.log(user);
      if (!user.is_active) {
        const uniqueKey: string = uuid.v4();

        const updateuser = await this.userRepository.update(
          {
            activation_link: uniqueKey,
          },
          { where: { id: user.id }, returning: true },
        );

        await this.mailService.sendUserConfirmation(updateuser[1][0], uniqueKey);

        return {
          statusCode: HttpStatus.OK,
          message: 'Verification code sended successfully',
          user,
        };
      }

      const { access_token, refresh_token } = await generateToken(
        { id: user.id },
        this.jwtService,
      );
      // await writeToCookie(refresh_token, res);
      return {
        statusCode: HttpStatus.OK,
        mesage: 'Logged in successfully',
        user,
        token: access_token,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(role: string): Promise<object> {
    try {
      console.log(role);
      const where: any = {};
      if (role != 'all') {
        where.role = { [Op.contains]: [[role, '']] };
      }
      const users = await this.userRepository.findAll({ where });
      return {
        statusCode: HttpStatus.OK,
        data: users,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async getReyting(
  //   subject_id: number,
  //   group_id: number,
  //   user_id: number,
  // ): Promise<object> {
  //   try {
  //     const filter: any = [];
  //     if (subject_id != 0) {
  //       filter.push(
  //         Sequelize.literal(`
  //           "test_id" IN (
  //             SELECT "id" FROM "tests"
  //             WHERE "id" = "Reyting"."test_id"
  //             AND "lesson_id" IN (
  //               SELECT "id" FROM "lesson"
  //               WHERE "id" = "tests"."lesson_id"
  //               AND "subject_id" = ${subject_id}
  //             )
  //           )
  //         `),
  //       );
  //     }
  //     const reytings = await this.userRepository.findAll({
  //       where: {
  //         [Op.and]: [
  //           // ...filter,
  //         ],
  //       },
  //       attributes: {
  //         include: [
  //           [
  //             Sequelize.literal(`(
  //               SELECT COALESCE(SUM("reyting"."ball"), 0)
  //               FROM "group"
  //               INNER JOIN "course" ON "course"."group_id" = :group_id
  //               INNER JOIN "reyting" ON "reyting"."lesson_id" = "Lesson"."id"
  //               INNER JOIN "user" ON "user"."id" = "reyting"."user_id"
  //               WHERE "reyting"."user_id" = "user"."id"
  //             )`),
  //             'a',
  //           ],
  //         ],
  //       },
  //       replacements: { group_id, user_id },
  //       include: [{ model: Reyting }],
  //     });
  //     return reytings;
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async getReyting(group_id: number, course_id: number): Promise<object> {
    console.log(+course_id)
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
              INNER JOIN "lesson" AS "Lesson" ON "Lesson"."id" = "Reyting"."lesson_id"
              INNER JOIN "course" AS "Course" ON "Course"."id" = "Lesson"."course_id"
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
                INNER JOIN "lesson" ON "lesson"."id" = "reyting"."lesson_id"
                INNER JOIN "course" ON "course"."id" = "lesson"."course_id"
                ${group_id == 0 ? 'INNER JOIN "group" ON "group"."id" = "course"."group_id"' : ''}
                WHERE "reyting"."user_id" = "User"."id"
                ${group_id == 0 ? ' AND "group"."id" = :group_id' : ''}
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

  async getLessonReyting(lesson_id: number): Promise<object> {
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
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }


  async getById(id: number): Promise<object> {
    console.log('getById', id);
    try {
      if (!id) {
        throw new NotFoundException('User not found!');
      }
      const userdata: any = await this.userRepository.findByPk(id);
      const current_role: string = userdata?.current_role || 'student';
      const user = await this.userRepository.findOne({
        where: { id },
        include: [
          {
            model: Role,
            attributes: {
              include: [
                // [
                //   Sequelize.literal(`
                //     (
                //       SELECT json_agg(json_build_object('id', s.id, 'title', s.title)) AS subjects
                //       FROM "subject" AS s
                //       JOIN "role" AS r ON s.id = ANY(r.subjects::int[])
                //       WHERE r."user_id" = :id
                //     )
                //   `),
                //   'subjects',
                // ],
                // [
                //   Sequelize.literal(`
                //     (
                //       SELECT json_agg(s.title) AS subjects
                //       FROM "subject" AS s
                //       JOIN "role" AS r ON s.id = ANY(r.subjects::int[])
                //       WHERE r."user_id" = :id AND r."role" = :current_role
                //     )
                //   `),
                //   'subjects',
                // ],
              ],
            },
          },
        ],
        replacements: { id, current_role },
      });
      if (!user) {
        throw new NotFoundException('User not found!');
      }
      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async searchUsers(page: number, search: string): Promise<object> {
    try {
      const limit = 20;
      const offset = (page - 1) * limit;
      const users = await this.userRepository.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { surname: { [Op.iLike]: `%${search}%` } },
          ],
        },
        include: { model: Role, where: { role: 'student' } },
        offset,
        limit,
      });
      const total_count = await this.userRepository.count({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { surname: { [Op.like]: `%${search}%` } },
          ],
        },
      });
      const total_pages = Math.ceil(total_count / limit);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: users,
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

  async checkEmail(email: string): Promise<object> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      return {
        statusCode: HttpStatus.OK,
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number, limit: number): Promise<object> {
    try {
      const offset = (page - 1) * limit;
      const users = await this.userRepository.findAll({ offset, limit });
      const total_count = await this.userRepository.count();
      const total_pages = Math.ceil(total_count / limit);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: users,
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

  async checkPassword(checkDto: CheckDto) {
    const res: any = await this.roleService.checkPassword(checkDto);
    if (res) {
      const user: any = await this.updateCurrentRole(
        res.data.id,
        res.data.role,
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: user.data,
      };
    }
  }

  async updateProfile(
    id: number,
    updateDto: UpdateDto,
    image: any
  ): Promise<object> {
    console.log(image);
    try {
      let user: any = await this.userRepository.findByPk(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (image) {
        if (user.image) {
          await this.filesService.deleteFile(user.image);
        }
        image = await this.filesService.createFile(image, 'image');
        updateDto.image = image.secure_url;
        console.log(updateDto.image)
        if (image == 'error') {
          return {
            status: HttpStatus.BAD_REQUEST,
            error: 'Error while uploading a file',
          };
        }
      } else {
        updateDto.image = null;
      }
      user = await this.userRepository.update(updateDto, {
        where: { id },
        returning: true,
      });
      // user = await this.userRepository.findByPk(id, {
      //   include: { model: User },
      // });
      return user[1][0];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async newPassword(newPasswordDto: NewPasswordDto): Promise<object> {
    try {
      const { new_password, confirm_password, activation_link } =
        newPasswordDto;
      const email =
        await this.resetpasswordService.checkActivationLink(activation_link);
      const hashed_password = await hash(new_password, 7);
      const updated_info = await this.userRepository.update(
        { hashed_password },
        { where: { email }, returning: true },
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Password updated successfully',
        data: {
          user: updated_info[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updatePassword(password: string, email: string): Promise<object> {
    try {
      const hashed_password = await hash(password, 7);
      const updated_info = await this.userRepository.update(
        { hashed_password },
        { where: { email }, returning: true },
      );
      return updated_info[1][0]
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async changeEmail(user_id: number, changeUserEmailDto: ChangeUserEmailDto): Promise<object> {
    try {
      const { email, password, code } = changeUserEmailDto;
      const user = await this.userRepository.findByPk(user_id);
      if (!user) {
        throw new BadRequestException("User not found");
      }
      await this.otpService.verifyOtp({ email, code })

      const hashed_password = await hash(password, 7);
      const updated_info = await this.userRepository.update(
        { email, hashed_password },
        { where: { email: user.email }, returning: true },
      );
      return updated_info[1][0]
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async newPassword(
  //   id: string,
  //   newPasswordDto: NewPasswordDto,
  // ): Promise<object> {
  //   try {
  //     const { old_password, new_password } = newPasswordDto;
  //     const user = await this.userRepository.findByPk(id);
  //     if (!user) {
  //       throw new NotFoundException('User not found!');
  //     }
  //     const is_match_pass = await compare(old_password, user.hashed_password);
  //     if (!is_match_pass) {
  //       throw new ForbiddenException('The old password did not match!');
  //     }
  //     const hashed_password = await hash(new_password, 7);
  //     const updated_info = await this.userRepository.update(
  //       { hashed_password },
  //       { where: { id }, returning: true },
  //     );
  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: "Parol o'zgartirildi",
  //       data: {
  //         user: updated_info[1][0],
  //       },
  //     };
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }
  async forgotPassword(
    // id: string,
    emailUserDto: EmailUserDto,
  ): Promise<object> {
    try {
      const { email } = emailUserDto;
      const activation_link: string = uuid.v4();

      const updated_info = await this.userRepository.update(
        { activation_link },
        { where: { email }, returning: true },
      );
      await this.mailService.sendUserActivationLink(activation_link, email);

      return {
        statusCode: HttpStatus.OK,
        message: "Emailingizga link yuborildi",
        data: {
          user: updated_info[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async resetPassword(
    // id: string,
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<object> {
    try {
      const { activation_link, new_password } =
        forgotPasswordDto;
      // await this.otpService.verifyOtp({ phone, code });
      // await this.getById(id);
      // if (new_password != confirm_new_password) {
      //   throw new ForbiddenException('Yangi parolni tasdiqlashda xatolik!');
      // }
      const user = await this.userRepository.findOne({
        where: { activation_link }
      })
      const hashed_password = await hash(new_password, 7);
      const updated_info = await this.userRepository.update(
        { hashed_password },
        { where: { email: user.email }, returning: true },
      );
      return {
        message: "Paroli o'zgartirildi",
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }


  async changePassword(
    user_id: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<object> {
    try {
      const { old_password, new_password } =
        changePasswordDto;
      const user = await this.userRepository.findByPk(user_id);
      const isMatchPass = await bcrypt.compare(
        changePasswordDto.old_password,
        user.hashed_password,
      );
      if (!isMatchPass) {
        throw new BadRequestException('Password did not match!');
      }
      const hashed_password = await hash(new_password, 7);
      await this.userRepository.update(
        { hashed_password },
        { where: { email: user.email }, returning: true },
      );
      return {
        message: "Parolingiz o'zgartirildi",
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateDto): Promise<object> {
    try {
      const user = await this.userRepository.findByPk(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      console.log(updateDto, id);
      const update = await this.userRepository.update(updateDto, {
        where: { id },
        returning: true,
      });
      console.log(update);
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: update[1][0],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateCurrentRole(id: number, current_role: string): Promise<object> {
    try {
      const user = await this.userRepository.findByPk(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const update = await this.userRepository.update(
        { current_role },
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

  // async updateTestReyting(id: number): Promise<object> {
  //   try {
  //     console.log(id, '-----------------------');
  //     const user = await this.userRepository.findByPk(id);
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }
  //     const test_reyting = user.test_reyting + 1;
  //     const update = await this.userRepository.update(
  //       { test_reyting },
  //       {
  //         where: { id },
  //         returning: true,
  //       },
  //     );
  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: 'Updated successfully',
  //       data: update[1][0],
  //     };
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async deleteUser(id: string): Promise<object> {
    try {
      const user = await this.userRepository.findByPk(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.filesService.deleteFile(user.image);
      user.destroy();
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verify(token: string) {
    const client = new OAuth2Client(process.env.CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    });
    const payload: any = ticket.getPayload();
    // If request specified a G Suite domain:
    // const domain = payload['hd'];

    return payload;
  }

  async googleAuth(credential: string) {
    console.log(credential, 'credential');
    try {
      const payload: any = await this.verify(credential);
      console.log(payload);
      const data: any = {
        name: payload.given_name,
        surname: payload.family_name,
        password: credential,
        email: payload.email,
        is_active: true,
        role: 'student',
      };
      const is_user = await this.userRepository.findOne({
        where: {
          email: payload.email,
        },
      });
      let user: any;
      if (is_user) {
        user = await this.login(data, 'googleauth');
      } else {
        user = await this.register(data, 'googleauth');
      }
      return user;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
  }

  async createDefaultUser() {
    try {
      await this.register({
        name: process.env.INITIAL_NAME,
        surname: process.env.INITIAL_SURNAME,
        password: process.env.INITIAL_PASSWORD,
        role: RoleName.super_admin,
        email: process.env.INITIAL_EMAIL,
      });
    } catch { }
  }
}
