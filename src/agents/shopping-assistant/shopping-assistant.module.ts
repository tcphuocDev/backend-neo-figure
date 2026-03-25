import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShoppingAssistantService } from './shopping-assistant.service';
import { ShoppingAssistantController } from './shopping-assistant.controller';
import {
  Product,
  ProductSchema,
} from '../../module/products/schema/product.schema';
import {
  Category,
  CategorySchema,
} from '../../module/categories/schema/category.schema';
import { Order, OrderSchema } from '../../module/orders/schema/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [ShoppingAssistantController],
  providers: [ShoppingAssistantService],
  exports: [ShoppingAssistantService],
})
export class ShoppingAssistantModule {}
