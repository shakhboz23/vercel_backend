import { Module, forwardRef } from '@nestjs/common';
import { ReytingService } from './reyting.service';
import { ReytingController } from './reyting.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Reyting } from './models/reyting.models';
import { JwtModule } from '@nestjs/jwt';
import { TestsModule } from 'src/test/test.module';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Course } from 'src/course/models/course.models';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [SequelizeModule.forFeature([Reyting, Lesson, Course]), JwtModule, forwardRef(()=> TestsModule), forwardRef(() => BotModule),],
  controllers: [ReytingController],
  providers: [ReytingService],
  exports: [ReytingService],
})
export class ReytingModule {}
