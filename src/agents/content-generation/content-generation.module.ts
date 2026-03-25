import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentGenerationService } from './content-generation.service';
import { ContentGenerationController } from './content-generation.controller';
import {
  Product,
  ProductSchema,
} from '../../module/products/schema/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  controllers: [ContentGenerationController],
  providers: [ContentGenerationService],
  exports: [ContentGenerationService],
})
export class ContentGenerationModule {}
