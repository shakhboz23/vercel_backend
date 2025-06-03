import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { SubCategoryService } from './subcategory.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubCategoryDto } from './dto/subcategory.dto';

@ApiTags('SubCategory')
@Controller('subCategory')
export class SubCategoryController {
  constructor(
    private readonly categoryService: SubCategoryService,
  ) {}

  @ApiOperation({ summary: 'Create a new subCategory' })
  @Post('/create')
  create(@Body() categoryDto: SubCategoryDto) {
    return this.categoryService.create(categoryDto);
  }

  @ApiOperation({ summary: 'Get subCategory by ID' })
  @Get('/getById/:id')
  getById(@Param('id') id: number) {
    return this.categoryService.getById(id);
  }

  @ApiOperation({ summary: 'Get all categorys' })
  @Get('/')
  getAll() {
    return this.categoryService.getAll();
  }

  @ApiOperation({ summary: 'Get categorys with pagination' })
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    return this.categoryService.pagination(page);
  }

  @ApiOperation({ summary: 'Update subCategory profile by ID' })
  @Put('/:id')
  update(@Param('id') id: number, @Body() categoryDto: SubCategoryDto) {
    return this.categoryService.update(id, categoryDto);
  }

  @ApiOperation({ summary: 'Delete subCategory' })
  @Delete(':id')
  deleteSubCategory(@Param('id') id: number) {
    return this.categoryService.delete(id);
  }
}
