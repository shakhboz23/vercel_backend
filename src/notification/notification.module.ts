import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Notification } from './models/notification.model';
import { FilesModule } from '../files/files.module';
import { UserModule } from '../user/user.module';
@Module({
  imports: [SequelizeModule.forFeature([Notification]), FilesModule ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
