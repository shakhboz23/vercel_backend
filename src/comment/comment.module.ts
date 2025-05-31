import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Comment } from './models/comment.models';
import { UserModule } from '../user/user.module';
import { UploadedModule } from '../uploaded/uploaded.module';

@Module({
  imports: [SequelizeModule.forFeature([Comment]), UserModule, UploadedModule],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
