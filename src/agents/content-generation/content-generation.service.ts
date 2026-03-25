import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../../module/products/schema/product.schema';

export interface ContentGenerationRequest {
  productId?: string;
  type: 'description' | 'short_description' | 'seo_meta' | 'email' | 'social';
  context?: any;
}

export interface GeneratedContent {
  type: string;
  content: string;
  metadata?: any;
  suggestions?: string[];
}

@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  /**
   * Generate product description
   */
  async generateDescription(productId: string): Promise<GeneratedContent> {
    const product = await this.productModel
      .findById(productId)
      .populate('categoryId', 'name')
      .exec();

    if (!product) {
      throw new Error('Product not found');
    }

    this.logger.log(`Generating description for: ${product.name}`);

    let description = '';

    // Opening - product introduction
    description += this.generateOpening(product);
    description += '\n\n';

    // Key features
    description += this.generateKeyFeatures(product);
    description += '\n\n';

    // Specifications
    description += this.generateSpecifications(product);
    description += '\n\n';

    // Call to action
    description += this.generateCallToAction(product);

    return {
      type: 'description',
      content: description,
      suggestions: [
        'Thêm thông tin về chất liệu',
        'Bổ sung hướng dẫn lắp ráp',
        'Thêm điểm nổi bật so với phiên bản cũ',
      ],
    };
  }

  /**
   * Generate short description (for product cards)
   */
  async generateShortDescription(productId: string): Promise<GeneratedContent> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new Error('Product not found');
    }

    let shortDesc = '';

    // Highlight key selling points in 1-2 sentences
    if (product.brand && product.series) {
      shortDesc = `Mô hình ${product.brand} chính hãng từ series ${product.series}. `;
    } else if (product.brand) {
      shortDesc = `Mô hình ${product.brand} chính hãng. `;
    }

    // Add scale/size if available
    if (product.scale) {
      shortDesc += `Tỷ lệ ${product.scale}. `;
    } else if (product.height) {
      shortDesc += `Cao ${product.height}. `;
    }

    // Add material
    if (product.material) {
      shortDesc += `Chất liệu ${product.material}. `;
    }

    // Add special features
    if (product.isHot) {
      shortDesc += '🔥 Đang giảm giá HOT!';
    } else if (product.rating >= 4.5) {
      shortDesc += `⭐ Đánh giá ${product.rating}/5 - Sản phẩm ưa chuộng!`;
    }

    return {
      type: 'short_description',
      content: shortDesc.trim(),
    };
  }

  /**
   * Generate SEO metadata
   */
  async generateSEOMetadata(productId: string): Promise<GeneratedContent> {
    const product = await this.productModel
      .findById(productId)
      .populate('categoryId', 'name')
      .exec();

    if (!product) {
      throw new Error('Product not found');
    }

    const metadata = {
      title: this.generateSEOTitle(product),
      description: this.generateSEODescription(product),
      keywords: this.generateSEOKeywords(product),
      ogTitle: this.generateOGTitle(product),
      ogDescription: this.generateOGDescription(product),
    };

    return {
      type: 'seo_meta',
      content: JSON.stringify(metadata, null, 2),
      metadata,
    };
  }

  /**
   * Generate email marketing content
   */
  async generateEmailContent(productId: string): Promise<GeneratedContent> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new Error('Product not found');
    }

    let emailHtml = '';

    // Subject line
    const subject = this.generateEmailSubject(product);

    // Email body
    emailHtml += `<h2>🎉 ${product.name}</h2>\n\n`;

    if (product.isOnSale && product.originalPrice) {
      const discount = Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      );
      emailHtml += `<div style="background: #ff003c; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <h3 style="margin: 0;">🔥 GIẢM GIÁ ${discount}%</h3>
  <p style="font-size: 24px; margin: 10px 0;">
    <span style="text-decoration: line-through;">${this.formatPrice(product.originalPrice)}</span>
    <strong style="color: #00f5ff;"> ${this.formatPrice(product.price)}</strong>
  </p>
  <p style="margin: 0;">Tiết kiệm: ${this.formatPrice(product.originalPrice - product.price)}</p>
</div>\n\n`;
    }

    emailHtml += `<img src="${product.thumbnail}" alt="${product.name}" style="max-width: 100%; border-radius: 8px;" />\n\n`;

    emailHtml += `<h3>✨ Điểm nổi bật:</h3>\n`;
    emailHtml += `<ul>\n`;
    if (product.brand)
      emailHtml += `  <li>Thương hiệu: <strong>${product.brand}</strong></li>\n`;
    if (product.series)
      emailHtml += `  <li>Series: <strong>${product.series}</strong></li>\n`;
    if (product.scale)
      emailHtml += `  <li>Tỷ lệ: <strong>${product.scale}</strong></li>\n`;
    if (product.material)
      emailHtml += `  <li>Chất liệu: <strong>${product.material}</strong></li>\n`;
    emailHtml += `  <li>Đánh giá: <strong>⭐ ${product.rating}/5</strong> (${product.reviewCount} reviews)</li>\n`;
    emailHtml += `</ul>\n\n`;

    emailHtml += `<div style="text-align: center; margin: 30px 0;">
  <a href="/products/${product.slug}" style="background: #00f5ff; color: #0a0a0a; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
    MUA NGAY 🛒
  </a>
</div>\n\n`;

    return {
      type: 'email',
      content: emailHtml,
      metadata: {
        subject,
        preheader: this.generateEmailPreheader(product),
      },
    };
  }

  /**
   * Generate social media content
   */
  async generateSocialContent(
    productId: string,
    platform: 'facebook' | 'instagram' | 'twitter',
  ): Promise<GeneratedContent> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new Error('Product not found');
    }

    let content = '';

    switch (platform) {
      case 'facebook':
        content = this.generateFacebookPost(product);
        break;
      case 'instagram':
        content = this.generateInstagramCaption(product);
        break;
      case 'twitter':
        content = this.generateTweet(product);
        break;
    }

    return {
      type: 'social',
      content,
      metadata: {
        platform,
        hashtags: this.generateHashtags(product),
      },
    };
  }

  /**
   * Private helper methods
   */
  private generateOpening(product: any): string {
    let opening = '';

    if (product.brand && product.series && product.character) {
      opening = `Giới thiệu mô hình ${product.character} từ series ${product.series} được sản xuất bởi ${product.brand} - thương hiệu hàng đầu trong lĩnh vực collectibles.`;
    } else if (product.brand && product.series) {
      opening = `Mô hình ${product.name} là sản phẩm chất lượng cao từ ${product.brand}, thuộc series nổi tiếng ${product.series}.`;
    } else {
      opening = `Khám phá ${product.name} - một tác phẩm nghệ thuật đáng sở hữu cho bộ sưu tập của bạn.`;
    }

    return opening;
  }

  private generateKeyFeatures(product: any): string {
    let features = '**Đặc điểm nổi bật:**\n\n';
    const points = [];

    if (product.scale) {
      points.push(
        `🎯 **Tỷ lệ ${product.scale}** - Kích thước chi tiết, phù hợp trưng bày`,
      );
    }

    if (product.material) {
      points.push(`🛠️ **Chất liệu ${product.material}** - Bền đẹp, an toàn`);
    }

    if (product.height) {
      points.push(`📏 **Chiều cao ${product.height}** - Kích thước ấn tượng`);
    }

    if (product.brand) {
      points.push(
        `✅ **${product.brand} chính hãng** - 100% authentic, có tem & hộp`,
      );
    }

    if (product.rating >= 4.5) {
      points.push(
        `⭐ **Đánh giá ${product.rating}/5** - Được ${product.reviewCount} khách hàng tin tưởng`,
      );
    }

    if (product.isHot) {
      points.push(`🔥 **SALE HOT** - Giảm giá đặc biệt, số lượng có hạn`);
    }

    features += points.map((p) => `- ${p}`).join('\n');

    return features;
  }

  private generateSpecifications(product: any): string {
    let specs = '**Thông số kỹ thuật:**\n\n';
    const specList = [];

    if (product.brand) specList.push(`- Thương hiệu: ${product.brand}`);
    if (product.series) specList.push(`- Series: ${product.series}`);
    if (product.character) specList.push(`- Nhân vật: ${product.character}`);
    if (product.scale) specList.push(`- Tỷ lệ: ${product.scale}`);
    if (product.height) specList.push(`- Chiều cao: ${product.height}`);
    if (product.material) specList.push(`- Chất liệu: ${product.material}`);
    if (product.sku) specList.push(`- Mã sản phẩm: ${product.sku}`);

    specs += specList.join('\n');

    return specs;
  }

  private generateCallToAction(product: any): string {
    if (product.stock < 10 && product.stock > 0) {
      return `⚠️ **Chỉ còn ${product.stock} sản phẩm** - Đặt hàng ngay để không bỏ lỡ!\n\n🛒 Thêm vào giỏ hàng và thanh toán nhanh chóng. Ship COD toàn quốc!`;
    }

    if (product.isHot) {
      return `🔥 **Ưu đãi có thời hạn** - Mua ngay hôm nay để nhận giá tốt nhất!\n\n🛒 Giao hàng nhanh toàn quốc. Hỗ trợ COD.`;
    }

    return `📦 **Sẵn hàng - Giao ngay** \n\n🛒 Đặt hàng dễ dàng, thanh toán linh hoạt. Free ship cho đơn từ 500k!`;
  }

  private generateSEOTitle(product: any): string {
    let title = product.name;

    if (product.brand) {
      title += ` - ${product.brand}`;
    }

    if (product.scale) {
      title += ` ${product.scale}`;
    }

    title += ' | NEO FIGURE';

    // SEO title should be 50-60 characters
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    }

    return title;
  }

  private generateSEODescription(product: any): string {
    let desc = `Mua ${product.name} `;

    if (product.brand) {
      desc += `${product.brand} chính hãng `;
    }

    desc += `giá tốt tại NEO FIGURE. `;

    if (product.isOnSale) {
      desc += `🔥 Đang giảm giá. `;
    }

    desc += `✅ Giao hàng nhanh. ⭐ ${product.rating}/5 sao.`;

    // SEO description should be 150-160 characters
    if (desc.length > 160) {
      desc = desc.substring(0, 157) + '...';
    }

    return desc;
  }

  private generateSEOKeywords(product: any): string {
    const keywords = [];

    keywords.push(product.name);
    if (product.brand) keywords.push(product.brand);
    if (product.series) keywords.push(product.series);
    if (product.character) keywords.push(product.character);
    if (product.categoryId?.name) keywords.push(product.categoryId.name);

    keywords.push('mô hình', 'figure', 'collectible', 'chính hãng');

    if (product.tags) {
      keywords.push(...product.tags.slice(0, 3));
    }

    return keywords.join(', ');
  }

  private generateOGTitle(product: any): string {
    return product.isOnSale
      ? `🔥 ${product.name} - GIẢM GIÁ ĐẶC BIỆT!`
      : product.name;
  }

  private generateOGDescription(product: any): string {
    let desc = '';

    if (product.isOnSale && product.originalPrice) {
      const discount = Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      );
      desc = `Giảm ${discount}%! Chỉ còn ${this.formatPrice(product.price)}. `;
    } else {
      desc = `Giá: ${this.formatPrice(product.price)}. `;
    }

    desc += `⭐ ${product.rating}/5 (${product.reviewCount} reviews). `;
    desc += product.inStock ? '📦 Còn hàng - Giao ngay!' : '⏳ Sắp về hàng';

    return desc;
  }

  private generateEmailSubject(product: any): string {
    if (product.isOnSale && product.originalPrice) {
      const discount = Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      );
      return `🔥 SALE ${discount}%: ${product.name}`;
    }

    if (product.isFeatured) {
      return `✨ Hàng mới về: ${product.name}`;
    }

    return `📦 ${product.name} - Đặt ngay hôm nay!`;
  }

  private generateEmailPreheader(product: any): string {
    return `${this.formatPrice(product.price)} - ${product.inStock ? 'Còn hàng' : 'Sắp về'} - ⭐ ${product.rating}/5`;
  }

  private generateFacebookPost(product: any): string {
    let post = '';

    if (product.isOnSale && product.originalPrice) {
      const discount = Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      );
      post += `🔥🔥 FLASH SALE ${discount}% 🔥🔥\n\n`;
    }

    post += `📦 ${product.name}\n\n`;

    if (product.brand) post += `👉 Thương hiệu: ${product.brand}\n`;
    if (product.series) post += `👉 Series: ${product.series}\n`;

    post += `👉 Giá: ${this.formatPrice(product.price)}`;
    if (product.isOnSale && product.originalPrice) {
      post += ` (Giá gốc: ${this.formatPrice(product.originalPrice)})`;
    }
    post += `\n`;

    post += `👉 Đánh giá: ⭐ ${product.rating}/5\n\n`;

    post += `💬 Inbox hoặc comment "MUA" để đặt hàng ngay!\n`;
    post += `📞 Hotline: 1900 xxxx\n`;
    post += `🌐 Website: neofigure.vn\n\n`;

    post += this.generateHashtags(product).join(' ');

    return post;
  }

  private generateInstagramCaption(product: any): string {
    let caption = '';

    if (product.isHot) {
      caption += `🔥 HOT DEAL ALERT 🔥\n\n`;
    }

    caption += `${product.name} ✨\n\n`;

    if (product.character) {
      caption += `Người hâm mộ ${product.character} không thể bỏ lỡ! 😍\n\n`;
    }

    caption += `💰 ${this.formatPrice(product.price)}\n`;
    caption += `⭐ ${product.rating}/5 - Đánh giá tuyệt vời!\n\n`;

    caption += `🛒 Link in bio để order ngay!\n\n`;

    caption += `—\n`;
    caption += this.generateHashtags(product).join(' ');

    return caption;
  }

  private generateTweet(product: any): string {
    let tweet = '';

    if (product.isOnSale) {
      tweet += `🔥 SALE: `;
    } else {
      tweet += `📦 New: `;
    }

    tweet += `${product.name} `;
    tweet += `💰 ${this.formatPrice(product.price)} `;
    tweet += `⭐ ${product.rating}/5 `;

    // Add hashtags (Twitter has 280 char limit)
    const hashtags = this.generateHashtags(product).slice(0, 3);
    tweet += `\n\n${hashtags.join(' ')}`;

    // Ensure under 280 characters
    if (tweet.length > 280) {
      tweet = tweet.substring(0, 277) + '...';
    }

    return tweet;
  }

  private generateHashtags(product: any): string[] {
    const hashtags = new Set<string>();

    hashtags.add('#NEOFigure');
    hashtags.add('#Figure');
    hashtags.add('#Collectibles');

    if (product.brand) {
      hashtags.add(`#${product.brand.replace(/\s+/g, '')}`);
    }

    if (product.series) {
      const seriesTag = product.series.replace(/\s+/g, '');
      hashtags.add(`#${seriesTag}`);
    }

    if (product.categoryId?.slug) {
      hashtags.add(`#${product.categoryId.slug.replace(/-/g, '')}`);
    }

    if (product.isHot) {
      hashtags.add('#Sale');
      hashtags.add('#HotDeal');
    }

    return Array.from(hashtags).slice(0, 8);
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }
}
