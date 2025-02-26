import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatGroupDto } from './dto/chat_group.dto';
import { ChatGroupService } from './chat_group.service';
import { UserService } from '../user/user.service';

@ApiTags('ChatGroup')
@Controller('chatgroup')
export class ChatGroupController {
  constructor(
    private readonly chatGroupService: ChatGroupService,
  ) { }

  @ApiOperation({ summary: 'Create a new chat group' })
  @Post('/create')
  create(@Body() chatGroupDto: ChatGroupDto) {
    return this.chatGroupService.create(chatGroupDto);
  }

  @ApiOperation({ summary: 'Get chat group by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getByGroupId/:group_id')
  getByGroupId(@Param('group_id') group_id: number) {
    return this.chatGroupService.getById(group_id);
  }

  @ApiOperation({ summary: 'Get chat group by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getMessages/:id')
  getMessages(@Param('id') id: number) {
    return this.chatGroupService.getMessages(id);
  }

  @ApiOperation({ summary: 'Get chat group by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getById/:id')
  getById(@Param('id') id: number) {
    return this.chatGroupService.getById(id);
  }

  @ApiOperation({ summary: 'Get all chat group' })
  // @UseGuards(AuthGuard)
  @Get()
  getAll(
  ) {
    return this.chatGroupService.getAll();
  }


  @ApiOperation({ summary: 'Get chat group with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    return this.chatGroupService.pagination(page);
  }

  @ApiOperation({ summary: 'Update chat group profile by ID' })
  // @UseGuards(AuthGuard)
  @Put('/:id')
  update(@Param('id') id: number, @Body() chatGroupDto: ChatGroupDto) {
    return this.chatGroupService.update(id, chatGroupDto);
  }

  @ApiOperation({ summary: 'Delete chat group' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.chatGroupService.delete(id);
  }
}
