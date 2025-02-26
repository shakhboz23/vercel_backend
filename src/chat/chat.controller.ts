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
import { AuthGuard } from '../guard/auth.guard';
import { ChatDto } from './dto/chat.dto';
import { ChatService } from './chat.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from '../pipes/image-validation.pipe';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import { extractUserIdFromToken } from 'src/utils/token';
import { JwtService } from '@nestjs/jwt';

@ApiTags('chat')
@WebSocketGateway({ cors: { origin: '*', credentials: true } }) // cors
@Controller('chat')
export class ChatController
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly roleService: RoleService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  async handleConnection(client: Socket) {
    // Handle connection
    try {
      this.server.on('connection', async (socket) => {
        const id: number = +socket.handshake.query.id;
        console.log(id, 'connection');
        // const user: any = await this.userService.getById(id);
        // if (user) {
        //   const data: any = await this.roleService.userAvailable(
        //     id,
        //     true,
        //     user.data.current_role,
        //   );
        //   this.server.emit('connected', data);
        // }
      });
    } catch (_) { }
  }

  async handleDisconnect(client: Socket) {
    try {
      const id: number = +client.handshake.query.id;
      console.log(id, 'id================================');
      // const user: any = await this.userService.getById(id);
      // const data: any = await this.roleService.userAvailable(
      //   id,
      //   false,
      //   user.data.current_role,
      // );
      // this.server.emit('disconnected', data);
    } catch (_) { }
  }

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
  // @UseGuards(AuthGuard)
  @Post('/create')
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() chatDto: ChatDto,
    @UploadedFile(new ImageValidationPipe()) file: Express.Multer.File,
    @ConnectedSocket() client: Socket,
    @Headers() headers: string,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    const chat = this.chatService.create(chatDto,  file, user_id);
    // client.emit('getAll/created');
    return chat;
  }

  @ApiOperation({ summary: 'Get all chats' })
  // @UseGuards(AuthGuard)
  @SubscribeMessage('getAll/created')
  async created(@MessageBody() { chatgroup_id, page }: { chatgroup_id: number, page: number }) {
    console.log(chatgroup_id, page, '2303')
    const chats = await this.chatService.findAll(page, chatgroup_id);
    this.server.emit('chats', chats);
  }

  @ApiOperation({ summary: 'Get all chats' })
  // @UseGuards(AuthGuard)
  @SubscribeMessage('getAll/join-room')
  async handleMessage(
    @MessageBody() { roomId, userId }: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
    // client.to(roomId).broadcast.emit("user-connected", userId);
    this.server.emit('user-connected', userId);

    // const chats = await this.chatService.findAll(page);
    // this.server.emit('chats', chats);
  }

  @ApiOperation({ summary: 'Get all chats' })
  // @UseGuards(AuthGuard)
  @SubscribeMessage('getAll/message')
  async sendMessage(
    @MessageBody() { message }: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    // client.join(roomId);
    // client.to(roomId).broadcast.emit("user-connected", userId);
    // this.server.emit("user-connected", userId);
    this.server.emit('createMessage', message);

    // const chats = await this.chatService.findAll(page);
    // this.server.emit('chats', chats);
  }

  @ApiOperation({ summary: 'Get all chats' })
  // @UseGuards(AuthGuard)
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

  // @ApiOperation({ summary: 'Update chat by ID' })
  // @UseGuards(AuthGuard)
  // @SubscribeMessage('update/chats')
  // async update(
  //   @MessageBody() { id, chat }: { id: string; chat: ChatDto },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const updated_chat = await this.chatService.update(id, chat);
  //   client.emit('updated', updated_chat);
  //   if (updated_chat.status !== 404) {
  //     this.server.emit('listener');
  //   }
  // }

  @ApiOperation({ summary: 'Update lesson profile by ID' })
  // @UseGuards(AuthGuard)
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

  // socket.on("join-room", (roomId, userId) => {
  //   socket.join(roomId);
  //   socket.to(roomId).broadcast.emit("user-connected", userId);

  //   socket.on("message", (message) => {
  //     io.to(roomId).emit("createMessage", message);
  //   });
  // });

  // @ApiOperation({ summary: 'Delete chat by ID' })
  // @UseGuards(AuthGuard)
  // @SubscribeMessage('delete/chats')
  // async delete(@MessageBody() id: string, @ConnectedSocket() client: Socket) {
  //   const deleted_chat = await this.chatService.delete(id);
  //   this.server.emit('deleted', deleted_chat);
  //   if (deleted_chat.status !== 404) {
  //     this.server.emit('listener');
  //   }
  // }

  @ApiOperation({ summary: 'Delete user by ID' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @ConnectedSocket() client: Socket) {
    const chat = await this.chatService.delete(id);
    client.emit('created');
    return chat;
  }
}
