import { Injectable, NotFoundException } from '@nestjs/common';
import { Order } from './schema/order.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private model: Model<Order>) {}

  create(data: CreateOrderDto) {
    return this.model.create(data);
  }

  findAll() {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  async updateStatus(id: string, data: UpdateOrderStatusDto) {
    const order = await this.model.findByIdAndUpdate(
      id,
      { status: data.status },
      { new: true },
    );
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async delete(id: string) {
    const order = await this.model.findByIdAndDelete(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return { message: 'Order deleted successfully', order };
  }
}

