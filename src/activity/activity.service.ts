import { GetActivityDto } from './dto/get_activity.dto';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Activity } from './models/activity.models';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityDto } from './dto/activity.dto';
import { Op } from 'sequelize';
import { Role } from '../role/models/role.models';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity) private activityRepository: typeof Activity,
  ) {}

  async create(activityDto: ActivityDto): Promise<object> {
    try {
      // let data: any;
      // const startOfDay = new Date().setHours(0, 0, 0);
      // const endOfDay = new Date(startOfDay + 24 * 60 * 60 * 1000);
      // const activity = await this.activityRepository.findOne({
      //   where: { 
      //     user_id: activityDto.user_id,
      //     createdAt: {
      //       [Op.gte]: startOfDay,
      //       [Op.lt]: endOfDay,
      //     },
      //   },
      // });

      // if (activity) {
      //   const update = await this.activityRepository.update(
      //     {
      //       activity: String(+activity.activity + +activityDto.activity),
      //     },
      //     {
      //       where: {
      //         user_id: activityDto.user_id,
      //         createdAt: {
      //           [Op.gte]: startOfDay,
      //           [Op.lt]: endOfDay,
      //         },
      //       },
      //       returning: true,
      //     },
      //   );
      //   data = update[0][1];
      // } else {
      //   data = await this.activityRepository.create(activityDto);
      // }

      return {
        statusCode: HttpStatus.OK,
        message: 'Successfully created!',
        // data,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  // async login(loginUserDto: LoginUserDto): Promise<object> {
  //   try {
  //     const { phone, password } = loginUserDto;
  //     const user = await this.activityRepository.findOne({ where: { phone } });
  //     if (!user) {
  //       throw new NotFoundException('Telefon raqam yoki parol xato!');
  //     }
  //     const is_match_pass = await compare(password, user.hashed_password);
  //     if (!is_match_pass) {
  //       throw new ForbiddenException('Login yoki parol xato!');
  //     }
  //     // return this.otpService.sendOTP({ phone });
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async getAll(): Promise<object> {
    try {
      // const where: any = {};
      // if (role != 'all') {
      //   where.role = { [Op.contains]: [[role, '']] };
      // }
      const users = await this.activityRepository.findAll();
      return {
        statusCode: HttpStatus.OK,
        data: users,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getActivity(getActivityDto: GetActivityDto): Promise<object> {
    try {
      const { role, user_id, start_time, end_time } = getActivityDto;
      const users = await this.activityRepository.findAll({
        where: {
          role,
          user_id,
          createdAt: {
            [Op.lte]: start_time,
            [Op.gte]: end_time,
          },
        },
        // order: [['test_reyting', 'DESC']],
      });
      return {
        statusCode: HttpStatus.OK,
        data: users,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: string): Promise<object> {
    try {
      const user = await this.activityRepository.findByPk(id, {
        include: { model: Role },
      });
      if (!user) {
        throw new NotFoundException('User topilmadi!');
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
      const users = await this.activityRepository.findAll({ offset, limit });
      const total_count = await this.activityRepository.count();
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

  // async newPassword(
  //   id: string,
  //   newPasswordDto: NewPasswordDto,
  // ): Promise<object> {
  //   try {
  //     const { old_password, new_password } = newPasswordDto;
  //     const user = await this.activityRepository.findByPk(id);
  //     if (!user) {
  //       throw new NotFoundException('User not found!');
  //     }
  //     const is_match_pass = await compare(old_password, user.hashed_password);
  //     if (!is_match_pass) {
  //       throw new ForbiddenException('The old password did not match!');
  //     }
  //     const hashed_password = await hash(new_password, 7);
  //     const updated_info = await this.activityRepository.update(
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

  // async forgotPassword(
  //   id: string,
  //   forgotPasswordDto: ForgotPasswordDto,
  // ): Promise<object> {
  //   try {
  //     const { phone, code, new_password, confirm_new_password } =
  //       forgotPasswordDto;
  //     await this.otpService.verifyOtp({ phone, code });
  //     await this.getById(id);
  //     if (new_password != confirm_new_password) {
  //       throw new ForbiddenException('Yangi parolni tasdiqlashda xatolik!');
  //     }
  //     const hashed_password = await hash(new_password, 7);
  //     const updated_info = await this.activityRepository.update(
  //       { hashed_password },
  //       { where: { id }, returning: true },
  //     );
  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: "Paroli o'zgartirildi",
  //       data: {
  //         user: updated_info[1][0],
  //       },
  //     };
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  // async update(id: string, updateDto: UpdateDto): Promise<object> {
  //   try {
  //     const user = await this.activityRepository.findByPk(id);
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }
  //     const update = await this.activityRepository.update(updateDto, {
  //       where: { id },
  //       returning: true,
  //     });
  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: 'Updated successfully',
  //       data: update[1][0],
  //     };
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }
  // async updateTestReyting(id: number): Promise<object> {
  //   try {
  //     console.log(id, '-----------------------');
  //     const user = await this.activityRepository.findByPk(id);
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }
  //     const test_reyting = user.test_reyting + 1;
  //     const update = await this.activityRepository.update(
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
      const user = await this.activityRepository.findByPk(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.destroy();
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
