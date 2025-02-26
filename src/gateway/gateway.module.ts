import { Module } from '@nestjs/common';
import { ChatGateway } from './gateway';

@Module({
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatGatewayModule {}