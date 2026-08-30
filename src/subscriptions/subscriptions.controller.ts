import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Headers,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionsDto } from './dto/subscriptions.dto';
import { JwtService } from '@nestjs/jwt';
import { ImageValidationPipe } from '../pipes/image-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractUserIdFromToken } from 'src/utils/token';
import { CreateSubscriptionsDto } from './dto/create_subscriptions.dto';
import { CopySubscriptionsDto } from './dto/copy_subscriptions.dto';
import { Response } from 'express';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly jwtService: JwtService,
  ) { }

  @ApiOperation({ summary: 'Create a new subscriptions' })
  @Post('/create')
  async create(
    @Body() subscriptionsDto: SubscriptionsDto,
    @Headers() headers?: string,
  ) {
    console.log(headers);
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.subscriptionsService.create(subscriptionsDto, user_id);
  }

  @ApiOperation({ summary: 'Create a new subscriptions' })
  @Post('/createSubscription')
  async CreateSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionsDto,
    @Headers() headers?: string,
  ) {
    console.log(headers);
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.subscriptionsService.createSubscription(
      createSubscriptionDto,
      user_id,
    );
  }

  @ApiOperation({
    summary:
      "Copy every student (or a chosen subset) from one course into another",
  })
  @Post('/copyFromCourse')
  async copyFromCourse(@Body() copySubscriptionsDto: CopySubscriptionsDto) {
    return this.subscriptionsService.copyFromCourse(copySubscriptionsDto);
  }

  @ApiOperation({ summary: 'Get subscriptions by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getById/:id')
  getById(@Param('id') id: number) {
    return this.subscriptionsService.getById(id);
  }

  @ApiOperation({ summary: 'Get all subscriptionss' })
  // @UseGuards(AuthGuard)
  @Get('/')
  getAll(@Headers() headers?: string) {
    return this.subscriptionsService.getAll();
  }

  @ApiOperation({ summary: 'Get all subscriptionss' })
  // @UseGuards(AuthGuard)
  @Get('/getByUserId')
  getByUserId(@Headers() headers?: string) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.subscriptionsService.getByUserId(user_id);
  }

  @ApiOperation({ summary: 'Get subscriptionss with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    return this.subscriptionsService.pagination(page);
  }

  @ApiOperation({ summary: 'Update subscriptions profile by ID' })
  // @UseGuards(AuthGuard)
  @Put('/:id')
  update(@Param('id') id: number, @Body() subscriptionsDto: SubscriptionsDto) {
    return this.subscriptionsService.update(id, subscriptionsDto);
  }

  @ApiOperation({ summary: 'Delete subscription' })
  // @UseGuards(AuthGuard)
  @Delete('/deleteSubscription/:course_id/:user_id')
  deleteSubscription(
    @Param('course_id') course_id: number,
    @Param('user_id') user_id: number,
  ) {
    return this.subscriptionsService.delete(user_id, course_id);
  }
}
