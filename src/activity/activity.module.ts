import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Activity } from './models/activity.models';

@Module({
  imports: [SequelizeModule.forFeature([Activity])],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
