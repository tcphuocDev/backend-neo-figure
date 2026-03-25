import { Controller, Get, Query } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get('run')
  async run(@Query('pages') pages = 3) {
    return this.crawlerService.crawlWithPagination(Number(pages));
  }

  @Get('danfigure')
  async crawlAll() {
    return this.crawlerService.crawlAllProducts();
  }
}
