import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Payment, PaymentMethod, PaymentStatus } from './models/payment.models';
import { InjectModel } from '@nestjs/sequelize';
import { PaymentDto } from './dto/payment.dto';
import { Op } from 'sequelize';
import { Role } from '../role/models/role.models';
import { ReytingService } from 'src/reyting/reyting.service';
import { ReytingDto } from 'src/reyting/dto/reyting.dto';
import { UserStreakService } from 'src/user_streak/user_streak.service';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Course } from 'src/course/models/course.models';
import { CourseSchedule } from 'src/course_schedule/models/course_schedule.models';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment) private paymentRepository: typeof Payment,
    private userStreakService: UserStreakService,
  ) { }

  async create(paymentDto: PaymentDto): Promise<object> {
    let data: any;
    try {
      const payment = await this.paymentRepository.findOne({
        where: {
          user_id: paymentDto.user_id,
          course_id: paymentDto.course_id,
        },
        include: [{ model: Course }]
      });

      if (payment) {
        if ((payment.monthly_payment || payment.course.price) - paymentDto.amount - (payment.debt || 0) < 0 && paymentDto.amount > 0) {
          throw new BadRequestException("To'lov miqdordan oshiqcha")
        }
        const update = await this.paymentRepository.update(
          {
            ...paymentDto,
            monthly_payment: payment.course.price,
            debt: (payment.monthly_payment || payment.course.price) - paymentDto.amount - (payment.debt || 0),
            status: PaymentStatus.SUCCESS,
            payment_method: PaymentMethod.CASH,
          },
          {
            where: {
              user_id: paymentDto.user_id,
              course_id: paymentDto.course_id,
            },
            returning: true,
          },
        );
        data = update[1][0];
      } else {
        data = await this.paymentRepository.create({
          ...paymentDto,
          status: PaymentStatus.SUCCESS,
          payment_method: PaymentMethod.CASH,
        });
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Successfully created!',
        data,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  // async login(loginUserDto: LoginUserDto): Promise<object> {
  //   try {
  //     const { phone, password } = loginUserDto;
  //     const user = await this.paymentRepository.findOne({ where: { phone } });
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
      const users = await this.paymentRepository.findAll();
      return {
        statusCode: HttpStatus.OK,
        data: users,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async getPayment(getPaymentDto: GetPaymentDto): Promise<object> {
  //   try {
  //     const { role, user_id, start_time, end_time } = getPaymentDto;
  //     const users = await this.paymentRepository.findAll({
  //       where: {
  //         role,
  //         user_id,
  //         createdAt: {
  //           [Op.lte]: start_time,
  //           [Op.gte]: end_time,
  //         },
  //       },
  //       // order: [['test_reyting', 'DESC']],
  //     });
  //     return {
  //       statusCode: HttpStatus.OK,
  //       data: users,
  //     };
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async getById(id: string): Promise<object> {
    try {
      const user = await this.paymentRepository.findByPk(id, {
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
      const users = await this.paymentRepository.findAll({ offset, limit });
      const total_count = await this.paymentRepository.count();
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
  //     const user = await this.paymentRepository.findByPk(id);
  //     if (!user) {
  //       throw new NotFoundException('User not found!');
  //     }
  //     const is_match_pass = await compare(old_password, user.hashed_password);
  //     if (!is_match_pass) {
  //       throw new ForbiddenException('The old password did not match!');
  //     }
  //     const hashed_password = await hash(new_password, 7);
  //     const updated_info = await this.paymentRepository.update(
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
  //     const updated_info = await this.paymentRepository.update(
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
  //     const user = await this.paymentRepository.findByPk(id);
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }
  //     const update = await this.paymentRepository.update(updateDto, {
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
  //     const user = await this.paymentRepository.findByPk(id);
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }
  //     const test_reyting = user.test_reyting + 1;
  //     const update = await this.paymentRepository.update(
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
      const user = await this.paymentRepository.findByPk(id);
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
