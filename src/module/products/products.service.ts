import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schema/product.schema';
import { Category } from '../categories/schema/category.schema';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private model: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  create(data: CreateProductDto) {
    return this.model.create(data);
  }

  async findAll(query: QueryProductDto) {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'newest',
      search,
      isHot,
      isFeatured,
    } = query;

    const filter: any = {};

    // Category filter
    if (category) {
      const categoryDoc = await this.categoryModel.findOne({ slug: category });
      if (categoryDoc) {
        filter.categoryId = categoryDoc._id;
      } else {
        // If category not found, return empty result
        filter.categoryId = null;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { character: { $regex: search, $options: 'i' } },
        { series: { $regex: search, $options: 'i' } },
      ];
    }

    // Hot/Featured filters
    if (isHot === true) {
      filter.isHot = true;
    }
    if (isFeatured === true) {
      filter.isFeatured = true;
    }

    // Sorting
    let sort: any = {};
    switch (sortBy) {
      case 'price_asc':
        sort = { price: 1 };
        break;
      case 'price_desc':
        sort = { price: -1 };
        break;
      case 'popular':
        sort = { soldCount: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('categoryId', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  findById(id: string) {
    return this.model.findById(id).populate('categoryId', 'name slug');
  }

  async findRelated(productId: string, limit = 6) {
    const product = await this.model.findById(productId);
    if (!product) return [];

    return this.model
      .find({
        _id: { $ne: productId },
        categoryId: product.categoryId,
      })
      .limit(limit)
      .exec();
  }

  findFeatured(limit = 6) {
    return this.model.find({ isFeatured: true }).limit(limit).exec();
  }

  findHot(limit = 10) {
    return this.model.find({ isHot: true }).limit(limit).exec();
  }
}
