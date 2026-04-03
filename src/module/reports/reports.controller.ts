import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.service.getDashboardStats();
  }

  @Get('revenue')
  getRevenue(@Query('period') period: string = '7d') {
    return this.service.getRevenue(period);
  }

  @Get('orders-stats')
  getOrdersStats(@Query('period') period: string = '7d') {
    return this.service.getOrdersStats(period);
  }

  @Get('top-products')
  getTopProducts(@Query('limit') limit: number = 10) {
    return this.service.getTopProducts(limit);
  }
}
