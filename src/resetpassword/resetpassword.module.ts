import { Module } from '@nestjs/common';
import { ResetpasswordService } from './resetpassword.service';
import { ResetpasswordController } from './resetpassword.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Resetpassword } from './models/resetpassword.models';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [SequelizeModule.forFeature([Resetpassword]), MailModule],
  controllers: [ResetpasswordController],
  providers: [ResetpasswordService],
  exports: [ResetpasswordService],
})
export class ResetpasswordModule {}
