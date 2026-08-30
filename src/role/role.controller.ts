import { JwtService } from '@nestjs/jwt';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  UseInterceptors,
  UploadedFile,
  Delete,
  Req,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from '../pipes/image-validation.pipe';
import { RoleDto } from './dto/role.dto';
import { UpdateProfileDto } from './dto/update_profile.dto';
import { UpdateDto } from './dto/update.dto';
import { RoleReytingDto } from './dto/filter_reyting';

@ApiTags('Role')
@Controller('role')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
  ) { }

  @ApiOperation({ summary: 'Registration a new role' })
  @Post('/create')
  async create(@Body() roleDto: RoleDto) {
    return this.roleService.create(roleDto);
  }

  @ApiOperation({ summary: 'Get all roles' })
  @Get('getByRole/:role')
  async getAll(
    @Param('role') role: string,
    @Param('current_role') current_role: string,
  ) {
    return this.roleService.getAll(role);
  }

  @ApiOperation({ summary: 'Get roles with pagination' })
  @Get('pagination/:page/:limit')
  pagination(@Param('page') page: number, @Param('limit') limit: number) {
    return this.roleService.pagination(page, limit);
  }

  @ApiOperation({ summary: 'Get roles with pagination' })
  @Post('reyting/:role')
  getReyting(
    @Param('role') role: string,
    @Body() roleReytingDto: RoleReytingDto,
  ) {
    return this.roleService.getReyting(role, roleReytingDto);
  }

  @ApiOperation({ summary: 'Get roles with pagination' })
  @Post('teacher_reyting/:subject_id')
  getTeacherReyting(
    @Param('subject_id') subject_id: number,
    @Body() roleReytingDto: RoleReytingDto,
  ) {
    return this.roleService.getTeacherReyting(subject_id, roleReytingDto);
  }

  @ApiOperation({ summary: 'Get roles with pagination' })
  @Get('getallstudent/:class_id')
  getAllStudent(@Param('class_id') class_id: number, @Req() request) {
    return this.roleService.getAllStudent(class_id);
  }

  @ApiOperation({ summary: 'Get role by ID' })
  @Post('/count_users')
  countUsers(@Body() users: string[]) {
    return this.roleService.countUsers(users);
  }

  @ApiOperation({ summary: 'Get role by ID' })
  @Get('/getfull/:user_id/:role')
  getByUserId(@Param('user_id') user_id: number, @Param('role') role: string) {
    return this.roleService.getByUserId(user_id, role);
  }

  @ApiOperation({ summary: 'Update user profile by ID' })
  @Put('profile/:id')
  updateProfile(@Param('id') id: string, @Body() updateDto: UpdateProfileDto) {
    return this.roleService.updateProfile(id, updateDto);
  }

  @ApiOperation({ summary: 'Update user profile by ID' })
  @Put('/update/:id')
  update(@Param('id') id: number, @Body() updateDto: UpdateDto) {
    return this.roleService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Update class profile by ID' })
  @Put('/status/:id/:role')
  async updateStatus(@Param('id') id: number, @Param('role') role: string) {
    const data = await this.roleService.updateStatus(id, role);
    return data;
  }

  @ApiOperation({ summary: 'Update profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Put('profileImage/:user_id/:role')
  @UseInterceptors(FileInterceptor('image'))
  updateProfileImage(
    @Param('user_id') user_id: number,
    @Param('role') role: string,
    @UploadedFile(new ImageValidationPipe()) image: Express.Multer.File,
  ) {
    return this.roleService.updateProfileImage(user_id, role, image);
  }

  @ApiOperation({ summary: 'Delete role by ID' })
  @Delete(':id')
  deleteRole(@Param('id') id: number) {
    return this.roleService.delete(id);
  }

  handleUserId(headers: any) {
    const auth_header = headers['authorization'];
    const token = auth_header?.split(' ')[1];
    const user = token
      ? this.jwtService.verify(token, { secret: process.env.ACCESS_TOKEN_KEY })
      : null;
    if (!user?.id) {
      throw new UnauthorizedException({
        message: 'Token topilmadi!',
        statusCode: 401,
      });
    }
    const user_id = user?.id;
    return user_id;
  }
}
