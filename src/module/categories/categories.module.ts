import { Module } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schema/category.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }])],  
  providers: [CategoryService],
  controllers: [CategoriesController]
})
export class CategoriesModule {}
