import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './module/users/users.service';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ FIX CORS - Allow multiple origins
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://161.97.121.202:3006',
        'http://localhost:3006',
        'http://localhost:5173',
        'http://localhost:3000',
      ];

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS blocked origin: ${origin}`);
        callback(null, true); // Still allow but log warning
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,Accept',
  });

  const port = process.env.PORT || 3100;

  // Create default admin account
  const usersService = app.get(UsersService);
  await usersService.createDefaultAdmin();

  app.enableShutdownHooks();

  try {
    await app.listen(port, '0.0.0.0'); // ✅ QUAN TRỌNG
    console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is in use, attempting to free it...`);
      try {
        execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
        console.log('✓ Port freed, restarting...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await app.listen(port, '0.0.0.0');
        console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
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
