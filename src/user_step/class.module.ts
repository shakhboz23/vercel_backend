import { Module } from '@nestjs/common';
import { UserStepService } from './class.service';
import { UserStepController } from './class.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserStep } from './models/class.models';
import { ChatGateway } from '../gateway/gateway';

@Module({
  imports: [SequelizeModule.forFeature([UserStep])],
  controllers: [UserStepController],
  providers: [UserStepService, ChatGateway],
  exports: [UserStepService]
})
export class UserStepModule {}
