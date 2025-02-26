import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.models';
import { NotificationModule } from '../notification/notification.module';
import { RoleModule } from '../role/role.module';
import { MailModule } from '../mail/mail.module';
import { ResetpasswordModule } from '../resetpassword/resetpassword.module';
import { JwtModule } from '@nestjs/jwt';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    forwardRef(() => RoleModule),
    MailModule,
    ResetpasswordModule,
    JwtModule,
    FilesModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
