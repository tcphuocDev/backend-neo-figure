import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { Product } from '../module/products/schema/product.schema';
import { Category } from '../module/categories/schema/category.schema';
const pLimit = require('p-limit');

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private BASE_URL = 'https://danfigure.vn/wp-json/wc/store/products';

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async fetchProducts(page: number, perPage = 20) {
    const { data } = await axios.get(this.BASE_URL, {
      params: { page, per_page: perPage },
    });
    return data;
  }

  async uploadImage(imageUrl: string, folder: string) {
    try {
      return await cloudinary.uploader.upload(imageUrl, {
        folder,
        transformation: [{ width: 1000, crop: 'limit', quality: 'auto' }],
      });
    } catch (error) {
      this.logger.error(`Failed to upload ${imageUrl}: ${error.message}`);
      return null;
    }
  }

  async findOrCreateCategory(categoryData: any) {
    if (!categoryData) {
      // Default category
      let category = await this.categoryModel.findOne({
        slug: 'uncategorized',
      });
      if (!category) {
        category = await this.categoryModel.create({
          name: 'Uncategorized',
          slug: 'uncategorized',
        });
      }
      return category;
    }

    let category = await this.categoryModel.findOne({
      slug: categoryData.slug,
    });

    if (!category) {
      this.logger.log(`Creating category: ${categoryData.name}`);
      category = await this.categoryModel.create({
        name: categoryData.name,
        slug: categoryData.slug,
      });
    }

    return category;
  }

  stripHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .trim();
  }

  async processProduct(apiProduct: any) {
    try {
      const categorySlug = apiProduct.categories?.[0]?.slug || 'uncategorized';
      const folder = `neo-figure/${categorySlug}/${apiProduct.slug}`;

      // Check if product already exists
      const existingProduct = await this.productModel.findOne({
        slug: apiProduct.slug,
      });

      if (existingProduct) {
        this.logger.log(
          `Product ${apiProduct.slug} already exists, skipping...`,
        );
        return existingProduct;
      }

      // Find or create category
      const category = await this.findOrCreateCategory(
        apiProduct.categories?.[0],
      );

      // Upload images to Cloudinary
      const limit = pLimit(3);
      const imageUploads = apiProduct.images.map((img) =>
        limit(() => this.uploadImage(img.src, folder)),
      );

      const uploadResults = await Promise.all(imageUploads);
      const cloudinaryUrls = uploadResults
        .filter((r) => r !== null)
        .map((r) => r.secure_url);

      if (cloudinaryUrls.length === 0) {
        this.logger.warn(`No images uploaded for ${apiProduct.slug}`);
        return null;
      }

      // Map API data to Product schema
      const productData = {
        name: this.stripHtml(apiProduct.name),
        slug: apiProduct.slug,
        sku: apiProduct.sku || `SKU-${apiProduct.id}`,
        price: parseFloat(apiProduct.prices.price) || 0,
        originalPrice: parseFloat(apiProduct.prices.regular_price) || 0,
        isOnSale: apiProduct.on_sale || false,
        thumbnail: cloudinaryUrls[0],
        images: cloudinaryUrls,
        categoryId: category._id,
        stock: apiProduct.is_in_stock ? 100 : 0,
        inStock: apiProduct.is_in_stock,
        rating: parseFloat(apiProduct.average_rating) || 5,
        reviewCount: apiProduct.review_count || 0,
        soldCount: 0,
        shortDescription: this.stripHtml(apiProduct.short_description),
        description: this.stripHtml(apiProduct.description),
        tags: apiProduct.tags?.map((t) => t.name) || [],
        isHot: false,
        isFeatured: false,
      };

      // Create product
      const product = await this.productModel.create(productData);
      this.logger.log(`✓ Created product: ${product.name}`);

      return product;
    } catch (error) {
      this.logger.error(
        `Error processing product ${apiProduct.slug}: ${error.message}`,
      );
      return null;
    }
  }

  async crawlBatch(page: number) {
    const products = await this.fetchProducts(page);
    const results = [];

    for (const product of products) {
      const result = await this.processProduct(product);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  async crawlAllProducts() {
    let page = 1;
    let totalCreated = 0;
    let totalSkipped = 0;

    while (true) {
      const apiProducts = await this.fetchProducts(page);

      if (!apiProducts || apiProducts.length === 0) break;

      this.logger.log(
        `📦 Crawling page ${page} (${apiProducts.length} products)`,
      );

      for (const apiProduct of apiProducts) {
        const result = await this.processProduct(apiProduct);
        if (result) {
          totalCreated++;
        } else {
          totalSkipped++;
        }
      }

      page++;

      // tránh bị block
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return {
      totalCreated,
      totalSkipped,
      totalPages: page - 1,
    };
  }

  async crawlWithPagination(maxPages = 5) {
    let totalCreated = 0;
    let totalSkipped = 0;

    for (let page = 1; page <= maxPages; page++) {
      this.logger.log(`📦 Crawling page ${page}/${maxPages}`);
      const batch = await this.crawlBatch(page);

      totalCreated += batch.length;

      // tránh bị block
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return {
      totalCreated,
      totalSkipped,
      totalPages: maxPages,
    };
  }

  // Cron job chạy mỗi 12h đêm (00:00)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduledCrawl() {
    this.logger.log('🕐 Starting scheduled crawl at midnight...');
    try {
      const result = await this.crawlAllProducts();
      this.logger.log(`✅ Scheduled crawl completed: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error(`❌ Scheduled crawl failed: ${error.message}`);
    }
  }
}
