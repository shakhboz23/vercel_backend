import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.models';
import { NotificationModule } from '../notification/notification.module';
import { RoleModule } from '../role/role.module';
import { ResetpasswordModule } from '../resetpassword/resetpassword.module';
import { JwtModule } from '@nestjs/jwt';
import { FilesModule } from 'src/files/files.module';
import { OtpModule } from 'src/otp/otp.module';
import { UserAuthService } from './services/user-auth.service';
import { UserAnalyticsService } from './services/user-analytics.service';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    forwardRef(() => RoleModule),
    ResetpasswordModule,
    JwtModule,
    FilesModule,
    OtpModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserAuthService, UserAnalyticsService],
  exports: [UserService],
})
export class UserModule {}
