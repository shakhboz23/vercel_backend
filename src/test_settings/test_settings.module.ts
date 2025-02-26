import { Module } from '@nestjs/common';
import { Test_settingsService } from './test_settings.service';
import { Test_settingsController } from './test_settings.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Test_settings } from './models/test_settings.models';

@Module({
  imports: [SequelizeModule.forFeature([Test_settings])],
  controllers: [Test_settingsController],
  providers: [Test_settingsService],
  exports: [Test_settingsService],
})
export class Test_settingsModule {}
