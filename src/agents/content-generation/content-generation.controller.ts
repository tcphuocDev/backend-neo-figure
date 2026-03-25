import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { ContentGenerationService } from './content-generation.service';

@Controller('agents/content-generation')
export class ContentGenerationController {
  constructor(private readonly contentService: ContentGenerationService) {}

  @Post('description/:productId')
  async generateDescription(@Param('productId') productId: string) {
    try {
      const content = await this.contentService.generateDescription(productId);

      return {
        success: true,
        ...content,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('short-description/:productId')
  async generateShortDescription(@Param('productId') productId: string) {
    try {
      const content =
        await this.contentService.generateShortDescription(productId);

      return {
        success: true,
        ...content,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('seo/:productId')
  async generateSEOMetadata(@Param('productId') productId: string) {
    try {
      const content = await this.contentService.generateSEOMetadata(productId);

      return {
        success: true,
        ...content,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('email/:productId')
  async generateEmailContent(@Param('productId') productId: string) {
    try {
      const content = await this.contentService.generateEmailContent(productId);

      return {
        success: true,
        ...content,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('social/:productId')
  async generateSocialContent(
    @Param('productId') productId: string,
    @Body('platform') platform: 'facebook' | 'instagram' | 'twitter',
  ) {
    try {
      if (!platform) {
        return {
          success: false,
          error: 'Platform is required (facebook, instagram, twitter)',
        };
      }

      const content = await this.contentService.generateSocialContent(
        productId,
        platform,
      );

      return {
        success: true,
        ...content,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
