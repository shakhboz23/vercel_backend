import { Module } from '@nestjs/common';
import { ResetpasswordService } from './resetpassword.service';
import { ResetpasswordController } from './resetpassword.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Resetpassword } from './models/resetpassword.models';

@Module({
  imports: [SequelizeModule.forFeature([Resetpassword])],
  controllers: [ResetpasswordController],
  providers: [ResetpasswordService],
  exports: [ResetpasswordService],
})
export class ResetpasswordModule {}
