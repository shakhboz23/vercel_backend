import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryDto } from './dto/category.dto';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
  ) {}

  @ApiOperation({ summary: 'Create a new category' })
  @Post('/create')
  create(@Body() categoryDto: CategoryDto) {
    return this.categoryService.create(categoryDto);
  }

  @ApiOperation({ summary: 'Get category by ID' })
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

  @ApiOperation({ summary: 'Update category profile by ID' })
  @Put('/:id')
  update(@Param('id') id: number, @Body() categoryDto: CategoryDto) {
    return this.categoryService.update(id, categoryDto);
  }

  @ApiOperation({ summary: 'Delete category' })
  @Delete(':id')
  deleteCategory(@Param('id') id: number) {
    return this.categoryService.delete(id);
  }
}
