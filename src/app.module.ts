import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CategoriesModule } from './module/categories/categories.module';
import { OrdersModule } from './module/orders/orders.module';
import { ProductsModule } from './module/products/products.module';
import { UploadModule } from './upload/upload.module';
import { CrawlerModule } from './crawler/crawler.module';
import { UsersModule } from './module/users/users.module';
import { AuthModule } from './auth/auth.module';
// AI Agents
import { ShoppingAssistantModule } from './agents/shopping-assistant/shopping-assistant.module';
import { ProductDiscoveryModule } from './agents/product-discovery/product-discovery.module';
import { DataEnrichmentModule } from './agents/data-enrichment/data-enrichment.module';
import { ContentGenerationModule } from './agents/content-generation/content-generation.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    CategoriesModule,
    OrdersModule,
    ProductsModule,
    UploadModule,
    CrawlerModule,
    // AI Agents
    ShoppingAssistantModule,
    ProductDiscoveryModule,
    DataEnrichmentModule,
    ContentGenerationModule,
  ],
})
export class AppModule {}
