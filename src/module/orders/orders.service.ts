import { Injectable } from '@nestjs/common';
import { Order } from './schema/order.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateOrderDto } from './dto/create-order.dto';

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
}

