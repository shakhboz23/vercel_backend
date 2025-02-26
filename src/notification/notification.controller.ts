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
import { UserService } from '../user/user.service';

@ApiTags('notification')
@WebSocketGateway({ cors: { origin: '*', credentials: true } }) // cors
@Controller('notification')
export class NotificationController
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly notificationService: NotificationService,
    // private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    this.server.on('connection', async (socket) => {
      // const id = +socket.handshake.query.id;
      // console.log(id, '================================');
      // const data: any = await this.userService.userAviable(socket, id, true);
      // this.server.emit('connected', data);
    });
  }

  async handleDisconnect(client: Socket) {
    // const id = +client.handshake?.query?.id;
    // console.log(id, '================================');
    // const data: any = await this.userService.userAviable(client, id, false);
    // console.log('👎🛵👎👎');
    // this.server.emit('disconnected', data);
  }

  @ApiOperation({ summary: 'Create a new notification' })
  // @UseGuards(AuthGuard)
  @Post('')
  create(@Body() notificationDto: NotificationDto) {
    const notification = this.notificationService.create(notificationDto);
    // this.server.emit('getAll/created');
    return notification;
  }

  // @ApiOperation({ summary: 'Get all notifications' })
  // // @UseGuards(AuthGuard)
  // @SubscribeMessage('getAll/created')
  // async created(@MessageBody() { page }: { page: number }) {
  //   const notifications = await this.notificationService.findAll(page);
  //   this.server.emit('notifications', notifications);
  // }

  // @ApiOperation({ summary: 'Get all notifications' })
  // // @UseGuards(AuthGuard)
  // @SubscribeMessage('getAll/notifications')
  // async getGroupNotifications(
  //   @MessageBody()
  //   { notificationgroup_id, page }: { notificationgroup_id: number; page: number },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const notifications = await this.notificationService.getGroupNotifications(notificationgroup_id, page);
  //   client.emit('notifications', notifications);
  // }

  @ApiOperation({ summary: 'Get notification by ID' })
  @UseGuards(AuthGuard)
  @SubscribeMessage('getById/notifications')
  async findById(@MessageBody() id: string, @ConnectedSocket() client: Socket) {
    const notification = await this.notificationService.findById(id);
    client.emit('getById', notification);
  }

  // @ApiOperation({ summary: 'Update notification by ID' })
  // @UseGuards(AuthGuard)
  // @SubscribeMessage('update/notifications')
  // async update(
  //   @MessageBody() { id, notification }: { id: string; notification: NotificationDto },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const updated_notification = await this.notificationService.update(id, notification);
  //   client.emit('updated', updated_notification);
  //   if (updated_notification.status !== 404) {
  //     this.server.emit('listener');
  //   }
  // }

  @ApiOperation({ summary: 'Update lesson profile by ID' })
  // @UseGuards(AuthGuard)
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

  // @ApiOperation({ summary: 'Delete notification by ID' })
  // @UseGuards(AuthGuard)
  // @SubscribeMessage('delete/notifications')
  // async delete(@MessageBody() id: string, @ConnectedSocket() client: Socket) {
  //   const deleted_notification = await this.notificationService.delete(id);
  //   this.server.emit('deleted', deleted_notification);
  //   if (deleted_notification.status !== 404) {
  //     this.server.emit('listener');
  //   }
  // }

  @ApiOperation({ summary: 'Delete user by ID' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @ConnectedSocket() client: Socket) {
    const notification = await this.notificationService.delete(id);
    client.emit('created');
    return notification;
  }
}
