import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../products/schema/product.schema';
import { Order } from '../orders/schema/order.schema';
import { Category } from '../categories/schema/category.schema';
import { User } from '../users/schema/user.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getDashboardStats() {
    const [totalProducts, totalOrders, totalCategories, totalUsers, orders] =
      await Promise.all([
        this.productModel.countDocuments(),
        this.orderModel.countDocuments(),
        this.categoryModel.countDocuments(),
        this.userModel.countDocuments(),
        this.orderModel.find(),
      ]);

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    const lowStockProducts = await this.productModel.countDocuments({
      stock: { $lte: 10, $gt: 0 },
    });

    const outOfStockProducts = await this.productModel.countDocuments({
      stock: 0,
    });

    return {
      totalProducts,
      totalOrders,
      totalRevenue,
      totalCategories,
      totalUsers,
      lowStockProducts,
      outOfStockProducts,
    };
  }

  async getRevenue(period: string = '7d') {
    const days = parseInt(period) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.orderModel.find({
      createdAt: { $gte: startDate },
    });

    // Group by day
    const revenueByDay = {};
    orders.forEach((order) => {
      const day = order.createdAt.toISOString().split('T')[0];
      if (!revenueByDay[day]) {
        revenueByDay[day] = 0;
      }
      revenueByDay[day] += order.totalPrice;
    });

    return Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }

  async getOrdersStats(period: string = '7d') {
    const days = parseInt(period) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.orderModel.find({
      createdAt: { $gte: startDate },
    });

    // Group by day
    const ordersByDay = {};
    orders.forEach((order) => {
      const day = order.createdAt.toISOString().split('T')[0];
      if (!ordersByDay[day]) {
        ordersByDay[day] = 0;
      }
      ordersByDay[day]++;
    });

    return Object.entries(ordersByDay).map(([date, count]) => ({
      date,
      count,
    }));
  }

  async getTopProducts(limit: number = 10) {
    return this.productModel
      .find()
      .sort({ soldCount: -1 })
      .limit(limit)
      .populate('categoryId', 'name')
      .exec();
  }
}
