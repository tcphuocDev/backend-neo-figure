import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private service: OrdersService) {}

  @Post()
  create(@Body() body: CreateOrderDto) {
    return this.service.create(body);
  }

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.findById(id);
  }
}

