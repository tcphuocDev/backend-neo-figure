import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { DataEnrichmentService } from './data-enrichment.service';

@Controller('agents/data-enrichment')
export class DataEnrichmentController {
  constructor(private readonly enrichmentService: DataEnrichmentService) {}

  @Post('enrich/:productId')
  async enrichProduct(@Param('productId') productId: string) {
    try {
      const result = await this.enrichmentService.enrichProduct(productId);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('enrich/:productId/apply')
  async applyEnrichment(
    @Param('productId') productId: string,
    @Body('changes') changes: any,
  ) {
    try {
      const updated = await this.enrichmentService.applyEnrichment(
        productId,
        changes,
      );

      return {
        success: true,
        product: updated,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('batch')
  async enrichBatch(@Body('limit') limit?: number) {
    try {
      const results = await this.enrichmentService.enrichBatch(limit);

      return {
        success: true,
        processed: results.length,
        results,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('validate/:productId')
  async validateProduct(@Param('productId') productId: string) {
    try {
      const validation =
        await this.enrichmentService.validateProduct(productId);

      return {
        success: true,
        ...validation,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
