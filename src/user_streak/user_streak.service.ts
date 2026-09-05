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

@Injectable()
export class UserStreakService {
  constructor(
    @InjectModel(UserStreak) private userStreakRepository: typeof UserStreak,
    private reytingService: ReytingService,
  ) {}

  async create(userStreakDto: UserStreakDto): Promise<object> {
    let data: any;
    try {
      const user = await this.userStreakRepository.findOne({
        where: {
          user_id: userStreakDto.user_id,
          course_id: userStreakDto.course_id,
        },
      });

      // Streaks/season/lastActivityDate must all be anchored to the date the
      // attendance record is *for*, not the server's wall-clock "now" — a
      // teacher can mark or correct attendance for a past (or bulk-entered)
      // date, and using real-time "today" there silently breaks the streak
      // math (expectedLessonsBetween, alreadyUpdatedToday, season rollover).
      const today = dayjs(userStreakDto.date).startOf('day');

      const season = this.getSeasonId(today.toDate());
      // If the season rolled over since the last recorded activity, the
      // streak carried from the old season no longer applies.
      
      const priorStreak = user && user.season === season ? user.currentStreak : 0;

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

      // If the streak row was already touched today (e.g. a teacher
      // corrects an attendance mark later the same day), lastActivityDate
      // is today, so expectedLessonsBetween finds no scheduled day after it
      // and returns 0. That's not a "no activity expected" case, it's a
      // same-day re-save, so skip the streak recalculation entirely instead
      // of bailing out.
      const alreadyUpdatedToday =
        !!user && dayjs(user.lastActivityDate).isSame(today, 'day');

      // Same-day re-save (e.g. a teacher correcting a mark): leave the
      // streak as it already stands, don't recompute it a second time.
      let nextStreak = priorStreak;
        console.log(alreadyUpdatedToday, 2303);
        
      if (!alreadyUpdatedToday) {
        const expectedLessons = user
          ? this.expectedLessonsBetween(
              user?.lastActivityDate,
              today.toDate(),
              attendanceDays,
            )
          : 1;

        if (expectedLessons === 0) {
          return;
        }

        if (expectedLessons === 1 && user) {
          // Consecutive scheduled lesson: extend the streak on attendance,
          // break it on absence.
          nextStreak = userStreakDto.attendance ? priorStreak + 1 : 0;
        } else {
          // One or more scheduled lessons were missed in between: the
          // streak restarts from scratch.
          nextStreak = userStreakDto.attendance ? 1 : 0;
        }
      }

      if (user) {
        const update = await this.userStreakRepository.update(
          {
            ...userStreakDto,
            currentStreak: nextStreak,
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
      } else {
        data = await this.userStreakRepository.create({
          ...userStreakDto,
          currentStreak: nextStreak,
          lastActivityDate: today.toDate(),
          season,
        });
      }

      const reyting: ReytingDto = {
        ball: nextStreak,
        finished_type: FinishedType.attendance,
        course_id: userStreakDto.course_id,
      };
      await this.reytingService.create(reyting, userStreakDto.user_id, userStreakDto.date);

      return {
        statusCode: HttpStatus.OK,
        message: 'Successfully created!',
        data,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(): Promise<object> {
    try {
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
