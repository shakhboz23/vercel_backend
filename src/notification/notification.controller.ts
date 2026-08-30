import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guard/auth.guard';
import { NotificationDto } from './dto/notification.dto';
import { NotificationService } from './notification.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from '../pipes/image-validation.pipe';

@ApiTags('notification')
@WebSocketGateway({ cors: { origin: '*', credentials: true } }) // cors
@Controller('notification')
export class NotificationController
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  async handleConnection(client: Socket) {
    this.server.on('connection', async (socket) => {});
  }

  async handleDisconnect(client: Socket) {}

  @ApiOperation({ summary: 'Create a new notification' })
  @Post('')
  create(@Body() notificationDto: NotificationDto) {
    const notification = this.notificationService.create(notificationDto);
    return notification;
  }

  @ApiOperation({ summary: 'Get notification by ID' })
  @UseGuards(AuthGuard)
  @SubscribeMessage('getById/notifications')
  async findById(@MessageBody() id: string, @ConnectedSocket() client: Socket) {
    const notification = await this.notificationService.findById(id);
    client.emit('getById', notification);
  }

  @ApiOperation({ summary: 'Update lesson profile by ID' })
  @Put('/:id')
  update(
    @Param('id') id: string,
    @Body() notificationDto: NotificationDto,
    @ConnectedSocket() client: Socket,
  ) {
    const notification = this.notificationService.update(id, notificationDto);
    client.emit('created');
    return notification;
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @ConnectedSocket() client: Socket) {
    const notification = await this.notificationService.delete(id);
    client.emit('created');
    return notification;
  }
}
