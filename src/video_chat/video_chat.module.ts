import { Module } from '@nestjs/common';
import { VideoChatService } from './video_chat.service';
import { VideoChatController } from './video_chat.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { FilesModule } from '../files/files.module';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';
import { VideoChat } from './models/video_chat.model';

@Module({
  imports: [
    SequelizeModule.forFeature([VideoChat]),
    RoleModule,
    UserModule,
    FilesModule,
  ],
  controllers: [VideoChatController],
  providers: [VideoChatService, VideoChatController],
  exports: [VideoChatService],
})
export class VideoChatModule { }
