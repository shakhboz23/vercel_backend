import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Like } from './models/like.models';
import { UserModule } from '../user/user.module';
import { UploadedModule } from '../uploaded/uploaded.module';

@Module({
  imports: [SequelizeModule.forFeature([Like]), UserModule, UploadedModule],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
