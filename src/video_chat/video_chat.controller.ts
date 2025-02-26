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

  private users: Record<string, string[]> = {};  // Store users and their peer IDs

  // Called when the gateway is initialized
  afterInit(server: Server) {
    console.log('WebSocket Gateway Initialized');
  }

  // Handle incoming connections
  handleConnection(socket: Socket) {
    console.log('User connected:', socket.id);
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', userId);

      // Roomdan chiqish
      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId);
      });
    });
  }

  // Handle disconnections
  handleDisconnect(socket: Socket) {
    console.log('User disconnected:', socket.id);
    // Remove the user from all rooms
    for (let room in this.users) {
      this.users[room] = this.users[room].filter(id => id !== socket.id);
      if (this.users[room].length === 0) {
        delete this.users[room];
      }
    }
  }
  // Handle user joining a room
  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
    if (!this.users[roomId]) {
      this.users[roomId] = [];
    }
    this.users[roomId].push(client.id);
    console.log(`User ${client.id} joined room ${roomId}`);

    // Notify others that a user has joined
    client.broadcast.to(roomId).emit('user-connected', client.id);
  }

  // Handle user sending peer ID to others in the room
  @SubscribeMessage('join-peer')
  handleJoinPeer(@MessageBody() data: { peerId: string, roomId: string }, client: Socket) {
    // Notify others in the room
    client.broadcast.to(data.roomId).emit('user-connected', data.peerId);
  }

  // Handle user leaving the room
  @SubscribeMessage('disconnect-peer')
  handleDisconnectPeer(@MessageBody() roomId: string, client: Socket) {
    this.users[roomId] = this.users[roomId].filter(id => id !== client.id);
    if (this.users[roomId].length === 0) {
      delete this.users[roomId];
    }
    // Notify others in the room
    client.broadcast.to(roomId).emit('user-disconnected', client.id);
  }

  @ApiOperation({ summary: 'Join to video chat' })
  // @UseGuards(AuthGuard)
  @Get('/join/:room')
  getById(@Param('room') room: string) {
    return this.videoChatService.joinRoom(room);
  }

  @ApiOperation({ summary: 'Create a new chat' })
  // @UseGuards(AuthGuard)
  @Post('/')
  create(
    @Body() VideoChatDto: VideoChatDto,
    @ConnectedSocket() client: Socket,
    @Req() req: any,
  ) {
    const chat = this.videoChatService.create(VideoChatDto, req.headers);
    // client.emit('getAll/created');
    return chat;
  }

  // @ApiOperation({ summary: 'Get all chats' })
  // // @UseGuards(AuthGuard)
  // @SubscribeMessage('getAll/created')
  // async created(@MessageBody() { page }: { page: number }) {
  //   const chats = await this.videoChatService.findAll(page);
  //   this.server.emit('chats', chats);
  // }

  @ApiOperation({ summary: 'Get all chats' })
  // @UseGuards(AuthGuard)
  @SubscribeMessage('getAll/join-room')
  async handleMessage(
    @MessageBody() { roomId, userId }: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(roomId, userId);
    client.join(roomId);
    // client.to(roomId).broadcast.emit("user-connected", userId);
    this.server.emit('user-connected', userId);

    // const chats = await this.videoChatService.findAll(page);
    // this.server.emit('chats', chats);
  }

  @ApiOperation({ summary: 'Get all chats' })
  // @UseGuards(AuthGuard)
  @SubscribeMessage('getAll/message')
  async sendMessage(
    @MessageBody() { message }: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(message);
    // client.join(roomId);
    // client.to(roomId).broadcast.emit("user-connected", userId);
    // this.server.emit("user-connected", userId);
    this.server.emit('createMessage', message);

    // const chats = await this.videoChatService.findAll(page);
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
    const chats = await this.videoChatService.getGroupChats(chatgroup_id, page);
    client.emit('chats', chats);
  }

  // @ApiOperation({ summary: 'Get chat by ID' })
  // @UseGuards(AuthGuard)
  // @SubscribeMessage('getById/chats')
  // async findById(@MessageBody() id: string, @ConnectedSocket() client: Socket) {
  //   const chat = await this.videoChatService.findById(id);
  //   client.emit('getById', chat);
  // }

  // @SubscribeMessage('join-room')
  // async handleJoinRoom(
  //   @MessageBody() { roomId, userId }: { roomId: string; userId: string },
  //   client: Socket,
  // ) {
  //   console.log(roomId, userId);
  //   client.join(roomId);
  //   client.broadcast.to(roomId).emit('user-connected', userId);
  // }

  // @ApiOperation({ summary: 'Update chat by ID' })
  // @UseGuards(AuthGuard)
  // @SubscribeMessage('update/chats')
  // async update(
  //   @MessageBody() { id, chat }: { id: string; chat: ChatDto },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const updated_chat = await this.videoChatService.update(id, chat);
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
    @Body() VideoChatDto: VideoChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const chat = this.videoChatService.update(id, VideoChatDto);
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
  //   const deleted_chat = await this.videoChatService.delete(id);
  //   this.server.emit('deleted', deleted_chat);
  //   if (deleted_chat.status !== 404) {
  //     this.server.emit('listener');
  //   }
  // }

  @ApiOperation({ summary: 'Delete user by ID' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @ConnectedSocket() client: Socket) {
    const chat = await this.videoChatService.delete(id);
    client.emit('created');
    return chat;
  }
}
