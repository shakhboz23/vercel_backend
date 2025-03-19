import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Group } from './models/group.models';
import { ChatGateway } from '../gateway/gateway';
import { UploadedModule } from '../uploaded/uploaded.module';
import { JwtModule } from '@nestjs/jwt';
import { WatchedModule } from 'src/watched/watched.module';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Group]), UploadedModule, JwtModule, WatchedModule, FilesModule,
  ],
  controllers: [GroupController],
  providers: [GroupService, ChatGateway],
  exports: [GroupService],
})
export class GroupModule {}
