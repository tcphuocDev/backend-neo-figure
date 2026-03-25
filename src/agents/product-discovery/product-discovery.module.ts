import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductDiscoveryService } from './product-discovery.service';
import { ProductDiscoveryController } from './product-discovery.controller';
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
  controllers: [ProductDiscoveryController],
  providers: [ProductDiscoveryService],
  exports: [ProductDiscoveryService],
})
export class ProductDiscoveryModule {}
