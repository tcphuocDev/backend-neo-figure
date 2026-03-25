import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schema/order.schema';
import { OrderController } from './orders.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
          { name: Order.name, schema: OrderSchema },
        ]),
  ],
  providers: [OrdersService],
  controllers: [OrderController]
})
export class OrdersModule {}
