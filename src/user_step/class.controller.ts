import { ChatGateway } from './../gateway/gateway';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { UserStepService } from './class.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserStepDto } from './dto/class.dto';
import {
  WebSocketGateway,
} from '@nestjs/websockets';

@ApiTags('User step')
@WebSocketGateway({ cors: { origin: '*', credentials: true } }) // cors
@Controller('user_step')
export class UserStepController {
  constructor(
    private readonly classService: UserStepService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @ApiOperation({ summary: 'Create a new class' })
  @Post('/create')
  async create(@Body() userStepDto: UserStepDto) {
    const data = await this.classService.create(userStepDto);
    this.chatGateway.server.emit('request', {
      type: 'request',
      data,
    });
    return data;
  }

  @ApiOperation({ summary: 'Get all classs' })
  // @UseGuards(AuthGuard)
  @Get()
  getAll() {
    return this.classService.getAll();
  }

  @ApiOperation({ summary: 'get step by ID' })
  // @UseGuards(AuthGuard)
  @Get('/:id')
  getById(@Param('id') id: number) {
    return this.classService.getById(id);
  }

  @ApiOperation({ summary: 'Get classs with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    return this.classService.pagination(page);
  }

  @ApiOperation({ summary: 'Update class profile by ID' })
  // @UseGuards(AuthGuard)
  @Put('/:id')
  update(@Param('id') id: number, @Body() userStepDto: UserStepDto) {
    return this.classService.update(id, userStepDto);
  }

  @ApiOperation({ summary: 'Delete user step' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteClass(@Param('id') id: number) {
    return this.classService.delete(id);
  }
}
