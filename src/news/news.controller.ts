import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
import { NewsDto } from './dto/news.dto';
import { NewsService } from './news.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from '../pipes/image-validation.pipe';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';

@ApiTags('News')
@WebSocketGateway({ cors: { origin: '*', credentials: true } }) // cors
@Controller('news')
export class NewsController
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly newsService: NewsService,
    private readonly roleService: RoleService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    // Handle connection
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
  }

  async handleDisconnect(client: Socket) {
    const id: number = +client.handshake.query.id;
    const user: any = await this.userService.getById(id);
    const data: any = await this.roleService.userAvailable(
      id,
      false,
      user.data.current_role,
    );
    this.server.emit('disconnected', data);
  }

  @ApiOperation({ summary: 'Create a new news' })
  @Post('')
  create(@Body() newsDto: NewsDto, @Req() req: any) {
    const news = this.newsService.create(newsDto);
    return news;
  }

  @ApiOperation({ summary: 'Get all news' })
  @SubscribeMessage('getAll/news')
  async getGroupNews(
    @MessageBody()
    { newsgroup_id, page }: { newsgroup_id: number; page: number },
    @ConnectedSocket() client: Socket,
  ) {
    const news = await this.newsService.getGroupNews(newsgroup_id, page);
    client.emit('news', news);
  }

  @ApiOperation({ summary: 'Get news by ID' })
  @UseGuards(AuthGuard)
  @SubscribeMessage('getById/news')
  async findById(@MessageBody() id: string, @ConnectedSocket() client: Socket) {
    const news = await this.newsService.findById(id);
    client.emit('getById', news);
  }

  @ApiOperation({ summary: 'Update lesson profile by ID' })
  @Get('/findall')
  async findAll() {
    const news = await this.newsService.findAll(1);
    return news;
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  @Delete(':id')
  async deleteUser(@Param('id') id: number, @ConnectedSocket() client: Socket) {
    const news = await this.newsService.delete(id);
    client.emit('created');
    return news;
  }
}
