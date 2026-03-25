import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { CrawlerService } from './crawler/crawler.service';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:5173',
  });

  const port = process.env.PORT || 3100;

  // Enable graceful shutdown
  app.enableShutdownHooks();

  try {
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is in use, attempting to free it...`);
      try {
        // Kill process using the port
        execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
        console.log('✓ Port freed, restarting...');
        // Wait a bit for port to be released
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await app.listen(port);
        console.log(`🚀 Application is running on: http://localhost:${port}`);
      } catch (retryError) {
        console.error('❌ Failed to start server:', retryError.message);
        process.exit(1);
      }
    } else {
      throw error;
    }
  }
}

bootstrap();
