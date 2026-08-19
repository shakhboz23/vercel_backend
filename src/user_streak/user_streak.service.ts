import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserStreak } from './models/user_streak.models';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../role/models/role.models';
import { ReytingService } from 'src/reyting/reyting.service';
import * as dayjs from 'dayjs';
import { UserStreakDto } from './dto/user_streak.dto';
import { ReytingDto } from 'src/reyting/dto/reyting.dto';
import { FinishedType } from 'src/reyting/models/reyting.models';
import { login } from 'node_modules/telegraf/typings/button';

@Injectable()
export class UserStreakService {
  constructor(
    @InjectModel(UserStreak) private userStreakRepository: typeof UserStreak,
    private reytingService: ReytingService,
  ) { }

  async create(userStreakDto: UserStreakDto): Promise<object> {
    console.log('hi====');

    let data: any;
    try {
      const user = await this.userStreakRepository.findOne({
        where: {
          user_id: userStreakDto.user_id,
          course_id: userStreakDto.course_id,
        },
      });

      const today = dayjs().startOf('day');

      const season = this.getSeasonId(today.toDate());
      let currentStreak = 0;
      if (user && user?.season !== season) {
        user.currentStreak = 0;
        user.season = season;
      }
      console.log(userStreakDto);

      const attendanceDays = userStreakDto?.attendance_days
        .map((day): number | null => {
          switch (day?.toLowerCase()) {
            case 'mon':
              return 1;
            case 'tue':
              return 2;
            case 'wed':
              return 3;
            case 'thu':
              return 4;
            case 'fri':
              return 5;
            case 'sat':
              return 6;
            case 'sun':
              return 7;
            default:
              return null;
          }
        })
        .filter((v): v is number => v !== null);
      console.log("Hi");
      console.log(attendanceDays);
      console.log(user);

      // If the streak row was already touched today (e.g. a teacher
      // corrects an attendance mark later the same day), lastActivityDate
      // is today, so expectedLessonsBetween finds no scheduled day after it
      // and returns 0. That's not a "no activity expected" case, it's a
      // same-day re-save, so skip the streak recalculation entirely instead
      // of bailing out.
      const alreadyUpdatedToday = !!user && dayjs(user.lastActivityDate).isSame(today, 'day');

      if (!alreadyUpdatedToday) {
        const expectedLessons = user ? this.expectedLessonsBetween(
          user?.lastActivityDate,
          today.toDate(),
          attendanceDays,
        ) : 1;
        console.log("Hi1");
        console.log(expectedLessons);

        if (expectedLessons === 0) {
          return;
        }

        if (expectedLessons === 1 && user) {
          user.currentStreak += userStreakDto.attendance ? 1 : 0;
        } else {
          currentStreak = userStreakDto.attendance ? 1 : 0;
        }
      }
      console.log('go1');

      if (user) {
        console.log('go2');
        const update = await this.userStreakRepository.update(
          {
            ...userStreakDto,
            currentStreak: user?.currentStreak || currentStreak,
            lastActivityDate: today.toDate(),
            season: season,
          },
          {
            where: {
              user_id: userStreakDto.user_id,
              course_id: userStreakDto.course_id,
            },
            returning: true,
          },
        );
        data = update[1][0];
        const reyting: ReytingDto = {
          ball: user?.currentStreak || currentStreak,
          finished_type: FinishedType.attendance,
          course_id: userStreakDto.course_id,
        };
        await this.reytingService.create(
          reyting,
          userStreakDto.user_id,
        );
      } else {
        console.log('go');

        data = await this.userStreakRepository.create(userStreakDto);
        const reyting: ReytingDto = {
          ball: user?.currentStreak || currentStreak,
          finished_type: FinishedType.attendance,
          course_id: userStreakDto.course_id,
        };
        await this.reytingService.create(
          reyting,
          userStreakDto.user_id,
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Successfully created!',
        data,
      };
    } catch (error: any) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getAll(): Promise<object> {
    try {
      // const where: any = {};
      // if (role != 'all') {
      //   where.role = { [Op.contains]: [[role, '']] };
      // }
      const users = await this.userStreakRepository.findAll();
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
      const user = await this.userStreakRepository.findByPk(id, {
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
      const users = await this.userStreakRepository.findAll({ offset, limit });
      const total_count = await this.userStreakRepository.count();
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

  async deleteUser(id: string): Promise<object> {
    try {
      const user = await this.userStreakRepository.findByPk(id);
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

  getSeasonId(date: Date) {
    const season = Math.floor(date.getMonth() / 2);

    return date.getFullYear() * 10 + season;
  }

  expectedLessonsBetween(
    lastDate: Date,
    currentDate: Date,
    attendanceDays: number[],
  ) {
    let count = 0;

    let date = dayjs(lastDate).add(1, 'day');

    while (date.isBefore(currentDate) || date.isSame(currentDate, 'day')) {
      const weekday = date.day(); // 0-6

      const normalized = weekday === 0 ? 7 : weekday;

      if (attendanceDays.includes(normalized)) {
        count++;
      }

      date = date.add(1, 'day');
    }

    return count;
  }
}
