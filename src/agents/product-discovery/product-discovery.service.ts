import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../../module/products/schema/product.schema';
import { Category } from '../../module/categories/schema/category.schema';

export interface SearchQuery {
  text?: string;
  category?: string;
  priceRange?: { min?: number; max?: number };
  rating?: number;
  tags?: string[];
  isHot?: boolean;
  isFeatured?: boolean;
}

export interface SearchResult {
  products: any[];
  suggestions: string[];
  filters: any;
  metadata: {
    query: SearchQuery;
    totalResults: number;
    processingTime: number;
  };
}

@Injectable()
export class ProductDiscoveryService {
  private readonly logger = new Logger(ProductDiscoveryService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  /**
   * Intelligent product search with NLP-like understanding
   */
  async intelligentSearch(
    queryText: string,
    limit = 12,
  ): Promise<SearchResult> {
    const startTime = Date.now();

    this.logger.log(`Intelligent search for: "${queryText}"`);

    // Parse query and extract intent
    const parsedQuery = await this.parseSearchQuery(queryText);

    // Build MongoDB filter
    const filter = this.buildSearchFilter(parsedQuery);

    // Execute search
    const [products, totalCount] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .limit(limit)
        .sort(this.determineSortOrder(parsedQuery))
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    // Generate suggestions
    const suggestions = await this.generateSearchSuggestions(
      queryText,
      parsedQuery,
    );

    // Extract available filters from results
    const filters = await this.extractAvailableFilters(products);

    const processingTime = Date.now() - startTime;

    return {
      products,
      suggestions,
      filters,
      metadata: {
        query: parsedQuery,
        totalResults: totalCount,
        processingTime,
      },
    };
  }

  /**
   * Parse natural language query into structured format
   */
  private async parseSearchQuery(queryText: string): Promise<SearchQuery> {
    const query: SearchQuery = {
      text: queryText,
    };

    const lowerQuery = queryText.toLowerCase();

    // Extract price range
    const pricePatterns = [
      /dưới\s+(\d+)k?\s*(triệu|tr)?/i,
      /under\s+(\d+)k?\s*(million)?/i,
      /từ\s+(\d+)\s*(đến|-)?\s*(\d+)/i,
      /between\s+(\d+)\s*(and|-)?\s*(\d+)/i,
    ];

    for (const pattern of pricePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        query.priceRange = this.extractPriceRange(match);
        break;
      }
    }

    // Extract category hints
    const categoryKeywords = {
      gundam: ['gundam', 'robot', 'mecha', 'mg', 'rg', 'hg', 'pg'],
      'anime-figure': ['figure', 'nendoroid', 'figma', 'scale', 'pvc'],
      gaming: ['game', 'gaming', 'pokemon', 'league'],
      collectibles: ['collectible', 'limited', 'rare'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => lowerQuery.includes(kw))) {
        query.category = category;
        break;
      }
    }

    // Extract rating
    if (lowerQuery.includes('rating') || lowerQuery.includes('đánh giá')) {
      const ratingMatch = lowerQuery.match(/(\d+)\s*(sao|star)/);
      if (ratingMatch) {
        query.rating = parseInt(ratingMatch[1]);
      }
    }

    // Detect hot/featured intent
    if (
      lowerQuery.includes('hot') ||
      lowerQuery.includes('sale') ||
      lowerQuery.includes('giảm giá')
    ) {
      query.isHot = true;
    }

    if (
      lowerQuery.includes('featured') ||
      lowerQuery.includes('nổi bật') ||
      lowerQuery.includes('mới')
    ) {
      query.isFeatured = true;
    }

    // Extract tags
    const tagKeywords = [
      'bandai',
      'kotobukiya',
      'good smile',
      'marvel',
      'dc',
      'pokemon',
    ];
    query.tags = tagKeywords.filter((tag) =>
      lowerQuery.includes(tag.toLowerCase()),
    );

    return query;
  }

  /**
   * Build MongoDB filter from parsed query
   */
  private buildSearchFilter(query: SearchQuery): any {
    const filter: any = {};

    // Text search
    if (query.text) {
      const searchTerms = query.text
        .split(/\s+/)
        .filter((term) => term.length > 2);

      filter.$or = [
        { name: { $regex: query.text, $options: 'i' } },
        { character: { $regex: query.text, $options: 'i' } },
        { series: { $regex: query.text, $options: 'i' } },
        { brand: { $regex: query.text, $options: 'i' } },
        { tags: { $in: searchTerms.map((term) => new RegExp(term, 'i')) } },
      ];
    }

    // Price range
    if (query.priceRange) {
      filter.price = {};
      if (query.priceRange.min) {
        filter.price.$gte = query.priceRange.min;
      }
      if (query.priceRange.max) {
        filter.price.$lte = query.priceRange.max;
      }
    }

    // Rating
    if (query.rating) {
      filter.rating = { $gte: query.rating };
    }

    // Hot/Featured
    if (query.isHot) {
      filter.isHot = true;
    }
    if (query.isFeatured) {
      filter.isFeatured = true;
    }

    // Tags
    if (query.tags && query.tags.length > 0) {
      filter.tags = { $in: query.tags.map((tag) => new RegExp(tag, 'i')) };
    }

    return filter;
  }

  /**
   * Determine sort order based on query
   */
  private determineSortOrder(query: SearchQuery): any {
    // If looking for hot/sale items, prioritize discount
    if (query.isHot) {
      return { isOnSale: -1, soldCount: -1 };
    }

    // If looking for featured/new items
    if (query.isFeatured) {
      return { createdAt: -1 };
    }

    // If price range specified, sort by price
    if (query.priceRange) {
      return { price: 1 };
    }

    // Default: sort by relevance (soldCount + rating)
    return { soldCount: -1, rating: -1 };
  }

  /**
   * Extract price range from regex match
   */
  private extractPriceRange(match: RegExpMatchArray): {
    min?: number;
    max?: number;
  } {
    const range: { min?: number; max?: number } = {};

    if (match[0].includes('dưới') || match[0].includes('under')) {
      const value = parseInt(match[1]);
      range.max = match[2] ? value * 1000000 : value * 1000; // triệu or k
    } else {
      const min = parseInt(match[1]);
      const max = match[3] ? parseInt(match[3]) : undefined;

      range.min = min * 1000; // assume in thousands
      if (max) {
        range.max = max * 1000;
      }
    }

    return range;
  }

  /**
   * Generate search suggestions
   */
  private async generateSearchSuggestions(
    originalQuery: string,
    parsedQuery: SearchQuery,
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Suggest related categories
    if (!parsedQuery.category) {
      const categories = await this.categoryModel.find().limit(5).exec();
      suggestions.push(
        ...categories.map((cat) => `${originalQuery} ${cat.name}`),
      );
    }

    // Suggest price ranges
    if (!parsedQuery.priceRange) {
      suggestions.push(
        `${originalQuery} dưới 500k`,
        `${originalQuery} từ 500k đến 1 triệu`,
        `${originalQuery} trên 1 triệu`,
      );
    }

    // Suggest hot/featured
    if (!parsedQuery.isHot) {
      suggestions.push(`${originalQuery} đang giảm giá`);
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Extract available filters from results
   */
  private async extractAvailableFilters(products: any[]): Promise<any> {
    const filters = {
      categories: new Set<string>(),
      priceRanges: [],
      brands: new Set<string>(),
      tags: new Set<string>(),
    };

    products.forEach((product) => {
      if (product.categoryId?.name) {
        filters.categories.add(product.categoryId.name);
      }
      if (product.brand) {
        filters.brands.add(product.brand);
      }
      if (product.tags) {
        product.tags.forEach((tag) => filters.tags.add(tag));
      }
    });

    // Calculate price ranges
    const prices = products.map((p) => p.price).sort((a, b) => a - b);
    if (prices.length > 0) {
      const min = prices[0];
      const max = prices[prices.length - 1];

      filters.priceRanges = [
        { label: 'Dưới 500k', min: 0, max: 500000 },
        { label: '500k - 1tr', min: 500000, max: 1000000 },
        { label: '1tr - 2tr', min: 1000000, max: 2000000 },
        { label: 'Trên 2tr', min: 2000000, max: null },
      ];
    }

    return {
      categories: Array.from(filters.categories),
      brands: Array.from(filters.brands),
      tags: Array.from(filters.tags).slice(0, 10),
      priceRanges: filters.priceRanges,
    };
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(): Promise<string[]> {
    // In production, track user searches in database
    // For now, return popular terms
    return [
      'Gundam MG',
      'Nendoroid anime',
      'Figure giảm giá',
      'Pokemon collectible',
      'Bandai mới nhất',
      'Scale 1/7',
    ];
  }

  /**
   * Get similar products based on search pattern
   */
  async getSimilarSearches(productId: string): Promise<string[]> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      return [];
    }

    const suggestions = [];

    if (product.series) {
      suggestions.push(`${product.series} figure`);
    }
    if (product.brand) {
      suggestions.push(`${product.brand} collectible`);
    }
    if (product.character) {
      suggestions.push(`${product.character} merchandise`);
    }

    return suggestions;
  }

  /**
   * Smart autocomplete
   */
  async autocomplete(partial: string, limit = 5): Promise<string[]> {
    if (partial.length < 2) {
      return [];
    }

    const products = await this.productModel
      .find({
        $or: [
          { name: { $regex: `^${partial}`, $options: 'i' } },
          { character: { $regex: `^${partial}`, $options: 'i' } },
          { series: { $regex: `^${partial}`, $options: 'i' } },
        ],
      })
      .limit(limit)
      .select('name character series')
      .exec();

    const suggestions = new Set<string>();

    products.forEach((p) => {
      suggestions.add(p.name);
      if (p.character) suggestions.add(p.character);
      if (p.series) suggestions.add(p.series);
    });

    return Array.from(suggestions).slice(0, limit);
  }
}
