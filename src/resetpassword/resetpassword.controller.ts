import { JwtService } from '@nestjs/jwt';
import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ResetpasswordService } from './resetpassword.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResetpasswordDto } from './dto/resetpassword.dto';

@ApiTags('Resetpassword')
@Controller('resetpassword')
export class ResetpasswordController {
  constructor(
    private readonly resetpasswordService: ResetpasswordService,
    private readonly jwtService: JwtService,
  ) {}

  @ApiOperation({ summary: 'Create an activate link' })
  @Post('/create')
  create(@Body() resetpasswordDto: ResetpasswordDto) {
    return this.resetpasswordService.create(resetpasswordDto);
  }

  @ApiOperation({ summary: 'Get resetpassword by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getById/:id')
  getById(@Param('id') id: number) {
    return this.resetpasswordService.getById(id);
  }

  @ApiOperation({ summary: 'Get all resetpasswords' })
  // @UseGuards(AuthGuard)
  @Get('/getAll')
  getAll() {
    return this.resetpasswordService.getAll();
  }

  @ApiOperation({ summary: 'Delete resetpassword' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteResetpassword(@Param('id') id: number) {
    return this.resetpasswordService.delete(id);
  }
}
