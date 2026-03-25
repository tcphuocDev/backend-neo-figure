import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoryService) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post()
  create(@Body() body: CreateCategoryDto) {
    return this.service.create(body);
  }
}

