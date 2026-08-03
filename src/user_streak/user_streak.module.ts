import { Module } from '@nestjs/common';
import { UserStreakService } from './user_streak.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserStreak } from './models/user_streak.models';
import { ReytingModule } from 'src/reyting/reyting.module';
import { UserStreakController } from './user_streak.controller';

@Module({
  imports: [SequelizeModule.forFeature([UserStreak]), ReytingModule],
  controllers: [UserStreakController],
  providers: [UserStreakService],
  exports: [UserStreakService],
})
export class UserStreakModule {}
