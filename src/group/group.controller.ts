import { ChatGateway } from '../gateway/gateway';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Headers,
} from '@nestjs/common';
import { GroupService } from './group.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GroupDto } from './dto/group.dto';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'dgram';
import { ImageValidationPipe } from '../pipes/image-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractUserIdFromToken } from '../utils/token';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Group')
@WebSocketGateway({ cors: { origin: '*', credentials: true } }) // cors
@Controller('group')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly jwtService: JwtService,
    private readonly chatGateway: ChatGateway,
  ) { }

  @ApiOperation({ summary: 'Create a new group' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('/create')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() groupDto: GroupDto,
    @UploadedFile(new ImageValidationPipe()) file: Express.Multer.File,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.groupService.create(groupDto, user_id, file);
  }

  @ApiOperation({ summary: 'Get group by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getById/:id')
  getById(@Param('id') id: number) {
    return this.groupService.getById(id);
  }

  @ApiOperation({ summary: 'Get all groups' })
  // @UseGuards(AuthGuard)
  // @ApiBearerAuth()
  @Get('/:category_id')
  getAll(@Param('category_id') category_id: number, @Headers() headers: string) {
    console.log(headers);
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.groupService.getAll(category_id, user_id);
  }

  @ApiOperation({ summary: 'Get all groups' })
  // @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get()
  getMyGroup(@Headers() headers: string) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.groupService.getAll(0, user_id, 'my_groups');
  }

  @ApiOperation({ summary: 'Get groups with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    return this.groupService.pagination(page);
  }

  @ApiOperation({ summary: 'Update group profile by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  // @UseGuards(AuthGuard)
  @Put('/:id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: number,
    @Body() groupDto: GroupDto,
    @UploadedFile(new ImageValidationPipe()) file: Express.Multer.File,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.groupService.update(id, groupDto, file, user_id);
  }

  @ApiOperation({ summary: 'Delete group' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteGroup(@Param('id') id: number) {
    return this.groupService.delete(id);
  }
}
