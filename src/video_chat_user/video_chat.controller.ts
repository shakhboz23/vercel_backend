import {
  Body,
  Controller,
  Delete,
  Get,
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
import { VideoChatDto } from './dto/video_chat.dto';
import { VideoChatService } from './video_chat.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from '../pipes/image-validation.pipe';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';

@ApiTags('VideoChat')
@WebSocketGateway({ cors: { origin: '*', credentials: true } }) // cors
@Controller('videochat')
export class VideoChatController
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly videoChatService: VideoChatService,
    private readonly roleService: RoleService,
    private readonly userService: UserService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      this.server.on('connection', async (socket) => {
        const id: number = +socket.handshake.query.id;
        const user: any = await this.userService.getById(id);
        if (user) {
          const data: any = await this.roleService.userAvailable(
            id,
            true,
            user.data.current_role,
          );
          this.server.emit('connected', data);
        }
      });
    } catch (_) { }
  }

  async handleDisconnect(client: Socket) {
    try {
      const id: number = +client.handshake.query.id;
      const user: any = await this.userService.getById(id);
      const data: any = await this.roleService.userAvailable(
        id,
        false,
        user.data.current_role,
      );
      this.server.emit('disconnected', data);
    } catch (_) { }
  }

  @ApiOperation({ summary: 'Join to video chat' })
  @Get('/join/:room')
  getById(@Param('room') room: string) {
    return this.videoChatService.joinRoom(room);
  }

  @ApiOperation({ summary: 'Create a new chat' })
  @Post('/')
  create(
    @Body() VideoChatDto: VideoChatDto,
    @ConnectedSocket() client: Socket,
    @Req() req: any,
  ) {
    const chat = this.videoChatService.create(VideoChatDto, req.headers);
    client.emit('getAll/created');
    return chat;
  }

  @ApiOperation({ summary: 'Get all chats' })
  @SubscribeMessage('getAll/created')
  async created(@MessageBody() { page }: { page: number }) {
    const chats = await this.videoChatService.findAll(page);
    this.server.emit('chats', chats);
  }

  @ApiOperation({ summary: 'Get all chats' })
  @SubscribeMessage('getAll/join-room')
  async handleMessage(
    @MessageBody() { roomId, userId }: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
    this.server.emit('user-connected', userId);
  }

  @ApiOperation({ summary: 'Get all chats' })
  @SubscribeMessage('getAll/message')
  async sendMessage(
    @MessageBody() { message }: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.emit('createMessage', message);
  }

  @ApiOperation({ summary: 'Get all chats' })
  @SubscribeMessage('getAll/chats')
  async getGroupChats(
    @MessageBody()
    { chatgroup_id, page }: { chatgroup_id: number; page: number },
    @ConnectedSocket() client: Socket,
  ) {
    const chats = await this.videoChatService.getGroupChats(chatgroup_id, page);
    client.emit('chats', chats);
  }

  @ApiOperation({ summary: 'Get chat by ID' })
  @UseGuards(AuthGuard)
  @SubscribeMessage('getById/chats')
  async findById(@MessageBody() id: string, @ConnectedSocket() client: Socket) {
    const chat = await this.videoChatService.findById(id);
    client.emit('getById', chat);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() { roomId, userId }: { roomId: string; userId: string },
    client: Socket,
  ) {
    client.join(roomId);
    client.broadcast.to(roomId).emit('user-connected', userId);
  }

  @ApiOperation({ summary: 'Update lesson profile by ID' })
  @Put('/:id')
  update(
    @Param('id') id: string,
    @Body() VideoChatDto: VideoChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const chat = this.videoChatService.update(id, VideoChatDto);
    client.emit('created');
    return chat;
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @ConnectedSocket() client: Socket) {
    const chat = await this.videoChatService.delete(id);
    client.emit('created');
    return chat;
  }
}
