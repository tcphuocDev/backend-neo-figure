import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  getAll(@Query() query: QueryProductDto) {
    return this.service.findAll(query);
  }

  @Get('featured')
  getFeatured(@Query('limit') limit?: number) {
    return this.service.findFeatured(limit);
  }

  @Get('hot')
  getHot(@Query('limit') limit?: number) {
    return this.service.findHot(limit);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get(':id/related')
  getRelated(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.service.findRelated(id, limit);
  }

  @Post()
  create(@Body() body: CreateProductDto) {
    return this.service.create(body);
  }
}

