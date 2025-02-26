import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityDto } from './dto/activity.dto';
import { GetActivityDto } from './dto/get_activity.dto';

@ApiTags('Activity')
@Controller('activity')
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
  ) {}

  @ApiOperation({ summary: 'Registration a new user' })
  @Post('register')
  async register(
    @Body() activityDto: ActivityDto,
  ) {
    const data = await this.activityService.create(activityDto);
    return data;
  }

  // @ApiOperation({ summary: 'Registration a new user' })
  // @Post('register/teacher')
  // registerteacher(
  //   @Body() teacherDto: TeacherDto,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   return this.activityService.register(TeacherDto);
  // }

  // @ApiOperation({ summary: 'Registration a new user' })
  // @Post('register/methodological')
  // registerteacher(
  //   @Body() teacherDto: TeacherDto,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   return this.activityService.register(TeacherDto);
  // }

  // @ApiOperation({ summary: 'Verify login user' })
  // @Post('verifyLogin')
  // verifLogin(
  //   @Body() verifyOtpDto: VerifyOtpDto,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   return this.activityService.verifyLogin(verifyOtpDto, res);
  // }

  @ApiOperation({ summary: 'Get all users' })
  // @UseGuards(AuthGuard)
  @Get('getByRole')
  getAll() {
    return this.activityService.getAll();
  }

  @ApiOperation({ summary: 'Get user reytings' })
  @Post('/getactivity')
  getActivity(@Body() getActivityDto: GetActivityDto) {
    return this.activityService.getActivity(getActivityDto);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  // @UseGuards(AuthGuard)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.activityService.getById(id);
  }

  @ApiOperation({ summary: 'Get users with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page/:limit')
  pagination(@Param('page') page: number, @Param('limit') limit: number) {
    return this.activityService.pagination(page, limit);
  }

  // @ApiOperation({ summary: 'New password of user' })
  // // @UseGuards(AuthGuard)
  // @Put('newPassword/:id')
  // newPassword(@Param('id') id: string, @Body() newPasswordDto: NewPasswordDto) {
  //   return this.activityService.newPassword(id, newPasswordDto);
  // }

  // @ApiOperation({ summary: 'Forgot password for user' })
  // // @UseGuards(AuthGuard)
  // @Put('forgotPassword/:id')
  // forgotPassword(
  //   @Param('id') id: string,
  //   @Body() forgotPasswordDto: ForgotPasswordDto,
  // ) {
  //   return this.activityService.forgotPassword(id, forgotPasswordDto);
  // }

  // @ApiOperation({ summary: 'Update user profile by ID' })
  // // @UseGuards(AuthGuard)
  // @Put('profile/:id')
  // update(@Param('id') id: string, @Body() updateDto: UpdateDto) {
  //   return this.activityService.update(id, updateDto);
  // }

  // create_app(
  //   @Body() chatDto: ChatDto,
  //   @UploadedFile(new ImageValidationPipe()) file: Express.Multer.File,
  // ) {
  //   return this.chatService.create(chatDto, file);
  // }

  // @ApiOperation({ summary: 'Update profile image' })
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       image: {
  //         type: 'string',
  //         format: 'binary',
  //       },
  //     },
  //   },
  // })
  // // @UseGuards(AuthGuard)
  // @Put('profileImage/:id')
  // @UseInterceptors(FileInterceptor('image'))
  // updateProfileImage(
  //   @Param('id') id: string,
  //   @UploadedFile(new ImageValidationPipe()) image: Express.Multer.File,
  // ) {
  //   return this.activityService.updateProfileImage(id, image);
  // }

  @ApiOperation({ summary: 'Delete user by ID' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.activityService.deleteUser(id);
  }

  // @ApiOperation({ summary: 'Get orders with pagination' })
  // @Get('orders/pagination/:page/:limit')
  // orderPagination(@Param('page') page: number, @Param('limit') limit: number) {
  //   return this.orderService.pagination(page, limit);
  // }
}
