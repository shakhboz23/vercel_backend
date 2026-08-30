import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName, User } from './models/user.models';
import { InjectModel } from '@nestjs/sequelize';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { Op } from 'sequelize';
import { Role } from '../role/models/role.models';
import { CheckDto } from '../role/dto/check.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { UpdateDto } from './dto/update.dto';
import { Tests } from 'src/test/models/test.models';
import { Course } from 'src/course/models/course.models';
import { FilesService } from 'src/files/files.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { PhoneUserDto } from './dto/email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUserEmailDto } from './dto/change-email.dto';
import { UserAuthService } from './services/user-auth.service';
import { UserAnalyticsService } from './services/user-analytics.service';

// UserService is the facade the rest of the app talks to. Registration,
// login and password/role flows live in UserAuthService; reyting/analytics
// queries live in UserAnalyticsService (both under ./services/). This class
// keeps the flat public API that existed here before the split (thin
// delegating wrappers for the auth/analytics methods) plus the plain user
// CRUD/query methods that didn't warrant their own service.
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    private readonly filesService: FilesService,
    private readonly userAuthService: UserAuthService,
    private readonly userAnalyticsService: UserAnalyticsService,
  ) { }

  async getAll(role: string) {
    try {
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

  async getById(id: number): Promise<any> {
    try {
      if (!id) {
        throw new NotFoundException('User not found!');
      }
      const user = await this.userRepository.findOne({
        where: { id },
        include: [
          {
            model: Role,
          },
        ],
      });

      if (!user) {
        throw new NotFoundException('User not found!');
      }

      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getStudentById(student_id: string): Promise<any> {
    try {
      if (!student_id) {
        return null;
      }
      const student = await this.userRepository.findOne({
        where: { student_id },
        include: [
          {
            model: Role,
            where: { role: RoleName.student },
          },
        ],
      });
      return student;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getUserInfo(id: number) {
    try {
      if (!id) {
        throw new NotFoundException('User not found!');
      }
      const user = await this.userRepository.findOne({
        where: { id },
        include: [
          {
            model: Role,
            attributes: {
              include: [
              ],
            },
          },
          {
            model: Tests,
          },
          {
            model: Course,
          }
        ],
      });
      if (!user) {
        throw new NotFoundException('User not found!');
      }
      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async searchUsers(page: number, search: string) {
    try {
      const limit = 20;
      const offset = (page - 1) * limit;
      const users = await this.userRepository.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { surname: { [Op.iLike]: `%${search}%` } },
            { phone: { [Op.iLike]: `%${search}%` } },
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

  async pagination(page: number, limit: number) {
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

  async updateProfile(
    id: number,
    updateDto: UpdateDto,
    image: any
  ) {
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
      return user[1][0];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateDto) {
    try {
      const user = await this.userRepository.findByPk(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const update = await this.userRepository.update(updateDto, {
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

  async deleteUser(id: string) {
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

  // --- Delegates to UserAuthService (registration/login/password/role) ---

  async register(registerUserDto: RegisterUserDto, type?: string) {
    return this.userAuthService.register(registerUserDto, type);
  }

  async createUsers(names: any[]) {
    return this.userAuthService.createUsers(names);
  }

  async activateLink(activation_link: string) {
    return this.userAuthService.activateLink(activation_link);
  }

  async login(loginUserDto: LoginUserDto, type?: string) {
    return this.userAuthService.login(loginUserDto, type);
  }

  async getWebAppUser(initData: any) {
    return this.userAuthService.getWebAppUser(initData);
  }

  async checkEmail(email: string) {
    return this.userAuthService.checkEmail(email);
  }

  async checkPassword(checkDto: CheckDto) {
    return this.userAuthService.checkPassword(checkDto);
  }

  async newPassword(newPasswordDto: NewPasswordDto) {
    return this.userAuthService.newPassword(newPasswordDto);
  }

  async updatePassword(password: string, phone: string) {
    return this.userAuthService.updatePassword(password, phone);
  }

  async changeEmail(user_id: number, changeUserEmailDto: ChangeUserEmailDto) {
    return this.userAuthService.changeEmail(user_id, changeUserEmailDto);
  }

  async forgotPassword(phoneUserDto: PhoneUserDto) {
    return this.userAuthService.forgotPassword(phoneUserDto);
  }

  async resetPassword(forgotPasswordDto: ForgotPasswordDto) {
    return this.userAuthService.resetPassword(forgotPasswordDto);
  }

  async changePassword(user_id: number, changePasswordDto: ChangePasswordDto) {
    return this.userAuthService.changePassword(user_id, changePasswordDto);
  }

  async updateCurrentRole(id: number, current_role: string) {
    return this.userAuthService.updateCurrentRole(id, current_role);
  }

  async verify(token: string, type?: string) {
    return this.userAuthService.verify(token, type);
  }

  async googleAuth(credential: string, type?: string) {
    return this.userAuthService.googleAuth(credential, type);
  }

  async createDefaultUser() {
    return this.userAuthService.createDefaultUser();
  }

  // --- Delegates to UserAnalyticsService (reyting/analytics) ---

  async getReyting(group_id: number, course_id: number) {
    return this.userAnalyticsService.getReyting(group_id, course_id);
  }

  async getLessonReyting(lesson_id: number) {
    return this.userAnalyticsService.getLessonReyting(lesson_id);
  }

  async getUserAnalytics(user_id: number, group_id: number): Promise<any> {
    return this.userAnalyticsService.getUserAnalytics(user_id, group_id);
  }
}
