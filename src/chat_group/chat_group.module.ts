import { Module, forwardRef } from '@nestjs/common';
import { ChatGroupService } from './chat_group.service';
import { ChatGroupController } from './chat_group.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatGroup } from './models/chat_group.models';

@Module({
  imports: [SequelizeModule.forFeature([ChatGroup])],
  controllers: [ChatGroupController],
  providers: [ChatGroupService],
  exports: [ChatGroupService],
})
export class ChatGroupModule {}
