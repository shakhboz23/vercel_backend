import { Module, forwardRef } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Role } from './models/role.models';
import { FilesModule } from '../files/files.module'; // Verify import path
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { ActivityModule } from '../activity/activity.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Role]),
    FilesModule,
    ActivityModule,
    forwardRef(() => UserModule)
    // CourseMemberModule
  ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
