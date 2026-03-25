import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CrawlerService } from './crawler.service';
import { CrawlerController } from './crawler.controller';
import {
  Product,
  ProductSchema,
} from '../module/products/schema/product.schema';
import {
  Category,
  CategorySchema,
} from '../module/categories/schema/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [CrawlerController],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
