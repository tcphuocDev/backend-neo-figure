import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../../module/products/schema/product.schema';
import { Category } from '../../module/categories/schema/category.schema';

export interface EnrichmentResult {
  productId: string;
  changes: any;
  confidence: number;
  suggestions: string[];
}

@Injectable()
export class DataEnrichmentService {
  private readonly logger = new Logger(DataEnrichmentService.name);

  // Brand recognition patterns
  private brandPatterns = {
    Bandai: ['bandai', 'バンダイ', 'mg', 'rg', 'hg', 'pg'],
    'Good Smile Company': ['good smile', 'nendoroid', 'figma', 'scale'],
    Kotobukiya: ['kotobukiya', 'コトブキヤ', 'artfx'],
    'Square Enix': ['square enix', 'play arts', 'bring arts'],
    Megahouse: ['megahouse', 'メガハウス', 'gem'],
  };

  // Series recognition patterns
  private seriesPatterns = {
    'Mobile Suit Gundam': ['gundam', 'ガンダム', 'rx-78', 'zaku', 'nu gundam'],
    'One Piece': ['one piece', 'luffy', 'zoro', 'nami'],
    'Dragon Ball': ['dragon ball', 'goku', 'vegeta', 'gohan'],
    Marvel: ['marvel', 'iron man', 'captain america', 'avengers'],
    Pokemon: ['pokemon', 'pikachu', 'charizard'],
    'League of Legends': ['league', 'lol', 'ahri', 'yasuo'],
  };

  // Material patterns
  private materialPatterns = {
    PVC: ['pvc', 'plastic'],
    ABS: ['abs', 'plamo'],
    Resin: ['resin', 'polystone'],
    Metal: ['metal', 'diecast'],
  };

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  /**
   * Enrich a single product with missing data
   */
  async enrichProduct(productId: string): Promise<EnrichmentResult> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new Error('Product not found');
    }

    this.logger.log(`Enriching product: ${product.name}`);

    const changes: any = {};
    let confidence = 0;
    const suggestions: string[] = [];

    // Extract brand if missing
    if (!product.brand) {
      const extractedBrand = this.extractBrand(product);
      if (extractedBrand.value) {
        changes.brand = extractedBrand.value;
        confidence += extractedBrand.confidence;
        suggestions.push(`Detected brand: ${extractedBrand.value}`);
      }
    }

    // Extract series if missing
    if (!product.series) {
      const extractedSeries = this.extractSeries(product);
      if (extractedSeries.value) {
        changes.series = extractedSeries.value;
        confidence += extractedSeries.confidence;
        suggestions.push(`Detected series: ${extractedSeries.value}`);
      }
    }

    // Extract material if missing
    if (!product.material) {
      const extractedMaterial = this.extractMaterial(product);
      if (extractedMaterial.value) {
        changes.material = extractedMaterial.value;
        confidence += extractedMaterial.confidence;
        suggestions.push(`Detected material: ${extractedMaterial.value}`);
      }
    }

    // Extract character if missing
    if (!product.character) {
      const extractedCharacter = this.extractCharacter(product);
      if (extractedCharacter.value) {
        changes.character = extractedCharacter.value;
        confidence += extractedCharacter.confidence;
        suggestions.push(`Detected character: ${extractedCharacter.value}`);
      }
    }

    // Generate tags if missing or incomplete
    if (!product.tags || product.tags.length < 3) {
      const generatedTags = this.generateTags(product);
      if (generatedTags.length > 0) {
        changes.tags = [...(product.tags || []), ...generatedTags];
        confidence += 10;
        suggestions.push(`Generated ${generatedTags.length} new tags`);
      }
    }

    // Detect scale from name/description
    if (!product.scale) {
      const extractedScale = this.extractScale(product);
      if (extractedScale.value) {
        changes.scale = extractedScale.value;
        confidence += extractedScale.confidence;
        suggestions.push(`Detected scale: ${extractedScale.value}`);
      }
    }

    // Extract height if missing
    if (!product.height) {
      const extractedHeight = this.extractHeight(product);
      if (extractedHeight.value) {
        changes.height = extractedHeight.value;
        confidence += extractedHeight.confidence;
        suggestions.push(`Detected height: ${extractedHeight.value}`);
      }
    }

    // Normalize confidence score (0-100)
    confidence = Math.min(100, (confidence / 7) * 100);

    return {
      productId: product._id.toString(),
      changes,
      confidence: Math.round(confidence),
      suggestions,
    };
  }

  /**
   * Apply enrichment changes to product
   */
  async applyEnrichment(productId: string, changes: any): Promise<any> {
    const updated = await this.productModel
      .findByIdAndUpdate(productId, { $set: changes }, { new: true })
      .exec();

    this.logger.log(`Applied enrichment to product ${productId}`);

    return updated;
  }

  /**
   * Batch enrich multiple products
   */
  async enrichBatch(limit = 50): Promise<EnrichmentResult[]> {
    this.logger.log(`Starting batch enrichment (limit: ${limit})`);

    // Find products with missing data
    const products = await this.productModel
      .find({
        $or: [
          { brand: { $exists: false } },
          { series: { $exists: false } },
          { material: { $exists: false } },
          { character: { $exists: false } },
          { tags: { $size: 0 } },
        ],
      })
      .limit(limit)
      .exec();

    const results: EnrichmentResult[] = [];

    for (const product of products) {
      try {
        const result = await this.enrichProduct(product._id.toString());
        results.push(result);

        // Auto-apply if confidence is high
        if (result.confidence > 70) {
          await this.applyEnrichment(product._id.toString(), result.changes);
        }
      } catch (error) {
        this.logger.error(
          `Error enriching product ${product._id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Batch enrichment completed: ${results.length} products processed`,
    );

    return results;
  }

  /**
   * Extract brand from product data
   */
  private extractBrand(product: any): {
    value: string | null;
    confidence: number;
  } {
    const searchText =
      `${product.name} ${product.description || ''} ${product.tags?.join(' ') || ''}`.toLowerCase();

    for (const [brand, patterns] of Object.entries(this.brandPatterns)) {
      for (const pattern of patterns) {
        if (searchText.includes(pattern.toLowerCase())) {
          return { value: brand, confidence: 15 };
        }
      }
    }

    return { value: null, confidence: 0 };
  }

  /**
   * Extract series from product data
   */
  private extractSeries(product: any): {
    value: string | null;
    confidence: number;
  } {
    const searchText =
      `${product.name} ${product.description || ''} ${product.tags?.join(' ') || ''}`.toLowerCase();

    for (const [series, patterns] of Object.entries(this.seriesPatterns)) {
      for (const pattern of patterns) {
        if (searchText.includes(pattern.toLowerCase())) {
          return { value: series, confidence: 15 };
        }
      }
    }

    return { value: null, confidence: 0 };
  }

  /**
   * Extract material from product data
   */
  private extractMaterial(product: any): {
    value: string | null;
    confidence: number;
  } {
    const searchText =
      `${product.name} ${product.description || ''}`.toLowerCase();

    for (const [material, patterns] of Object.entries(this.materialPatterns)) {
      for (const pattern of patterns) {
        if (searchText.includes(pattern.toLowerCase())) {
          return { value: material, confidence: 10 };
        }
      }
    }

    return { value: null, confidence: 0 };
  }

  /**
   * Extract character name from product name
   */
  private extractCharacter(product: any): {
    value: string | null;
    confidence: number;
  } {
    // Try to extract character from product name
    // Pattern: "Series - Character Name - Description"
    const nameParts = product.name.split(/[-–—]/);

    if (nameParts.length >= 2) {
      const potentialCharacter = nameParts[1].trim();

      // Validate it's not a common word
      const commonWords = [
        'figure',
        'model',
        'scale',
        'limited',
        'edition',
        'ver',
        'version',
      ];
      const isCommonWord = commonWords.some((word) =>
        potentialCharacter.toLowerCase().includes(word),
      );

      if (
        !isCommonWord &&
        potentialCharacter.length > 2 &&
        potentialCharacter.length < 50
      ) {
        return { value: potentialCharacter, confidence: 12 };
      }
    }

    return { value: null, confidence: 0 };
  }

  /**
   * Generate relevant tags from product data
   */
  private generateTags(product: any): string[] {
    const tags = new Set<string>();

    // Add brand as tag
    if (product.brand) {
      tags.add(product.brand.toLowerCase());
    }

    // Add series as tag
    if (product.series) {
      tags.add(product.series.toLowerCase());
    }

    // Add category tags
    if (product.categoryId?.name) {
      tags.add(product.categoryId.name.toLowerCase());
    }

    // Add material tag
    if (product.material) {
      tags.add(product.material.toLowerCase());
    }

    // Add scale tag
    if (product.scale) {
      tags.add(`scale-${product.scale}`);
    }

    // Add condition tags
    if (product.isHot) {
      tags.add('hot-deal');
      tags.add('sale');
    }

    if (product.isFeatured) {
      tags.add('featured');
      tags.add('popular');
    }

    // Add price range tag
    if (product.price < 500000) {
      tags.add('affordable');
    } else if (product.price > 2000000) {
      tags.add('premium');
    }

    // Remove existing tags
    const existingTags = product.tags || [];
    existingTags.forEach((tag) => tags.delete(tag.toLowerCase()));

    return Array.from(tags).slice(0, 5);
  }

  /**
   * Extract scale from product name/description
   */
  private extractScale(product: any): {
    value: string | null;
    confidence: number;
  } {
    const searchText =
      `${product.name} ${product.description || ''}`.toLowerCase();

    // Pattern: 1/7, 1:7, 1/144, etc
    const scalePattern = /1[\/:](\d+)/;
    const match = searchText.match(scalePattern);

    if (match) {
      return { value: `1/${match[1]}`, confidence: 15 };
    }

    return { value: null, confidence: 0 };
  }

  /**
   * Extract height from product description
   */
  private extractHeight(product: any): {
    value: string | null;
    confidence: number;
  } {
    const searchText = `${product.name} ${product.description || ''}`;

    // Pattern: 20cm, 15.5cm, 300mm, etc
    const heightPattern = /(\d+(?:\.\d+)?)\s*(cm|mm)/i;
    const match = searchText.match(heightPattern);

    if (match) {
      let height = parseFloat(match[1]);
      const unit = match[2].toLowerCase();

      // Convert to cm
      if (unit === 'mm') {
        height = height / 10;
      }

      return { value: `${height}cm`, confidence: 10 };
    }

    return { value: null, confidence: 0 };
  }

  /**
   * Validate product data quality
   */
  async validateProduct(productId: string): Promise<any> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new Error('Product not found');
    }

    const issues: string[] = [];
    const score = { total: 0, max: 0 };

    // Check required fields
    const requiredFields = ['name', 'price', 'thumbnail', 'categoryId'];
    requiredFields.forEach((field) => {
      score.max += 10;
      if (product[field]) {
        score.total += 10;
      } else {
        issues.push(`Missing required field: ${field}`);
      }
    });

    // Check optional but important fields
    const importantFields = ['brand', 'series', 'character', 'description'];
    importantFields.forEach((field) => {
      score.max += 5;
      if (product[field]) {
        score.total += 5;
      } else {
        issues.push(`Missing important field: ${field}`);
      }
    });

    // Check data quality
    score.max += 10;
    if (product.tags && product.tags.length >= 3) {
      score.total += 10;
    } else {
      issues.push('Insufficient tags (need at least 3)');
    }

    score.max += 10;
    if (product.images && product.images.length >= 2) {
      score.total += 10;
    } else {
      issues.push('Insufficient images (need at least 2)');
    }

    score.max += 5;
    if (product.description && product.description.length > 50) {
      score.total += 5;
    } else {
      issues.push('Description too short');
    }

    const qualityScore = Math.round((score.total / score.max) * 100);

    return {
      productId,
      qualityScore,
      issues,
      needsEnrichment: qualityScore < 80,
    };
  }
}
