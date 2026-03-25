import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataEnrichmentService } from './data-enrichment.service';
import { DataEnrichmentController } from './data-enrichment.controller';
import {
  Product,
  ProductSchema,
} from '../../module/products/schema/product.schema';
import {
  Category,
  CategorySchema,
} from '../../module/categories/schema/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [DataEnrichmentController],
  providers: [DataEnrichmentService],
  exports: [DataEnrichmentService],
})
export class DataEnrichmentModule {}
