import {
  Body,
  Controller,
  Delete,
  Headers,
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
import { AuthGuard } from '../common/guard/auth.guard';
import { ChatDto } from './dto/chat.dto';
import { ChatService } from './chat.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from '../common/pipes/image-validation.pipe';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import { extractUserIdFromToken } from 'src/common/utils/token';
import { JwtService } from '@nestjs/jwt';
import { ChatGateway } from '../gateway/gateway';

@ApiTags('chat')
@WebSocketGateway({ cors: { origin: '*', credentials: true } }) // cors
@Controller('chat')
export class ChatController
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly chatService: ChatService,
    private readonly roleService: RoleService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @SubscribeMessage('joinChat')
  handleJoin(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
    client.join(chatId);
    client.emit('joined', `Joined to chat 2303 ${chatId}`);
  }

  @SubscribeMessage('leaveChat')
  handleLeave(
    @MessageBody() chatId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(chatId);
  }

  async handleConnection(client: Socket) {
    try {
      this.chatGateway.server.on('connection', async (socket) => {});
    } catch (_) {}
  }

  async handleDisconnect(client: Socket) {}

  @ApiOperation({ summary: 'Create a new chat' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
        },
        icon: {
          type: 'number',
        },
        user_id: {
          type: 'number',
        },
        chatgroup_id: {
          type: 'number',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
        file_type: {
          type: 'object',
          properties: {
            size: {
              type: 'number',
            },
            type: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
          },
        },
      },
    },
  })
  @Post('/create')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() chatDto: ChatDto,
    @UploadedFile(new ImageValidationPipe()) file: Express.Multer.File,
    @ConnectedSocket() client: Socket,
    @Headers() headers: string,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    const chat: any = await this.chatService.create(chatDto, file, user_id);
    this.chatGateway.server
      .to(String(chatDto.chatgroup_id))
      .emit('receiveMessage', chat);
    return chat;
  }

  @ApiOperation({ summary: 'Get all chats' })
  @SubscribeMessage('getAll/created')
  async created(
    @MessageBody()
    { chatgroup_id, page }: { chatgroup_id: number; page: number },
  ) {
    const chats = await this.chatService.findAll(page, chatgroup_id);
    this.chatGateway.server.emit('chats', chats);
  }

  @ApiOperation({ summary: 'Get all chats' })
  @SubscribeMessage('getAll/join-room')
  async handleMessage(
    @MessageBody() { roomId, userId }: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
    this.chatGateway.server.emit('user-connected', userId);
  }

  @ApiOperation({ summary: 'Get all chats' })
  @SubscribeMessage('getAll/message')
  async sendMessage(
    @MessageBody() { message }: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.chatGateway.server.emit('createMessage', message);
  }

  @ApiOperation({ summary: 'Get all chats' })
  @SubscribeMessage('getAll/chats')
  async getGroupChats(
    @MessageBody()
    { chatgroup_id, page }: { chatgroup_id: number; page: number },
    @ConnectedSocket() client: Socket,
  ) {
    const chats = await this.chatService.getGroupChats(chatgroup_id, page);
    client.emit('chats', chats);
  }

  @ApiOperation({ summary: 'Get chat by ID' })
  @UseGuards(AuthGuard)
  @SubscribeMessage('getById/chats')
  async findById(@MessageBody() id: string, @ConnectedSocket() client: Socket) {
    const chat = await this.chatService.findById(id);
    client.emit('getById', chat);
  }

  @SubscribeMessage('joinchat-room')
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
    @Body() chatDto: ChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const chat = this.chatService.update(id, chatDto);
    client.emit('created');
    return chat;
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @ConnectedSocket() client: Socket) {
    const chat = await this.chatService.delete(id);
    client.emit('created');
    return chat;
  }
}
