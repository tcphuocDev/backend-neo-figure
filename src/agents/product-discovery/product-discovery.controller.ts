import { Controller, Get, Query, Post, Body, Param } from '@nestjs/common';
import { ProductDiscoveryService } from './product-discovery.service';

@Controller('agents/product-discovery')
export class ProductDiscoveryController {
  constructor(private readonly discoveryService: ProductDiscoveryService) {}

  @Post('search')
  async intelligentSearch(
    @Body('query') query: string,
    @Body('limit') limit?: number,
  ) {
    if (!query) {
      return {
        success: false,
        error: 'Query is required',
      };
    }

    const result = await this.discoveryService.intelligentSearch(query, limit);

    return {
      success: true,
      ...result,
    };
  }

  @Get('autocomplete')
  async autocomplete(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    if (!query) {
      return {
        success: false,
        suggestions: [],
      };
    }

    const suggestions = await this.discoveryService.autocomplete(
      query,
      limit ? parseInt(limit.toString()) : undefined,
    );

    return {
      success: true,
      suggestions,
    };
  }

  @Get('trending')
  async getTrendingSearches() {
    const trending = await this.discoveryService.getTrendingSearches();

    return {
      success: true,
      trending,
    };
  }

  @Get('similar/:productId')
  async getSimilarSearches(@Param('productId') productId: string) {
    const searches = await this.discoveryService.getSimilarSearches(productId);

    return {
      success: true,
      searches,
    };
  }
}
